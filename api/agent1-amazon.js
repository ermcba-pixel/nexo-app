export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'agent1-amazon', mode: 'sandbox', ready: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET) });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });

  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const amazonItems = items.filter(i => String(i.provider || i.proveedor || '').toLowerCase().includes('amazon') || String(i.id || '').startsWith('amazon-'));

  return res.status(200).json({
    ok: true,
    agent: 'Agente 1 Amazon',
    mode: 'sandbox',
    estado: 'pedido_amazon_preparado_en_sandbox',
    pedidoId: order.id || order.supabase_id || `NEXO-${Date.now()}`,
    amazonItems,
    credentialsDetected: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET),
    nextRequiredForProduction: [
      'Crear autorización OAuth de la app Amazon para obtener refresh token',
      'Configurar AWS IAM Role/ARN para SP-API producción',
      'Solicitar aprobación de roles de pedidos/ordering antes de compra real automática'
    ]
  });
}
