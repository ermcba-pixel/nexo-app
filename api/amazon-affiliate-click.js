// nexo – registro de clicks de afiliado Amazon
// Registra intentos de salida a Amazon con tag nexo08-20. Si RLS bloquea, no afecta la navegación del cliente.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'nexo08-20';
function ensureTag(rawUrl, fallbackName='producto'){
  let url = rawUrl || `https://www.amazon.com/s?k=${encodeURIComponent(fallbackName)}`;
  try{
    const u = new URL(url);
    if(/amazon\./i.test(u.hostname)){
      u.searchParams.set('tag', AMAZON_TAG);
      if(!u.searchParams.get('linkCode')) u.searchParams.set('linkCode','ll2');
      if(!u.searchParams.get('ref_')) u.searchParams.set('ref_','as_li_ss_tl');
    }
    return u.toString();
  }catch(e){
    const sep = String(url).includes('?') ? '&' : '?';
    return `${url}${sep}tag=${encodeURIComponent(AMAZON_TAG)}`;
  }
}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true, service:'amazon-affiliate-click', amazon_tag:AMAZON_TAG});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const amazonUrl = ensureTag(body.amazon_url || body.url, body.producto_nombre || body.name || 'producto');
    const payload = {
      amazon_url: amazonUrl,
      amazon_asin: body.amazon_asin || body.asin || null,
      amazon_tag: AMAZON_TAG,
      evento: body.evento || 'click_salida_amazon'
    };
    if(SUPABASE_URL && SUPABASE_KEY){
      const r = await fetch(`${SUPABASE_URL}/rest/v1/afiliados_amazon`, {
        method:'POST',
        headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal' },
        body:JSON.stringify(payload)
      });
      if(!r.ok) return res.status(200).json({ok:true, saved:false, amazon_url:amazonUrl, amazon_tag:AMAZON_TAG, warning:'supabase_rls_or_policy_pending'});
    }
    return res.status(200).json({ok:true, saved:Boolean(SUPABASE_URL && SUPABASE_KEY), amazon_url:amazonUrl, amazon_tag:AMAZON_TAG});
  }catch(e){
    return res.status(200).json({ok:true, saved:false, amazon_tag:AMAZON_TAG, warning:String(e.message || e)});
  }
}
