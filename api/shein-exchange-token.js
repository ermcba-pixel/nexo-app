// nexo™ – intercambiar tempToken por openKeyId/secretKey en SHEIN
import { cors, SHEIN_APP_ID, SHEIN_APP_SECRET_KEY, sheinPost } from './shein-utils.js';

async function saveToken(payload){
  try{
    const { sb } = await import('./_nexo-supabase.js');
    await sb('shein_api_tokens', {method:'POST', body:JSON.stringify(payload)});
  }catch(e){ /* no rompe si Supabase no está configurado */ }
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true, service:'shein-exchange-token', appId:SHEIN_APP_ID, needs:['SHEIN_APP_SECRET_KEY','tempToken'], configured:Boolean(SHEIN_APP_SECRET_KEY)});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body || {});
  const tempToken = body.tempToken || body.temp_token || body.token || '';
  if(!SHEIN_APP_SECRET_KEY) return res.status(400).json({ok:false,error:'missing_SHEIN_APP_SECRET_KEY',message:'Falta SHEIN_APP_SECRET_KEY en Vercel. Obtenerlo desde Test Store / credenciales de la aplicación SHEIN.'});
  if(!tempToken) return res.status(400).json({ok:false,error:'missing_tempToken'});
  const result = await sheinPost('/open-api/auth/get-by-token', {tempToken}, {secret:SHEIN_APP_SECRET_KEY, openKeyId:'', host:process.env.SHEIN_API_HOST || 'https://openapi-sem.sheincorp.com'});
  const info = result.data?.info || result.data?.data || result.data?.result || result.data || {};
  const row = {
    app_id:SHEIN_APP_ID,
    open_key_id: info.openKeyId || info.open_key_id || info.openKeyid || info.openKey || null,
    secret_key_encrypted: info.secretKey || info.secret_key || null,
    temp_token: tempToken,
    authorization_state: body.state || info.state || null,
    token_status: result.ok ? 'received' : 'failed'
  };
  if(row.open_key_id || row.secret_key_encrypted) await saveToken(row);
  return res.status(result.ok ? 200 : 502).json({ok:result.ok, status:result.status, appId:SHEIN_APP_ID, saved:Boolean(row.open_key_id || row.secret_key_encrypted), token:row, raw:result.data});
}
