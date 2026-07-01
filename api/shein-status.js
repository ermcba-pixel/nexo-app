// nexo™ – estado técnico de integración SHEIN
import { cors, SHEIN_APP_ID, SHEIN_API_HOST, SHEIN_AUTH_HOST, SHEIN_APP_SECRET_KEY, SHEIN_OPEN_KEY_ID, SHEIN_SECRET_KEY } from './shein-utils.js';

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  let storedToken=false, cacheCount=null, lastLog=null;
  try{
    const { sb } = await import('./_nexo-supabase.js');
    const tok = await sb(`shein_api_tokens?select=id,open_key_id,token_status,created_at&app_id=eq.${encodeURIComponent(SHEIN_APP_ID)}&order=created_at.desc&limit=1`, {method:'GET'}).catch(()=>[]);
    storedToken = Array.isArray(tok) && tok.length>0 && !!tok[0].open_key_id;
    const cnt = await sb('shein_products_cache?select=id&active=eq.true&limit=1', {method:'GET'}).catch(()=>[]);
    cacheCount = Array.isArray(cnt) ? cnt.length : null;
    const logs = await sb('shein_api_logs?select=endpoint,request_status,response_code,response_message,created_at&order=created_at.desc&limit=1', {method:'GET'}).catch(()=>[]);
    lastLog = Array.isArray(logs) ? logs[0] || null : null;
  }catch(e){}
  return res.status(200).json({
    ok:true,
    provider:'SHEIN',
    appId:SHEIN_APP_ID,
    apiHost:SHEIN_API_HOST,
    authHost:SHEIN_AUTH_HOST,
    appSecretConfigured:Boolean(SHEIN_APP_SECRET_KEY),
    openKeyConfigured:Boolean(SHEIN_OPEN_KEY_ID) || storedToken,
    secretKeyConfigured:Boolean(SHEIN_SECRET_KEY) || storedToken,
    storedToken,
    cacheAvailable: cacheCount !== null ? cacheCount>0 : null,
    lastLog,
    readyForProductApi:Boolean((SHEIN_OPEN_KEY_ID && SHEIN_SECRET_KEY) || storedToken),
    next: ((SHEIN_OPEN_KEY_ID && SHEIN_SECRET_KEY) || storedToken)
      ? 'Probar /api/shein-products?q=camisa&maxPrice=65'
      : 'Completar autorización SHEIN para obtener openKeyId/secretKey o cargar productos reales en shein_products_cache.'
  });
}
