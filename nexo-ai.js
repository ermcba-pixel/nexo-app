// nexo™ · CJ API status test
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
export default async function handler(req, res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  try{
    const apiKey = (process.env.CJ_API_KEY || '').trim();
    if(!apiKey) return res.status(428).json({ok:false, hasApiKey:false, message:'Falta CJ_API_KEY'});
    const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({apiKey})});
    const data = await r.json().catch(()=>({}));
    const token = data?.data?.accessToken || data?.data?.access_token || data?.accessToken;
    return res.status(r.ok && token ? 200 : 502).json({ok:Boolean(r.ok && token), hasApiKey:true, hasToken:Boolean(token), cjCode:data?.code, cjMessage:data?.message || data?.msg || null});
  }catch(e){ return res.status(500).json({ok:false,error:e.message || String(e)}); }
}
