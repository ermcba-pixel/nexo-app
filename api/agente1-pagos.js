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
  // Comisión nexo™: SIEMPRE 30% sobre el precio del proveedor, no sobre el total cobrado.
  // Ej.: proveedor 100 => comisión 30 => total cliente mínimo 130.
  const comision = Number(order.commission || (subtotalProveedor * 0.30));

  // IMPORTANTE: operación actual solo con PayPal.
  // Este endpoint deja preparada la cola operativa del Agente 1 para confirmar el cobro PayPal,
  // registrar la comisión nexo™ y coordinar el pago al proveedor mediante PayPal o el método aceptado por el proveedor.
  return res.status(200).json({
    success: true,
    pedidoId,
    agent: "Agente 1",
    clientePagoDestino: "PayPal nexo™",
    proveedorPagoOrigen: "PayPal / método aceptado por proveedor",
    estado: "cola_operativa_proveedor_preparada",
    totalClienteUsd: totalCliente,
    montoProveedorEstimadoUsd: subtotalProveedor,
    comisionNexoUsd: comision,
    comisionBase: '30% sobre precio proveedor',
    totalPayPalDebeCobrarUsd: totalCliente,
    requiereIntegracionesReales: ["PayPal Webhook", "PayPal Orders/Capture API", "Proveedor API o proceso autorizado"]
  });
}
