// nexo™ – generar enlace de autorización de tienda SHEIN
import { cors, SHEIN_APP_ID, SHEIN_AUTH_HOST, b64 } from './shein-utils.js';

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const origin = req.headers.host ? `https://${req.headers.host}` : '';
  const callback = req.query.redirectUrl || process.env.SHEIN_CALLBACK_URL || `${origin}/api/shein-callback`;
  const state = req.query.state || `nexo-${Date.now()}`;
  const redirectUrl = b64(callback);
  const url = `${SHEIN_AUTH_HOST}/#/empower?appid=${encodeURIComponent(SHEIN_APP_ID)}&redirectUrl=${encodeURIComponent(redirectUrl)}&state=${encodeURIComponent(state)}`;
  return res.status(200).json({ok:true, appId:SHEIN_APP_ID, callback, state, authorizationUrl:url, next:'Abrir authorizationUrl, autorizar tienda y volver a /api/shein-callback con tempToken.'});
}
