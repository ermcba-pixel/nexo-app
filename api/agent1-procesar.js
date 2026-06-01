import { sb, logAgent, hasServiceRole } from './_nexo-supabase.js';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}
function num(v){ const n=Number(v||0); return Number.isFinite(n)?Number(n.toFixed(2)):0; }
function safe(s){ return encodeURIComponent(String(s||'')); }
function providerName(row){
  const txt = JSON.stringify(row || {}).toLowerCase();
  if(txt.includes('cj') || txt.includes('cjdropshipping')) return 'CJ Dropshipping';
  if(txt.includes('amazon')) return 'Amazon / Marketplace';
  return row.proveedor || row.provider || 'Proveedor internacional';
}
function isCJ(row){ return providerName(row).toLowerCase().includes('cj'); }
function amazonUrl(row){
  const tag = row.amazon_tag || process.env.AMAZON_ASSOCIATE_TAG || 'nexo08-20';
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
      const provider = providerName(p);
      const cj = isCJ(p);
      const link = cj ? (p.producto_url || p.provider_url || 'CJ Dropshipping API') : amazonUrl(p);
      const commission = num(p.comision_nexo_usd || p.ganancia_nexo || 0);
      const providerCost = num((p.costo_producto_usd||0) + (p.costo_envio_usd||0) + (p.costo_proveedor||0));
      const estadoAgente = cj ? 'compra_cj_lista_api' : (amazonProduction ? 'compra_amazon_lista_api' : 'cola_compra_proveedor');
      const estadoCompra = cj ? 'pendiente_ejecucion_cj_api' : (amazonProduction ? 'pendiente_ejecucion_amazon_api' : 'pendiente_compra_asistida_amazon');
      await sb(`pedidos?id=eq.${safe(p.id)}`, {method:'PATCH', body:JSON.stringify({
        estado:'pagado_en_proceso',
        estado_agente: estadoAgente,
        estado_compra: estadoCompra,
        estado_envio:'En preparación',
        proveedor_estado: cj ? 'pendiente_orden_cj' : 'pendiente_compra_proveedor',
        proveedor: provider,
        tracking: p.tracking || (cj ? 'PENDIENTE_CJ' : 'PENDIENTE_AMAZON')
      })});
      await sb('tracking_envios', {method:'POST', body:JSON.stringify([{pedido_id:p.id,courier:provider,tracking:cj?'PENDIENTE_CJ':'PENDIENTE_AMAZON',tracking_url:link,estado_envio:'En preparación',fecha_estimada_entrega:p.fecha_estimada_entrega||''}])}).catch(()=>{});
      let cjOrder = null;
      if(cj){
        try{
          const proto = req.headers['x-forwarded-proto'] || 'https';
          const host = req.headers.host;
          const cr = await fetch(`${proto}://${host}/api/agent1-cj-order`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...p, paymentVerified:true, estado_pago:'paypal_pagado_capturado'})});
          cjOrder = await cr.json().catch(()=>({ok:false,error:'cj_json_failed'}));
          await logAgent(p.id,'agente1_cj_preparado',cjOrder?.ok?'cj_api_ready':'cj_pendiente',`CJ Dropshipping: ${cjOrder?.message || cjOrder?.estado || 'orden preparada'}`);
        }catch(e){ cjOrder = {ok:false,error:e.message||String(e)}; }
      }
      await logAgent(p.id,'agente1_toma_pedido',estadoAgente,`Pago confirmado. Proveedor: ${provider}. Costo proveedor estimado USD ${providerCost}. Comisión nexo USD ${commission}. Link/API: ${link}`);
      processed.push({pedido_id:p.id, proveedor:provider, estado_agente:estadoAgente, provider_url:link, comision_nexo_usd:commission, proveedor_total_usd:providerCost, cjOrder});
    }
    return res.status(200).json({ok:true,processed_count:processed.length,processed,next:'PayPal webhook/capture confirma pago; Agente 1 procesa CJ por API cuando CJ_API_KEY está configurada y deja Amazon en cola hasta autorización de compra API.'});
  }catch(e){
    return res.status(e.statusCode||500).json({ok:false,error:e.message||String(e),detail:e.detail||null});
  }
}
