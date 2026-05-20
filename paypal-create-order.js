const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
async function rest(path, options={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(options.headers||{}) }});
  const text = await r.text(); let data=null; try{ data=text?JSON.parse(text):null }catch{ data=text }
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try{
    const b = typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    if(!b.ticket_id) return res.status(400).json({ok:false,error:'ticket_id requerido'});
    const mensaje = String(b.mensaje||'').trim();
    if(!mensaje) return res.status(400).json({ok:false,error:'mensaje requerido'});
    const row = { ticket_id:b.ticket_id, usuario_admin:b.usuario_admin||'Superadmin nexo', mensaje, fecha_respuesta:new Date().toISOString() };
    const respuesta = await rest('respuestas_ticket', {method:'POST', body:JSON.stringify([row])});
    await rest(`tickets?id=eq.${encodeURIComponent(b.ticket_id)}`, {method:'PATCH', body:JSON.stringify({estado:b.estado||'Respondido', fecha_actualizacion:new Date().toISOString()})}).catch(()=>{});
    return res.status(200).json({ok:true,respuesta});
  }catch(e){ return res.status(200).json({ok:false,error:e.message||String(e)}); }
}
