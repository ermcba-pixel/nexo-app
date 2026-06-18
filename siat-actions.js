import { sb, logAgent, getPedidoIdFromPayPalCapture, getCaptureInfo } from './_nexo-supabase.js';

const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase();
const PAYPAL_BASE = PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Paypal-Transmission-Id, Paypal-Transmission-Time, Paypal-Transmission-Sig, Paypal-Cert-Url, Paypal-Auth-Algo');
}
async function getAccessToken(){
  const clientId=(process.env.PAYPAL_CLIENT_ID||'').trim();
  const clientSecret=(process.env.PAYPAL_CLIENT_SECRET||'').trim();
  if(!clientId||!clientSecret) throw new Error('missing_paypal_env');
  const auth=Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const r=await fetch(`${PAYPAL_BASE}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data?.error_description || data?.error || 'paypal_oauth_failed');
  return data.access_token;
}
async function verifyWebhook(req, event){
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || process.env.PAYPAL_WEBHOOK_ID_LIVE || '';
  if(!webhookId) return {verified:false, reason:'PAYPAL_WEBHOOK_ID no configurado; evento recibido pero no verificado criptográficamente'};
  const token = await getAccessToken();
  const payload = {
    auth_algo: req.headers['paypal-auth-algo'],
    cert_url: req.headers['paypal-cert-url'],
    transmission_id: req.headers['paypal-transmission-id'],
    transmission_sig: req.headers['paypal-transmission-sig'],
    transmission_time: req.headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: event
  };
  const r=await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>({}));
  return {verified:data?.verification_status === 'SUCCESS', paypal:data};
}
async function processPaid(pedidoId, info, rawEvent){
  if(!pedidoId) return {updated:false, reason:'No se pudo identificar pedido_id desde PayPal'};
  await sb(`pedidos?id=eq.${encodeURIComponent(pedidoId)}`, {method:'PATCH', body:JSON.stringify({estado_pago:'paypal_pagado_capturado', estado:'pagado', estado_agente:'pago_confirmado', estado_compra:'pendiente_agente_1', estado_envio:'En preparación'})});
  await sb('pagos', {method:'POST', body:JSON.stringify([{pedido_id:pedidoId, metodo:'paypal', estado:'capturado', monto_usd:info.amount, moneda:info.currency, paypal_capture_id:info.captureId, paypal_order_id:rawEvent?.resource?.supplementary_data?.related_ids?.order_id || ''}])}).catch(()=>{});
  await logAgent(pedidoId,'paypal_webhook_pago_confirmado','pago_confirmado',`PayPal confirmó pago/captura ${info.captureId || ''} por ${info.amount} ${info.currency}`);
  await emitInvoiceIfPaid(pedidoId, 'paypal');
  await fetch(`${process.env.NEXO_PUBLIC_URL || ''}/api/agent1-procesar`.replace(/^\/api/, `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api`), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({limit:5})}).catch(()=>{});
  return {updated:true,pedido_id:pedidoId};
}

async function emitInvoiceIfPaid(pedidoId, metodo='paypal'){
  try{
    const rows = await sb(`pedidos?id=eq.${encodeURIComponent(pedidoId)}&select=*`, {headers:{Prefer:''}}).catch(()=>[]);
    const p = Array.isArray(rows) ? rows[0] : null;
    if(!p) return;
    const existing = await sb(`facturas?pedido_id=eq.${encodeURIComponent(pedidoId)}&select=id&limit=1`, {headers:{Prefer:''}}).catch(()=>[]);
    if(existing && existing[0]) return;
    const pais = String(p.cliente_pais || '').toLowerCase();
    const numeroFiscal = pais.includes('bolivia') ? (p.cliente_documento || '') : '99001';
    await sb('facturas', {method:'POST', body:JSON.stringify([{
      pedido_id: pedidoId,
      cliente_id: p.cliente_id || null,
      numero_factura: p.factura_numero || p.id || pedidoId,
      numero_fiscal: numeroFiscal,
      cliente_nombre: `${p.cliente_nombre || ''} ${p.cliente_apellido || ''}`.trim() || p.cliente_email || 'Cliente nexo',
      cliente_documento: p.cliente_documento || '',
      total_usd: p.total_cliente_usd || p.precio_usd || 0,
      metodo_pago: metodo
    }])});
  }catch(e){}
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true,service:'paypal-webhook',env:PAYPAL_ENV,needs:'Configurar esta URL en PayPal: /api/paypal-webhook'});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const event = req.body || {};
    const verification = await verifyWebhook(req,event).catch(e=>({verified:false,error:e.message||String(e)}));
    const type = String(event.event_type || '');
    let result = {ignored:true,type};
    if(['PAYMENT.CAPTURE.COMPLETED','CHECKOUT.ORDER.APPROVED','CHECKOUT.ORDER.COMPLETED'].includes(type)){
      const resource = event.resource || {};
      const pseudoCapture = resource.purchase_units ? resource : {purchase_units:[{reference_id:resource.custom_id || resource.invoice_id || '', custom_id:resource.custom_id, invoice_id:resource.invoice_id, payments:{captures:[resource]}}]};
      const pedidoId = getPedidoIdFromPayPalCapture(pseudoCapture) || resource.custom_id || resource.invoice_id || resource.id;
      const info = getCaptureInfo(pseudoCapture);
      result = await processPaid(pedidoId, info, event);
    }
    return res.status(200).json({ok:true,verification,result});
  }catch(e){
    return res.status(500).json({ok:false,error:e.message||String(e),detail:e.detail||null});
  }
}
