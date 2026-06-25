// nexo™ – Alibaba OAuth callback
// Guarda de forma operativa el código recibido. El intercambio por token se ejecuta cuando Alibaba confirme endpoint exacto de token para la app.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store');
}
async function logSupabase(payload){
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key) return null;
  await fetch(`${url}/rest/v1/logs_agente1`, {
    method:'POST',
    headers:{apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=minimal'},
    body: JSON.stringify({proveedor:'Alibaba', accion:'oauth_callback', detalle:JSON.stringify(payload).slice(0,1000), estado:'recibido'})
  }).catch(()=>null);
}
export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  const q = req.method==='POST' ? (req.body||{}) : (req.query||{});
  const code = q.code || q.auth_code || q.authorization_code || '';
  const state = q.state || '';
  const error = q.error || q.error_description || '';
  const payload = {ok:!error, provider:'Alibaba', codeReceived:Boolean(code), code, state, error, receivedAt:new Date().toISOString()};
  await logSupabase(payload);
  if(error) return res.status(200).send(`<html><body><h2>Alibaba OAuth</h2><p>Error: ${String(error)}</p><p><a href="/nexo-admin-panel.html">Volver al panel nexo</a></p></body></html>`);
  return res.status(200).send(`<html><body><h2>Alibaba conectado con nexo</h2><p>Código recibido correctamente para Agente 1.</p><p>Estado: ${String(state)}</p><p><a href="/nexo-admin-panel.html">Volver al panel nexo</a></p></body></html>`);
}
