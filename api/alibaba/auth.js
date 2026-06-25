// nexo™ – Alibaba OAuth starter
// Construye la URL de autorización OAuth 2.0 Server-side para Alibaba Open Platform.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store');
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const appKey = process.env.ALIBABA_APP_KEY || '';
  const callback = process.env.ALIBABA_CALLBACK_URL || 'https://nexoservicios.online/api/alibaba/callback';
  if(!appKey) return res.status(500).json({ok:false,error:'Falta ALIBABA_APP_KEY en Vercel'});
  const state = req.query.state || `nexo-${Date.now()}`;
  const authBase = process.env.ALIBABA_AUTH_URL || 'https://openapi-auth.alibaba.com/oauth/authorize';
  const url = new URL(authBase);
  url.searchParams.set('response_type','code');
  url.searchParams.set('client_id', appKey);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('state', String(state));
  if(req.query.json==='1') return res.status(200).json({ok:true, authUrl:url.toString(), callback});
  res.writeHead(302, {Location:url.toString()});
  return res.end();
}
