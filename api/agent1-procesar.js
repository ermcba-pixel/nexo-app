import { sb, logAgent, hasServiceRole } from './_nexo-supabase.js';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}
function num(v){ const n=Number(v||0); return Number.isFinite(n)?Number(n.toFixed(2)):0; }
function safe(s){ return encodeURIComponent(String(s||'')); }
function amazonUrl(row){
  const tag = row.amazon_tag || process.env.AMAZON_ASSOCIATE_TAG || 'nexo20-8';
  const asin = row.amazon_asin && !String(row.amazon_asin).includes('PENDIENTE') ? row.amazon_asin : '';
  if(asin) return `https://www.amazon.com/dp/${safe(asin)}?tag=${safe(tag)}`;
  if(row.producto_url) return String(row.producto_url).includes('tag=') ? row.producto_url : `${row.producto_url}${row.producto_url.includes('?')?'&':'?'}tag=${safe(tag)}`;
  return `https://www.amazon.com/s?k=${safe(row.producto_nombre || row.producto || 'producto')}&tag=${safe(tag)}`;
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET' && req.query?.health==='1'){
    return res.status(200).json({ok:true,service:'agent1-procesar',serviceRole:hasServiceRole(),amazonProductionEnabled:String(process.env.AMAZON_AUTO_PURCHASE_ENABLED||'').toLowerCase()==='true'});
  }
  if(req.method!=='GET' && req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const limit = Math.min(Number(req.query?.limit || req.body?.limit || 10), 25);
    const rows = await sb(`pedidos?select=*&estado_pago=in.(paypal_pagado_capturado,pagado,pago_confirmado)&estado_agente=in.(pendiente,pago_confirmado,pendiente_compra)&order=creado_en.asc&limit=${limit}`, {headers:{Prefer:''}}).catch(()=>[]);
    const processed=[];
    const amazonProduction = String(process.env.AMAZON_AUTO_PURCHASE_ENABLED || '').toLowerCase() === 'true';
    for(const p of rows || []){
      const link = amazonUrl(p);
      const commission = num(p.comision_nexo_usd || p.ganancia_nexo || 0);
      const providerCost = num((p.costo_producto_usd||0) + (p.costo_envio_usd||0) + (p.costo_proveedor||0));
      const estadoAgente = amazonProduction ? 'compra_amazon_lista_api' : 'cola_compra_proveedor';
      const estadoCompra = amazonProduction ? 'pendiente_ejecucion_amazon_api' : 'pendiente_compra_asistida_amazon';
      await sb(`pedidos?id=eq.${safe(p.id)}`, {method:'PATCH', body:JSON.stringify({
        estado:'pagado_en_proceso',
        estado_agente: estadoAgente,
        estado_compra: estadoCompra,
        estado_envio:'En preparación',
        proveedor_estado:'pendiente_compra_proveedor',
        tracking: p.tracking || 'PENDIENTE_AMAZON'
      })});
      await sb('tracking_envios', {method:'POST', body:JSON.stringify([{pedido_id:p.id,courier:'Amazon / Marketplace',tracking:'PENDIENTE_AMAZON',tracking_url:link,estado_envio:'En preparación',fecha_estimada_entrega:p.fecha_estimada_entrega||''}])}).catch(()=>{});
      await logAgent(p.id,'agente1_toma_pedido',estadoAgente,`Pago confirmado. Costo proveedor estimado USD ${providerCost}. Comisión nexo USD ${commission}. Link proveedor: ${link}`);
      processed.push({pedido_id:p.id, estado_agente:estadoAgente, amazon_url:link, comision_nexo_usd:commission, proveedor_total_usd:providerCost});
    }
    return res.status(200).json({ok:true,processed_count:processed.length,processed,next:'PayPal webhook/capture confirma pago; Agente 1 deja compra en cola operativa hasta API Amazon autorizada.'});
  }catch(e){
    return res.status(e.statusCode||500).json({ok:false,error:e.message||String(e),detail:e.detail||null});
  }
}
