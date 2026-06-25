// nexo™ – Alibaba OAuth starter
// Redirige a Alibaba para obtener el authorization code del flujo Buyer ISV.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const appKey = String(process.env.ALIBABA_APP_KEY || process.env.ALIBABA_APPKEY || '').trim();
  const callback = String(
    process.env.ALIBABA_REDIRECT_URI ||
    process.env.ALIBABA_CALLBACK_URL ||
    'https://nexoservicios.online/api/alibaba/callback'
  ).trim();

  if(!appKey) return res.status(500).json({ok:false,error:'Falta ALIBABA_APP_KEY en Vercel'});
  if(!callback) return res.status(500).json({ok:false,error:'Falta ALIBABA_REDIRECT_URI en Vercel'});

  const authBase = String(process.env.ALIBABA_AUTH_URL || 'https://openapi-auth.alibaba.com/oauth/authorize').trim();
  const state = String(req.query.state || `nexo-${Date.now()}`);
  const url = new URL(authBase);
  url.searchParams.set('response_type','code');
  url.searchParams.set('client_id', appKey);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('state', state);

  if(req.query.json === '1') return res.status(200).json({ok:true,authUrl:url.toString(),callback,state});
  res.writeHead(302,{Location:url.toString()});
  return res.end();
}
