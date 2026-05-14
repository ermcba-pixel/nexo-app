
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const row = {
      amazon_url: body.amazon_url || body.url || '',
      amazon_asin: body.amazon_asin || body.asin || null,
      amazon_tag: body.amazon_tag || 'nexo08-20',
      evento: body.evento || 'click'
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/afiliados_amazon`, {
      method:'POST',
      headers:{ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' },
      body: JSON.stringify([row])
    });
    const text = await r.text();
    return res.status(200).json({ ok:r.ok, detail:text ? JSON.parse(text) : null });
  } catch(e) { return res.status(200).json({ ok:false, error:e.message || String(e) }); }
}
