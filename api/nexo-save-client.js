
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv';
async function supabaseRest(path, options={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(options.headers||{}) }});
  const text = await r.text();
  let data=null; try{ data=text?JSON.parse(text):null; }catch{ data=text; }
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try{
    const p = typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const row = {
      nombre:p.name||p.nombre||'', apellido:p.lastName||p.apellido||'', email:p.email||'', telefono:p.phone||p.telefono||'', pais:p.country||p.pais||'', direccion:p.address||p.direccion||'', documento:p.documentId||p.documento||'', codigo_area:p.areaCode||p.codigo_area||'', codigo_postal:p.postalCode||p.codigo_postal||'', region:p.region||'', ciudad:p.city||p.ciudad||'', password:p.password||null
    };
    let existing=[];
    if(row.email) existing = await supabaseRest(`clientes?select=id&email=eq.${encodeURIComponent(row.email)}&limit=1`, {headers:{Prefer:''}}).catch(()=>[]);
    let data;
    if(existing && existing[0]?.id){
      data = await supabaseRest(`clientes?id=eq.${existing[0].id}`, {method:'PATCH', body:JSON.stringify(row)});
    } else {
      data = await supabaseRest('clientes', {method:'POST', body:JSON.stringify([row])});
    }
    return res.status(200).json({ok:true, data});
  }catch(e){ return res.status(200).json({ok:false,error:e.message||String(e)}); }
}
