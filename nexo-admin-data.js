// nexo™ – CJ Dropshipping shipping quote bridge
// Calcula gastos de envío reales cuando CJ devuelve logística por producto/destino.
// Si CJ requiere más datos de variante, responde pending=true para que Agente 1 complete al crear orden.

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store');
}
async function fetchJson(url, options={}, timeoutMs=15000){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs);
  try{
    const r = await fetch(url, {...options, signal:ctrl.signal});
    const text = await r.text();
    let data = {};
    try{ data = text ? JSON.parse(text) : {}; }catch(e){ data = {raw:text}; }
    if(!r.ok){
      const err = new Error(data?.message || data?.error || `HTTP ${r.status}`);
      err.status = r.status;
      err.data = data;
      throw err;
    }
    return data;
  }finally{ clearTimeout(timer); }
}
async function getToken(){
  if(process.env.CJ_ACCESS_TOKEN) return process.env.CJ_ACCESS_TOKEN;
  if(cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;
  const apiKey=(process.env.CJ_API_KEY||'').trim();
  if(!apiKey) throw new Error('Falta CJ_API_KEY');
  const data=await fetchJson(`${CJ_BASE}/authentication/getAccessToken`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({apiKey})
  });
  const token=data?.data?.accessToken || data?.accessToken || data?.data?.access_token;
  if(!token) throw new Error(data?.message || 'CJ no devolvió access token');
  cachedToken=token; cachedTokenExpiresAt=Date.now()+10*60*60*1000;
  return token;
}
function firstNumber(obj){
  const keys=['logisticPrice','shippingPrice','shippingCost','freight','freightPrice','cost','price','amount'];
  for(const k of keys){
    const n=Number(obj?.[k]);
    if(Number.isFinite(n) && n>0) return n;
  }
  if(Array.isArray(obj)){
    for(const x of obj){ const n=firstNumber(x); if(n>0) return n; }
  }
  if(obj && typeof obj==='object'){
    for(const v of Object.values(obj)){ if(v && typeof v==='object'){ const n=firstNumber(v); if(n>0) return n; } }
  }
  return 0;
}
export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true,service:'cj-shipping-quote',cjReady:Boolean(process.env.CJ_API_KEY)});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const {item={}, destination={}} = req.body || {};
    const token = await getToken();
    const country = String(destination.country || destination.countryCode || '').toUpperCase();
    const quantity = Number(destination.quantity || item.quantity || 1) || 1;
    const productId = item.cjProductId || item.pid || item.productId || item.id;
    const sku = item.sku || item.variantSku || item.productSku || '';

    const payload = {
      startCountryCode:'CN',
      endCountryCode:country || 'US',
      products:[{
        pid:String(productId || '').replace(/^cj-/,''),
        vid: sku,
        quantity
      }]
    };

    const candidates = [
      '/logistic/freightCalculate',
      '/logistic/freightCalculateV2',
      '/logistic/getFreightCalculate'
    ];
    let last = null;
    for(const ep of candidates){
      try{
        const data = await fetchJson(`${CJ_BASE}${ep}`, {
          method:'POST',
          headers:{'Content-Type':'application/json','CJ-Access-Token':token},
          body:JSON.stringify(payload)
        }, 12000);
        const n = firstNumber(data?.data || data);
        if(n>0){
          return res.status(200).json({ok:true, shippingCost:Number(n.toFixed(2)), handlingFee:0, endpoint:ep, raw:data});
        }
        last = data;
      }catch(e){ last = e.data || {message:e.message, endpoint:ep}; }
    }
    return res.status(200).json({
      ok:false,
      pending:true,
      shippingCost:0,
      handlingFee:0,
      message:'CJ requiere variante/dirección completa para devolver flete real. Agente 1 lo completará al crear la orden.',
      payload,
      detail:last
    });
  }catch(err){
    return res.status(200).json({ok:false,pending:true,shippingCost:0,handlingFee:0,message:err.message || 'shipping_quote_pending'});
  }
}
