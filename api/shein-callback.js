// nexo™ – callback de autorización SHEIN
import { cors } from './shein-utils.js';

function htmlEscape(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  const q = req.query || {};
  const tempToken = q.tempToken || q.temp_token || q.token || q.code || '';
  const state = q.state || '';
  const body = {ok:Boolean(tempToken), tempToken, state, query:q, message: tempToken ? 'tempToken recibido. Ahora llamar /api/shein-exchange-token.' : 'Callback recibido sin tempToken visible.'};
  if(String(req.headers.accept||'').includes('text/html')){
    return res.status(200).send(`<!doctype html><meta charset="utf-8"><title>nexo SHEIN Callback</title><body style="font-family:Arial;padding:30px"><h2>nexo – SHEIN callback</h2><pre>${htmlEscape(JSON.stringify(body,null,2))}</pre></body>`);
  }
  return res.status(200).json(body);
}
