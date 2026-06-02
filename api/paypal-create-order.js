import { sb, logAgent } from './_nexo-supabase.js';
// nexo – PayPal Orders API: crear cobro real del cliente
// Requiere en Vercel: PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET
// Opcional: PAYPAL_ENV=live|sandbox. Por defecto: live.

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
    headers:{
      'Authorization': `Basic ${auth}`,
      'Content-Type':'application/x-www-form-urlencoded'
    },
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

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET'){
    return res.status(200).json({
      ok:true,
      service:'paypal-create-order',
      env:PAYPAL_ENV,
      hasClientId:Boolean(process.env.PAYPAL_CLIENT_ID),
      hasClientSecret:Boolean(process.env.PAYPAL_CLIENT_SECRET)
    });
  }
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});

  try{
    const body = req.body || {};
    const amount = Number(body.amount || body.total || body?.orderData?.total || 0);
    if(!Number.isFinite(amount) || amount <= 0){
      return res.status(400).json({ok:false,error:'Monto inválido para PayPal'});
    }
    const orderData = body.orderData || body || {};
    const paymentMethod = String(body.paymentMethod || orderData.paymentMethod || 'paypal').toLowerCase();
    const pedidoId = String(orderData.supabase_id || orderData.id || body.pedidoId || ('NEXO-' + Date.now())).slice(0,120);
    const origin = String(req.headers.origin || req.headers.referer || '').replace(/\/$/, '') || `https://${req.headers.host}`;
    const returnUrl = body.returnUrl || `${origin}/nexo-confirmacion.html?pedido_id=${encodeURIComponent(pedidoId)}&metodo=paypal&paypal=return`;
    const cancelUrl = body.cancelUrl || `${origin}/nexo-checkout.html?pedido_id=${encodeURIComponent(pedidoId)}&metodo=paypal&pago=cancelado`;
    const token = await getAccessToken();
    const payload = {
      intent:'CAPTURE',
      purchase_units:[{
        reference_id: pedidoId,
        invoice_id: pedidoId,
        custom_id: pedidoId,
        description: `nexo - Pedido ${pedidoId}`,
        amount:{ currency_code:'USD', value: amount.toFixed(2) }
      }],
      application_context:{
        brand_name:'nexo',
        locale:'es-BO',
        landing_page: paymentMethod === 'card' ? 'BILLING' : 'LOGIN',
        user_action:'PAY_NOW',
        shipping_preference:'GET_FROM_FILE',
        return_url:returnUrl,
        cancel_url:cancelUrl
      }
    };
    const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method:'POST',
      headers:{
        'Authorization': `Bearer ${token}`,
        'Content-Type':'application/json',
        'PayPal-Request-Id': pedidoId
      },
      body:JSON.stringify(payload)
    });
    const data = await r.json().catch(()=>({}));
    if(!r.ok){
      return res.status(r.status).json({ok:false,error:'paypal_create_order_failed',detail:data,env:PAYPAL_ENV});
    }
    const approvalUrl = (data.links || []).find(l=>l.rel==='approve')?.href;
    try{
      await sb(`pedidos?id=eq.${encodeURIComponent(pedidoId)}`, {
        method:'PATCH',
        body:JSON.stringify({estado_pago: paymentMethod === 'card' ? 'tarjeta_checkout_paypal_creado' : 'paypal_orden_creada', estado_agente: paymentMethod === 'card' ? 'esperando_captura_tarjeta' : 'esperando_pago_paypal', estado_compra: paymentMethod === 'card' ? 'pendiente_pago_tarjeta' : 'pendiente_pago_paypal'})
      });
      await logAgent(pedidoId,'paypal_order_creada','esperando_pago',`Orden PayPal ${data.id} creada. Cliente redirigido a PayPal Business.`);
    }catch(e){ /* no rompe redirección PayPal */ }
    return res.status(200).json({
      ok:true,
      env:PAYPAL_ENV,
      orderId:data.id,
      pedidoId,
      approvalUrl,
      paypal:data
    });
  }catch(e){
    return res.status(e.statusCode || 500).json({ok:false,error:e.message || String(e),detail:e.detail || null,env:PAYPAL_ENV});
  }
}
