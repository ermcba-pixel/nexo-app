async function getAmazonAccessToken() {
  const clientId = process.env.AMAZON_CLIENT_ID || process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CLIENT_SECRET || process.env.AMAZON_LWA_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, error: 'Faltan variables Amazon en Vercel: AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET o AMAZON_REFRESH_TOKEN.' };
  }
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret });
  const response = await fetch('https://api.amazon.com/auth/O2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) return { ok: false, error: data.error_description || data.error || `LWA token error ${response.status}` };
  return { ok: true, accessToken: data.access_token, expiresIn: data.expires_in };
}

function normalizeOrder(req) {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : Array.isArray(body.cart) ? body.cart : [];
  const amazonItems = items.filter(i => String(i.provider || i.proveedor || i.vendor || '').toLowerCase().includes('amazon') || String(i.id || '').startsWith('amazon-'));
  const totals = body.totals || {};
  return { body, items, amazonItems, totals };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const token = await getAmazonAccessToken();
    return res.status(200).json({
      ok: true,
      service: 'agent1-amazon',
      mode: 'sandbox-ready',
      credentialsDetected: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN),
      tokenOk: token.ok,
      tokenError: token.ok ? null : token.error,
      message: token.ok ? 'Agente 1 ya puede autenticarse con Amazon LWA.' : 'Agente 1 todavía no puede autenticarse con Amazon LWA.'
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });

  const { body, items, amazonItems, totals } = normalizeOrder(req);
  const token = await getAmazonAccessToken();
  const pedidoId = body.id || body.supabase_id || body.orderId || `NEXO-${Date.now()}`;

  // Sandbox: no dispara compra real. Prepara una orden técnica que luego se enviará a Cart/Ordering al activar producción.
  return res.status(200).json({
    ok: true,
    agent: 'Agente 1 Amazon',
    mode: 'sandbox-ready',
    estado: token.ok ? 'pedido_preparado_con_token_amazon_sandbox' : 'pedido_preparado_sin_token_amazon',
    pedidoId,
    totalItems: items.length,
    amazonItems,
    totals,
    tokenOk: token.ok,
    tokenError: token.ok ? null : token.error,
    productionBlockedUntil: [
      'Amazon Business Product Search en producción aprobado',
      'Cart API / Ordering API en producción aprobadas',
      'Permisos/roles de compra real aprobados por Amazon',
      'Prueba de pedido con trial mode antes de compra real'
    ],
    nextAction: token.ok
      ? 'La autenticación LWA funciona. Ahora activar Product Search/Cart/Ordering de producción para compra real.'
      : 'Revisar variables AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET y AMAZON_REFRESH_TOKEN en Vercel.'
  });
}
