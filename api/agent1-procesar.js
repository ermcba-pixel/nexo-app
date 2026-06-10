import { sb, logAgent, hasServiceRole } from './_nexo-supabase.js';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}

function num(v){
  const n = Number(v || 0);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function safe(s){
  return encodeURIComponent(String(s || ''));
}

function normalizeProvider(value=''){
  const v = String(value || '').toLowerCase();
  if(v.includes('amazon')) return 'amazon';
  if(v.includes('cj')) return 'cj';
  if(v.includes('alibaba')) return 'alibaba';
  if(v.includes('aliexpress')) return 'aliexpress';
  if(v.includes('temu')) return 'temu';
  if(v.includes('mercado')) return 'mercadolibre';
  if(v.includes('ebay')) return 'ebay';
  if(v.includes('walmart')) return 'walmart';
  if(v.includes('etsy')) return 'etsy';
  if(v.includes('shopify')) return 'shopify';
  if(v.includes('lazada')) return 'lazada';
  return 'amazon';
}

function amazonUrl(row){
  const tag = row.amazon_tag || process.env.AMAZON_ASSOCIATE_TAG || 'nexo08-20';
  const asin = row.amazon_asin && !String(row.amazon_asin).includes('PENDIENTE') ? row.amazon_asin : '';
  if(asin) return `https://www.amazon.com/dp/${safe(asin)}?tag=${safe(tag)}`;
  if(row.producto_url) return String(row.producto_url).includes('tag=') ? row.producto_url : `${row.producto_url}${row.producto_url.includes('?')?'&':'?'}tag=${safe(tag)}`;
  return `https://www.amazon.com/s?k=${safe(row.producto_nombre || row.producto || 'producto')}&tag=${safe(tag)}`;
}

function providerUrl(row, codigo){
  if(codigo === 'amazon') return amazonUrl(row);
  if(row.producto_url) return row.producto_url;
  if(codigo === 'alibaba') return `https://www.alibaba.com/trade/search?SearchText=${safe(row.producto_nombre || row.producto || 'producto')}`;
  if(codigo === 'aliexpress') return `https://www.aliexpress.com/wholesale?SearchText=${safe(row.producto_nombre || row.producto || 'producto')}`;
  if(codigo === 'cj') return `https://cjdropshipping.com/search/${safe(row.producto_nombre || row.producto || 'producto')}`;
  if(codigo === 'temu') return `https://www.temu.com/search_result.html?search_key=${safe(row.producto_nombre || row.producto || 'producto')}`;
  return row.producto_url || '';
}

async function getProveedor(codigo){
  try{
    const rows = await sb(`proveedores?select=id,nombre,codigo&codigo=eq.${safe(codigo)}&limit=1`, {headers:{Prefer:''}});
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }catch(e){
    return null;
  }
}

async function compraProveedorExiste(pedidoId){
  try{
    const rows = await sb(`compras_proveedor?select=id,estado&pedido_id=eq.${safe(pedidoId)}&limit=1`, {headers:{Prefer:''}});
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }catch(e){
    return null;
  }
}

async function registrarCompraProveedor(p, proveedor, codigo, link, providerCost, estadoCompra){
  const existe = await compraProveedorExiste(p.id);
  const payload = {
    pedido_id: p.id,
    proveedor_id: proveedor?.id || null,
    marketplace: proveedor?.nombre || codigo,
    proveedor_nombre: proveedor?.nombre || codigo,
    producto_nombre: p.producto_nombre || p.producto || p.nombre_producto || '',
    sku_proveedor: p.amazon_asin || p.sku_proveedor || p.sku || '',
    url_producto: link,
    cantidad: Number(p.cantidad || 1),
    precio_unitario: num(p.precio_unitario_proveedor || p.precio_proveedor || p.costo_producto_usd || p.costo_producto || 0),
    costo_producto: num(p.costo_producto_usd || p.costo_producto || p.precio_proveedor || 0),
    costo_envio: num(p.costo_envio_usd || p.costo_envio || 0),
    costo_total: providerCost,
    moneda: p.moneda_proveedor || p.moneda || 'USD',
    metodo_pago: p.metodo_pago_proveedor || p.metodo_pago_agente1 || 'pendiente',
    cuenta_pago: p.cuenta_pago_proveedor || '',
    referencia_pago: p.referencia_pago_proveedor || '',
    estado: estadoCompra,
    tracking_proveedor: p.tracking_proveedor || '',
    tracking_final: p.tracking || '',
    observaciones: `Agente 1 registró compra proveedor en cola. Pedido pagado por cliente. Proveedor: ${proveedor?.nombre || codigo}.`,
    fecha_compra: null,
    fecha_actualizacion: new Date().toISOString()
  };

  if(existe?.id){
    await sb(`compras_proveedor?id=eq.${safe(existe.id)}`, {method:'PATCH', body:JSON.stringify(payload)});
    return {accion:'actualizada', id:existe.id};
  }

  payload.fecha_creacion = new Date().toISOString();
  const inserted = await sb('compras_proveedor', {method:'POST', body:JSON.stringify([payload])});
  return {accion:'creada', id:inserted?.[0]?.id || null};
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();

  if(req.method==='GET' && req.query?.health==='1'){
    return res.status(200).json({
      ok:true,
      service:'agent1-procesar',
      serviceRole:hasServiceRole(),
      amazonProductionEnabled:String(process.env.AMAZON_AUTO_PURCHASE_ENABLED||'').toLowerCase()==='true',
      newTables:['proveedores','proveedor_productos','compras_proveedor']
    });
  }

  if(req.method!=='GET' && req.method!=='POST'){
    return res.status(405).json({ok:false,error:'Método no permitido'});
  }

  try{
    const limit = Math.min(Number(req.query?.limit || req.body?.limit || 10), 25);
    const rows = await sb(`pedidos?select=*&estado_pago=in.(paypal_pagado_capturado,pagado,pago_confirmado)&estado_agente=in.(pendiente,pago_confirmado,pendiente_compra)&order=creado_en.asc&limit=${limit}`, {headers:{Prefer:''}}).catch(()=>[]);

    const processed=[];
    const amazonProduction = String(process.env.AMAZON_AUTO_PURCHASE_ENABLED || '').toLowerCase() === 'true';

    for(const p of rows || []){
      const codigo = normalizeProvider(p.proveedor || p.marketplace || p.proveedor_nombre || p.producto_url || 'amazon');
      const proveedor = await getProveedor(codigo);
      const link = providerUrl(p, codigo);

      const commission = num(p.comision_nexo_usd || p.ganancia_nexo || 0);
      const providerCost = num((p.costo_producto_usd||0) + (p.costo_envio_usd||0) + (p.costo_proveedor||0));
      const estadoAgente = amazonProduction && codigo === 'amazon' ? 'compra_amazon_lista_api' : 'cola_compra_proveedor';
      const estadoCompra = amazonProduction && codigo === 'amazon' ? 'pendiente_ejecucion_amazon_api' : `pendiente_compra_asistida_${codigo}`;

      await sb(`pedidos?id=eq.${safe(p.id)}`, {
        method:'PATCH',
        body:JSON.stringify({
          estado:'pagado_en_proceso',
          estado_agente: estadoAgente,
          estado_compra: estadoCompra,
          estado_envio:'En preparación',
          proveedor_estado:'pendiente_compra_proveedor',
          tracking: p.tracking || 'PENDIENTE_PROVEEDOR'
        })
      });

      const compra = await registrarCompraProveedor(p, proveedor, codigo, link, providerCost, estadoCompra);

      await sb('tracking_envios', {
        method:'POST',
        body:JSON.stringify([{
          pedido_id:p.id,
          courier: proveedor?.nombre || codigo,
          tracking:'PENDIENTE_PROVEEDOR',
          tracking_url:link,
          estado_envio:'En preparación',
          fecha_estimada_entrega:p.fecha_estimada_entrega||''
        }])
      }).catch(()=>{});

      await logAgent(
        p.id,
        'agente1_toma_pedido',
        estadoAgente,
        `Pago confirmado. Proveedor ${proveedor?.nombre || codigo}. Costo proveedor estimado USD ${providerCost}. Comisión nexo USD ${commission}. Link proveedor: ${link}. Compra proveedor ${compra.accion}.`
      );

      processed.push({
        pedido_id:p.id,
        proveedor: proveedor?.nombre || codigo,
        estado_agente:estadoAgente,
        compra_proveedor:compra,
        proveedor_url:link,
        comision_nexo_usd:commission,
        proveedor_total_usd:providerCost
      });
    }

    return res.status(200).json({
      ok:true,
      processed_count:processed.length,
      processed,
      next:'Agente 1 registra compra en compras_proveedor y deja cola operativa hasta API/pago automático autorizado.'
    });
  }catch(e){
    return res.status(e.statusCode||500).json({ok:false,error:e.message||String(e),detail:e.detail||null});
  }
}
