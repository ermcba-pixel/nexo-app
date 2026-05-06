export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "agente1-pagos",
      status: "ready",
      amazonCredentialsDetected: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET),
      supabaseDetected: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const order = req.body || {};
  const pedidoId = order.id || order.supabase_id || ("NEXO-" + Date.now());
  const totalCliente = Number(order.total || order?.totals?.total || 0);
  const subtotalProveedor = Number(order.subtotal || order?.totals?.subtotal || 0);
  const comision = Number(order.commission || order?.totals?.commission || Math.max(0, totalCliente - subtotalProveedor));
  const amazonItems = Array.isArray(order.items) ? order.items.filter(i => String(i.provider || i.proveedor || i.id || '').toLowerCase().includes('amazon')) : [];

  return res.status(200).json({
    success: true,
    pedidoId,
    agent: "Agente 1",
    clientePagoDestino: "PayPal nexo™",
    proveedorPagoOrigen: "Amazon Business / proveedor autorizado",
    estado: "cola_pago_y_compra_preparada",
    modoAmazon: "sandbox",
    amazonItemsDetectados: amazonItems.length,
    amazonCredentialsDetected: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET),
    totalClienteUsd: totalCliente,
    montoProveedorEstimadoUsd: subtotalProveedor,
    comisionNexoUsd: comision,
    siguientePasoProduccion: "Para compra real automática falta autorización OAuth refresh token + AWS IAM Role/ARN + roles Ordering aprobados por Amazon.",
    requiereIntegracionesReales: ["PayPal Webhook", "Amazon Business SP-API production authorization", "Amazon Ordering/Orders role"]
  });
}
