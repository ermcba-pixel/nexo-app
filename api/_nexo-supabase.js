const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujqbbniptflzytdankwp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY_NEW || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function hasServiceRole(){
  const k = SUPABASE_KEY || '';
  return k.startsWith('sb_secret_') || k.split('.').length === 3;
}

export async function sb(path, options={}){
  if(!SUPABASE_URL || !SUPABASE_KEY){
    const err = new Error('missing_supabase_env');
    err.statusCode = 500;
    throw err;
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers:{
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type':'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    }
  });
  const text = await r.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : null; }catch{ data = text; }
  if(!r.ok){
    const err = new Error(typeof data === 'string' ? data : JSON.stringify(data));
    err.statusCode = r.status;
    err.detail = data;
    throw err;
  }
  return data;
}

export async function logAgent(pedido_id, accion, estado='ok', detalle=''){
  try{
    await sb('logs_agent1', {method:'POST', body:JSON.stringify([{pedido_id, accion, estado, detalle}])});
  }catch(e){ /* no rompe el flujo */ }
}

export function getPedidoIdFromPayPalCapture(capture){
  const pu = capture?.purchase_units || [];
  return pu?.[0]?.reference_id || pu?.[0]?.custom_id || pu?.[0]?.invoice_id || '';
}

export function getCaptureInfo(capture){
  const pu = capture?.purchase_units || [];
  const cap = pu?.[0]?.payments?.captures?.[0] || null;
  return {
    captureId: cap?.id || '',
    status: capture?.status || cap?.status || '',
    amount: Number(cap?.amount?.value || pu?.[0]?.amount?.value || 0),
    currency: cap?.amount?.currency_code || pu?.[0]?.amount?.currency_code || 'USD'
  };
}
