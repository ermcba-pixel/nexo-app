const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json' }
  });
  const txt = await r.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : []; } catch { data = txt; }
  if(!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data || [];
}

export default async function handler(req,res){
  try{
    if(!SUPABASE_KEY) return res.status(500).json({ok:false,error:'Falta SUPABASE_SERVICE_ROLE_KEY'});
    const [clientes,pedidos,pagos,productos,facturas,tracking,tickets,afiliados,logs] = await Promise.all([
      sb('clientes?select=*&order=fecha_registro.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('pedidos?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('pagos?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('productos?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('facturas?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('tracking_envios?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('tickets?select=*&order=fecha_creacion.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('afiliados_amazon?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]})),
      sb('logs_agente1?select=*&order=creado_en.desc&limit=200').catch(e=>({error:e.message, data:[]}))
    ]);
    const norm = x => Array.isArray(x) ? x : (x.data || []);
    const errors = [clientes,pedidos,pagos,productos,facturas,tracking,tickets,afiliados,logs].filter(x=>x && x.error).map(x=>x.error);
    res.status(200).json({ok:true, using_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY, errors, clientes:norm(clientes), pedidos:norm(pedidos), pagos:norm(pagos), productos:norm(productos), facturas:norm(facturas), tracking_envios:norm(tracking), tickets:norm(tickets), afiliados_amazon:norm(afiliados), logs_agente1:norm(logs)});
  }catch(e){ res.status(500).json({ok:false,error:e.message||String(e)}); }
}
