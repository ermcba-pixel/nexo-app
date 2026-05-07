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

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true,service:'paypal-capture-order',env:PAYPAL_ENV});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const orderId = String(req.body?.orderId || req.body?.token || '').trim();
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
    return res.status(200).json({ok:true,env:PAYPAL_ENV,orderId,status:data.status,capture:data});
  }catch(e){
    return res.status(e.statusCode || 500).json({ok:false,error:e.message || String(e),detail:e.detail || null,env:PAYPAL_ENV});
  }
}
