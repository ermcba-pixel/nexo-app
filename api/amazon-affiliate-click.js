const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv';

async function rest(path, options={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(options.headers||{}) }});
  const text = await r.text(); let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
function extractAsin(url){
  const u=String(url||'');
  const m=u.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i) || u.match(/[?&]asin=([A-Z0-9]{10})(?:&|$)/i);
  return m ? m[1].toUpperCase() : 'PENDIENTE_API';
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(body.cliente_email || body.email || '').trim().toLowerCase();
    let cliente_id = body.cliente_id || null;
    let pedido_id = body.pedido_id || null;
    if(email && !cliente_id){
      const c = await rest(`clientes?select=id&email=eq.${encodeURIComponent(email)}&limit=1`, {headers:{Prefer:''}}).catch(()=>[]);
      cliente_id = c && c[0] && c[0].id ? c[0].id : null;
    }
    if((email || cliente_id) && !pedido_id){
      const q = cliente_id ? `cliente_id=eq.${cliente_id}` : `cliente_email=eq.${encodeURIComponent(email)}`;
      const p = await rest(`pedidos?select=id&${q}&order=creado_en.desc&limit=1`, {headers:{Prefer:''}}).catch(()=>[]);
      pedido_id = p && p[0] && p[0].id ? p[0].id : null;
    }
    const url = body.amazon_url || body.url || '';
    const row = {
      pedido_id,
      cliente_id,
      amazon_url: url,
      amazon_asin: body.amazon_asin || body.asin || extractAsin(url),
      amazon_tag: body.amazon_tag || 'nexo08-20',
      evento: body.evento || 'click'
    };
    const detail = await rest('afiliados_amazon', {method:'POST', body: JSON.stringify([row])});
    return res.status(200).json({ ok:true, detail });
  } catch(e) { return res.status(200).json({ ok:false, error:e.message || String(e) }); }
}
