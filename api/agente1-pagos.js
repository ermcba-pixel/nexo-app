export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "agente1-pagos", status: "ready", noManualApproval: true });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const order = req.body || {};
  const pedidoId = order.id || order.supabase_id || ("NEXO-" + Date.now());
  const totalCliente = Number(order.total || 0);
  const subtotalProveedor = Number(order.subtotal || 0);
  const comision = Number(order.commission || Math.max(0, totalCliente - subtotalProveedor));
  const isPaypal = String(order.paymentMethod || '').toLowerCase() === 'paypal';

  return res.status(200).json({
    success: true,
    pedidoId,
    agent: "Agente 1",
    noManualApproval: true,
    clientePagoDestino: "PayPal nexo™",
    proveedorPagoOrigen: "PayPal / Amazon según disponibilidad del proveedor",
    estado: isPaypal ? "esperando_captura_paypal_para_compra_automatica" : "metodo_no_paypal_pendiente_verificacion",
    totalClienteUsd: totalCliente,
    montoProveedorEstimadoUsd: subtotalProveedor,
    comisionNexoUsd: comision,
    nota: "El Agente 1 no requiere aprobación manual. Con PayPal capturado llama automáticamente a /api/agent1-auto-purchase."
  });
}
