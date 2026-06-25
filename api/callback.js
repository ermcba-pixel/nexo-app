// nexo™ – Alibaba OAuth callback
// Recibe el authorization code y, si Alibaba lo permite, lo canjea por access_token.

import crypto from 'crypto';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function hmac(secret, text){return crypto.createHmac('sha256', secret).update(text, 'utf8').digest('hex').toUpperCase();}
function signParams(params, secret){
  const keys = Object.keys(params).filter(k=>params[k]!==undefined && params[k]!==null && k!=='sign').sort();
  const base = keys.map(k=>`${k}${params[k]}`).join('');
  return hmac(secret, base);
}
async function exchangeCode(code){
  const appKey = String(process.env.ALIBABA_APP_KEY || process.env.ALIBABA_APPKEY || '').trim();
  const appSecret = String(process.env.ALIBABA_APP_SECRET || process.env.ALIBABA_APPSECRET || '').trim();
  if(!appKey || !appSecret) return {ok:false,error:'Faltan ALIBABA_APP_KEY o ALIBABA_APP_SECRET en Vercel'};
  const params = {
    app_key: appKey,
    code: String(code),
    timestamp: new Date().toISOString().slice(0,19).replace('T',' '),
    sign_method: 'sha256',
    format: 'json',
    v: '2.0'
  };
  params.sign = signParams(params, appSecret);
  const bases = [
    'https://openapi-auth.alibaba.com/rest/auth/token/create',
    'https://openapi-auth.alibaba.com/auth/token/create'
  ];
  const attempts=[];
  for(const base of bases){
    const qs = new URLSearchParams(params).toString();
    try{
      const r = await fetch(base+'?'+qs, {cache:'no-store'});
      const text = await r.text();
      let data={}; try{data=JSON.parse(text);}catch(e){data={raw:text};}
      attempts.push({base,status:r.status,body:text.slice(0,300)});
      const access = data.access_token || data?.result?.access_token || data?.alibaba_auth_token_create_response?.access_token;
      if(r.ok && access) return {ok:true,data,access_token:access,refresh_token:data.refresh_token || data?.result?.refresh_token || '',attempts};
    }catch(e){attempts.push({base,error:String(e.message||e)});}
  }
  return {ok:false,error:'Alibaba recibió el code, pero no devolvió access_token automáticamente.',attempts};
}
async function logSupabase(payload){
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key) return null;
  await fetch(`${url}/rest/v1/logs_agente1`, {
    method:'POST',
    headers:{apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=minimal'},
    body: JSON.stringify({proveedor:'Alibaba', accion:'oauth_callback', detalle:JSON.stringify({codeReceived:!!payload.code, tokenReceived:!!payload.access_token, state:payload.state, error:payload.error}).slice(0,1000), estado:payload.error?'error':'recibido'})
  }).catch(()=>null);
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  const q = req.method==='POST' ? (req.body||{}) : (req.query||{});
  const code = q.code || q.auth_code || q.authorization_code || '';
  const state = q.state || '';
  const error = q.error || q.error_description || '';
  if(error){
    await logSupabase({code:'',state,error});
    return res.status(200).send(`<html><body style="font-family:Arial;padding:30px"><h2>Alibaba OAuth</h2><p>Error: ${esc(error)}</p><p><a href="/nexo-admin-panel.html">Volver al panel nexo</a></p></body></html>`);
  }
  if(!code){
    await logSupabase({code:'',state,error:'no_code'});
    return res.status(200).send(`<html><body style="font-family:Arial;padding:30px"><h2>Alibaba OAuth</h2><p>No llegó código de autorización.</p><p>Abra <a href="/api/alibaba/auth">/api/alibaba/auth</a> para iniciar la autorización.</p></body></html>`);
  }
  const exchanged = await exchangeCode(code);
  await logSupabase({code,state,error:exchanged.ok?'':exchanged.error,access_token:exchanged.access_token});
  if(exchanged.ok){
    return res.status(200).send(`<html><body style="font-family:Arial;padding:30px;line-height:1.5"><h2>Alibaba conectado con nexo</h2><p><b>Access Token recibido correctamente.</b></p><p>Copie este valor en Vercel como <b>ALIBABA_ACCESS_TOKEN</b> y luego haga Redeploy sin caché.</p><textarea style="width:100%;height:90px">${esc(exchanged.access_token)}</textarea>${exchanged.refresh_token?`<p>Refresh Token:</p><textarea style="width:100%;height:70px">${esc(exchanged.refresh_token)}</textarea>`:''}<p><a href="/nexo-admin-panel.html">Volver al panel nexo</a></p></body></html>`);
  }
  return res.status(200).send(`<html><body style="font-family:Arial;padding:30px;line-height:1.5"><h2>Alibaba recibió el código</h2><p>El callback ya funciona. Falta canjear el code por token con el endpoint exacto de Alibaba.</p><p><b>Authorization code recibido:</b></p><textarea style="width:100%;height:80px">${esc(code)}</textarea><p><b>Detalle técnico:</b> ${esc(exchanged.error)}</p><p>Con este code también puede probarse en Documentation → GenerateAccessToken.</p><p><a href="/nexo-admin-panel.html">Volver al panel nexo</a></p></body></html>`);
}
