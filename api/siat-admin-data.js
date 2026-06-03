const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path, opts={}){
  if(!SUPABASE_KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(opts.headers||{}) }
  });
  const txt = await r.text();
  let data = null;
  try{ data = txt ? JSON.parse(txt) : []; }catch{ data = txt; }
  if(!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data || [];
}
function safeArr(x){ return Array.isArray(x) ? x : []; }

export default async function handler(req,res){
  try{
    const [config, facturas, items, iva, eventos, contingencias, lotes, auditoria, cierres, catalogos] = await Promise.all([
      sb('siat_configuracion?select=*&order=created_at.desc&limit=1').catch(e=>({error:e.message})),
      sb('siat_facturas?select=*&order=created_at.desc&limit=200').catch(e=>({error:e.message})),
      sb('siat_factura_items?select=*&order=created_at.desc&limit=500').catch(e=>({error:e.message})),
      sb('siat_registro_ventas_iva?select=*&order=created_at.desc&limit=200').catch(e=>({error:e.message})),
      sb('siat_eventos_significativos?select=*&order=created_at.desc&limit=100').catch(e=>({error:e.message})),
      sb('siat_contingencias?select=*&order=created_at.desc&limit=100').catch(e=>({error:e.message})),
      sb('siat_facturacion_masiva_lotes?select=*&order=created_at.desc&limit=100').catch(e=>({error:e.message})),
      sb('siat_auditoria_fiscal?select=*&order=created_at.desc&limit=200').catch(e=>({error:e.message})),
      sb('siat_cierres_fiscales?select=*&order=periodo.desc&limit=80').catch(e=>({error:e.message})),
      sb('siat_catalogos?select=*&order=catalogo.asc&limit=500').catch(e=>({error:e.message}))
    ]);
    const all = [config,facturas,items,iva,eventos,contingencias,lotes,auditoria,cierres,catalogos];
    const errors = all.filter(x=>x && x.error).map(x=>x.error);
    res.status(200).json({ok:true, errors, config:safeArr(config)[0]||null, facturas:safeArr(facturas), items:safeArr(items), iva:safeArr(iva), eventos:safeArr(eventos), contingencias:safeArr(contingencias), lotes:safeArr(lotes), auditoria:safeArr(auditoria), cierres:safeArr(cierres), catalogos:safeArr(catalogos)});
  }catch(e){ res.status(500).json({ok:false,error:e.message||String(e)}); }
}
