import { sb, logAgent, hasServiceRole } from './_nexo-supabase.js';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}
function num(v){ const n=Number(v||0); return Number.isFinite(n)?Number(n.toFixed(2)):0; }
function safe(s){ return encodeURIComponent(String(s||'')); }
function providerUrl(row){
  if(row.producto_url) return row.producto_url;
  return `https://www.cjdropshipping.com/search/${safe(row.producto_nombre || row.producto || 'producto')}.html`;
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET' && req.query?.health==='1'){
    return res.status(200).json({ok:true,service:'agent1-procesar',serviceRole:hasServiceRole(),cjConfigured:Boolean(process.env.CJ_API_KEY)});
  }
  if(req.method!=='GET' && req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const limit = Math.min(Number(req.query?.limit || req.body?.limit || 10), 25);
    const rows = await sb(`pedidos?select=*&estado_pago=in.(paypal_pagado_capturado,pagado,pago_confirmado)&estado_agente=in.(pendiente,pago_confirmado,pendiente_compra)&order=creado_en.asc&limit=${limit}`, {headers:{Prefer:''}}).catch(()=>[]);
    const processed=[];
    
    for(const p of rows || []){
      const link = providerUrl(p);
      const commission = num(p.comision_nexo_usd || p.ganancia_nexo || 0);
      const providerCost = num((p.costo_producto_usd||0) + (p.costo_envio_usd||0) + (p.costo_proveedor||0));
      const cjConfigured = Boolean(process.env.CJ_API_KEY);
      const estadoAgente = cjConfigured ? 'compra_cj_lista_api' : 'cola_compra_proveedor';
      const estadoCompra = cjConfigured ? 'pendiente_ejecucion_cj_api' : 'pendiente_compra_asistida_cj';
      await sb(`pedidos?id=eq.${safe(p.id)}`, {method:'PATCH', body:JSON.stringify({
        estado:'pagado_en_proceso',
        estado_agente: estadoAgente,
        estado_compra: estadoCompra,
        estado_envio:'En preparación',
        proveedor_estado:'pendiente_compra_proveedor',
        tracking: p.tracking || 'PENDIENTE_CJ'
      })});
      await sb('tracking_envios', {method:'POST', body:JSON.stringify([{pedido_id:p.id,courier:'CJ Dropshipping',tracking:'PENDIENTE_CJ',tracking_url:link,estado_envio:'En preparación',fecha_estimada_entrega:p.fecha_estimada_entrega||''}])}).catch(()=>{});
      await logAgent(p.id,'agente1_toma_pedido',estadoAgente,`Pago confirmado. Costo proveedor estimado USD ${providerCost}. Comisión nexo USD ${commission}. Link CJ/proveedor: ${link}`);
      processed.push({pedido_id:p.id, estado_agente:estadoAgente, proveedor_url:link, comision_nexo_usd:commission, proveedor_total_usd:providerCost});
    }
    return res.status(200).json({ok:true,processed_count:processed.length,processed,next:'PayPal webhook/capture confirma pago; Agente 1 deja compra CJ en cola operativa con CJ_API_KEY.'});
  }catch(e){
    return res.status(e.statusCode||500).json({ok:false,error:e.message||String(e),detail:e.detail||null});
  }
}
