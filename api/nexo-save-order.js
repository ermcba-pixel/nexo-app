
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv';
async function rest(path, options={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(options.headers||{}) }});
  const text = await r.text(); let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
const num=v=>Number(Number(v||0).toFixed(2));
function extractAsin(url){
  const u=String(url||'');
  const m=u.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i) || u.match(/[?&]asin=([A-Z0-9]{10})(?:&|$)/i);
  return m ? m[1].toUpperCase() : 'PENDIENTE_API';
}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try{
    const o = typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const c = o.customer || {};
    const parts = String(o.fullName||c.fullName||'').trim().split(/\s+/); const nombre=parts.shift()||''; const apellido=parts.join(' ');
    const clienteRow = { nombre, apellido, email:o.email||c.email||'', telefono:(c.phone||o.phone||'').replace(/^\+?\d+\s+/,''), pais:c.country||o.country||'', direccion:c.address||o.address||'', documento:c.documentId||'', codigo_area:c.areaCode||'', codigo_postal:c.zipCode||o.zipCode||'', region:c.region||o.region||'', ciudad:c.city||o.city||'' };
    let cliente_id=null;
    if(clienteRow.email){
      const ex = await rest(`clientes?select=id&email=eq.${encodeURIComponent(clienteRow.email)}&limit=1`, {headers:{Prefer:''}}).catch(()=>[]);
      if(ex && ex[0]?.id){ cliente_id=ex[0].id; await rest(`clientes?id=eq.${cliente_id}`, {method:'PATCH', body:JSON.stringify(clienteRow)}).catch(()=>{}); }
      else { const ins=await rest('clientes', {method:'POST', body:JSON.stringify([clienteRow])}); cliente_id=ins?.[0]?.id||null; }
    }
    const items=Array.isArray(o.items)?o.items:[]; const first=items[0]||{};
    const subtotal=num(o.subtotal||o.totals?.subtotal); const envio=num(o.amazonShipping||o.totals?.amazonShipping); const vendor=num(o.vendorFees||o.totals?.vendorFees); const commission=num(o.commission||o.totals?.commission||subtotal*0.30); const total=num(o.total||o.totals?.total||subtotal+envio+vendor+commission);
    const firstUrl = first.sourceUrl || first.url || '';
    const firstAsin = extractAsin(firstUrl);
    const invoiceNumber = o.invoice || o.factura_numero || o.id || `NEXO-${Date.now()}`;
    const pedidoRow = {
      cliente_id, cliente_email:clienteRow.email, cliente_nombre:nombre, cliente_apellido:apellido, cliente_documento:clienteRow.documento, cliente_telefono:c.phone||o.phone||'', cliente_pais:clienteRow.pais, cliente_ciudad:clienteRow.ciudad, cliente_direccion:clienteRow.direccion,
      producto:items.map(i=>`${i.name||i.nombre||'Producto'} x${i.quantity||1}`).join(' | ')||first.name||'Pedido nexo™', producto_url:firstUrl, producto_nombre:first.name||first.nombre||'Producto nexo™', proveedor:first.provider||'CJ Dropshipping', cantidad:items.reduce((a,i)=>a+Number(i.quantity||1),0)||1,
      precio_usd:total, costo_producto_usd:subtotal, costo_envio_usd:envio, costo_proveedor:vendor, comision_nexo_usd:commission, ganancia_nexo:commission, impuesto_it_usd:num(o.itf||o.totals?.itf), impuesto_iue_usd:num(o.iue||o.totals?.iue), total_cliente_usd:total,
      moneda:'USD', metodo_pago:o.paymentMethod||'card', estado:'pendiente', estado_pago:o.estado_pago||'pendiente', estado_compra:'pendiente_agente_1', estado_envio:'En preparación', tracking:'PENDIENTE_CJ', fecha_estimada_entrega:o.deliveryEstimate||'', prioridad_envio:o.deliveryLabel||o.shippingPriority||'', observaciones:o.note||'', estado_agente:'pendiente', amazon_tag:'nexo08-20', amazon_asin:firstAsin, factura_numero:invoiceNumber
    };
    const pedido=await rest('pedidos', {method:'POST', body:JSON.stringify([pedidoRow])}); const pedido_id=pedido?.[0]?.id;
    await rest('pagos', {method:'POST', body:JSON.stringify([{pedido_id, cliente_id, metodo:pedidoRow.metodo_pago, estado:pedidoRow.estado_pago, monto_usd:total, moneda:'USD'}])}).catch(()=>{});
    const numeroFiscal = clienteRow.pais && String(clienteRow.pais).toLowerCase().includes('bolivia') ? (clienteRow.documento || '') : '99001';
    await rest('facturas', {method:'POST', body:JSON.stringify([{pedido_id, cliente_id, numero_factura:pedidoRow.factura_numero, numero_fiscal: numeroFiscal, cliente_nombre:String(o.fullName||c.fullName||'').trim(), cliente_documento:clienteRow.documento, total_usd:total, metodo_pago:pedidoRow.metodo_pago}])}).catch(()=>{});
    await rest('tracking_envios', {method:'POST', body:JSON.stringify([{pedido_id, courier:'Amazon / Marketplace', tracking:'PENDIENTE_CJ', tracking_url:firstUrl, estado_envio:'En preparación', fecha_estimada_entrega:pedidoRow.fecha_estimada_entrega}])}).catch(()=>{});
    await rest('logs_agente1', {method:'POST', body:JSON.stringify([{pedido_id, accion:'pedido_registrado', estado:'pendiente', detalle:'Pedido registrado desde checkout nexo™ con costos CJ reales cuando CJ los devuelve'}])}).catch(()=>{});
    // Vincular clicks de afiliado Amazon previos con el pedido y cliente reales.
    if(firstUrl){
      const safeUrl = encodeURIComponent(firstUrl);
      await rest(`afiliados_amazon?amazon_url=eq.${safeUrl}&pedido_id=is.null`, {method:'PATCH', body:JSON.stringify({pedido_id, cliente_id, amazon_asin:firstAsin})}).catch(()=>{});
    }
    if(cliente_id){
      await rest(`afiliados_amazon?cliente_id=is.null&order=creado_en.desc&limit=3`, {method:'PATCH', body:JSON.stringify({cliente_id})}).catch(()=>{});
    }

    if(first.name) await rest('productos', {method:'POST', body:JSON.stringify([{nombre:first.name, proveedor:first.provider||'CJ Dropshipping', amazon_asin:firstAsin, amazon_url:firstUrl, amazon_tag:'nexo08-20', imagen_url:first.image||'', precio_usd:num(first.price), stock:String(first.stock||'Verificar en CJ'), categoria:first.category||''}])}).catch(()=>{});
    return res.status(200).json({ok:true,pedido_id,cliente_id,factura_numero:pedidoRow.factura_numero});
  }catch(e){ return res.status(200).json({ok:false,error:e.message||String(e)}); }
}
