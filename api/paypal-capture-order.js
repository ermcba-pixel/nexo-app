import { sb, logAgent, getPedidoIdFromPayPalCapture, getCaptureInfo } from './_nexo-supabase.js';
// nexo – PayPal Orders API: capturar cobro aprobado por el cliente
// Requiere PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET. PAYPAL_ENV=live|sandbox.

const PAYPAL_ENV = (process.env.PAYPAL_ENV || process.env.NEXT_PUBLIC_PAYPAL_ENV || 'live').toLowerCase();
const PAYPAL_BASE = PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

async function getAccessToken(){
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  if(!clientId || !clientSecret){
    const err = new Error('missing_paypal_env');
    err.statusCode = 500;
    throw err;
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const r = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:'POST',
    headers:{'Authorization':`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials'
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok){
    const err = new Error(data?.error_description || data?.error || 'paypal_oauth_failed');
    err.statusCode = r.status;
    err.detail = data;
    throw err;
  }
  return data.access_token;
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
  if(req.method==='GET') return res.status(200).json({ok:true,service:'paypal-capture-order',env:PAYPAL_ENV});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const orderId = String(req.body?.orderId || req.body?.token || '').trim();
    const metodoPago = String(req.body?.metodo || req.body?.paymentMethod || 'paypal').toLowerCase();
    if(!orderId) return res.status(400).json({ok:false,error:'Falta orderId/token PayPal'});
    const token = await getAccessToken();
    const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json','PayPal-Request-Id':`${orderId}-capture`}
    });
    const data = await r.json().catch(()=>({}));
    if(!r.ok){
      return res.status(r.status).json({ok:false,error:'paypal_capture_failed',detail:data,env:PAYPAL_ENV});
    }

    // Actualización real en Supabase: pedido pagado -> Agente 1 toma la cola.
    const pedidoIdFromPaypal = getPedidoIdFromPayPalCapture(data);
    const pedidoId = String(req.body?.pedidoId || req.body?.pedido_id || pedidoIdFromPaypal || '').trim();
    const info = getCaptureInfo(data);
    let supabaseUpdate = null;
    if(pedidoId){
      try{
        await sb(`pedidos?id=eq.${encodeURIComponent(pedidoId)}`, {
          method:'PATCH',
          body:JSON.stringify({
            estado:'pagado',
            estado_pago: metodoPago === 'card' ? 'tarjeta_pagada_capturada_paypal_advanced' : 'paypal_pagado_capturado',
            estado_compra:'pendiente_agente_1',
            estado_agente:'pago_confirmado',
            estado_envio:'En preparación'
          })
        });
        await sb('pagos', {
          method:'POST',
          body:JSON.stringify([{
            pedido_id:pedidoId,
            metodo: metodoPago === 'card' ? 'card' : 'paypal',
            estado:'capturado',
            monto_usd:info.amount,
            moneda:info.currency,
            paypal_order_id:orderId,
            paypal_capture_id:info.captureId,
            fecha_pago:new Date().toISOString()
          }])
        }).catch(()=>{});
        await logAgent(pedidoId, metodoPago === 'card' ? 'tarjeta_paypal_advanced_capturada' : 'paypal_capture_confirmado','pago_confirmado',`PayPal capturado: ${info.captureId || orderId} por ${info.amount} ${info.currency}`);
        await emitInvoiceIfPaid(pedidoId, metodoPago === 'card' ? 'card' : 'paypal');
        supabaseUpdate = {ok:true,pedidoId,estado_pago: metodoPago === 'card' ? 'tarjeta_pagada_capturada_paypal_advanced' : 'paypal_pagado_capturado'};
      }catch(e){
        supabaseUpdate = {ok:false,pedidoId,error:e.message||String(e)};
      }
    }

    // Llamada al Agente 1 para procesar la cola de pagos confirmados.
    let agent1 = null;
    try{
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const ar = await fetch(`${proto}://${host}/api/agent1-procesar`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({limit:5})});
      agent1 = await ar.json().catch(()=>({ok:false,error:'agent1_json_failed'}));
    }catch(e){ agent1 = {ok:false,error:e.message||String(e)}; }

    return res.status(200).json({ok:true,env:PAYPAL_ENV,orderId,status:data.status,capture:data,pedidoId,supabaseUpdate,agent1});
  }catch(e){
    return res.status(e.statusCode || 500).json({ok:false,error:e.message || String(e),detail:e.detail || null,env:PAYPAL_ENV});
  }
}
