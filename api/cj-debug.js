const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  try{
    const apiKey = (process.env.CJ_API_KEY || '').trim();
    if(!apiKey) return res.status(500).json({ok:false, message:'Falta CJ_API_KEY en Vercel'});
    const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({apiKey})
    });
    const data = await r.json().catch(()=>({}));
    return res.status(r.ok ? 200 : r.status).json({
      ok:r.ok && (data.result === true || data.success === true || data.code === 200),
      status:r.status,
      cjCode:data.code,
      cjMessage:data.message,
      hasAccessToken:Boolean(data?.data?.accessToken),
      accessTokenPreview:data?.data?.accessToken ? String(data.data.accessToken).slice(0,8)+'...' : '',
      refreshTokenPreview:data?.data?.refreshToken ? String(data.data.refreshToken).slice(0,8)+'...' : ''
    });
  }catch(e){
    return res.status(500).json({ok:false, message:e.message});
  }
}
