export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "agente1-pagos", status: "ready" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const order = req.body || {};
  const pedidoId = order.id || order.supabase_id || ("NEXO-" + Date.now());
  const totalCliente = Number(order.total || 0);
  const subtotalProveedor = Number(order.subtotal || 0);
  const comision = Number(order.commission || Math.max(0, totalCliente - subtotalProveedor));

  // IMPORTANTE: este endpoint deja preparada la cola de automatización.
  // Para ejecutar pagos reales al proveedor se deben conectar: PayPal Webhooks/Orders API, PayPal Orders/Webhooks y API oficial del proveedor.
  return res.status(200).json({
    success: true,
    pedidoId,
    agent: "Agente 1",
    clientePagoDestino: "PayPal nexo™",
    proveedorPagoOrigen: "PayPal (si el proveedor acepta PayPal)",
    estado: "cola_pago_proveedor_preparada",
    totalClienteUsd: totalCliente,
    montoProveedorEstimadoUsd: subtotalProveedor,
    comisionNexoUsd: comision,
    requiereIntegracionesReales: ["PayPal Webhook", "Proveedor API"]
  });
}
