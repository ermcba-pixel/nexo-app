export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const {
      nombre,
      correo,
      telefono,
      pais,
      pedido,
      producto,
      tipo,
      prioridad,
      canal,
      descripcion
    } = req.body || {};

    // Generar ID de ticket
    const ticketId = "nexo™-" + Date.now();

    // Validación básica
    if (!nombre || !correo || !descripcion) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // (Opcional) Aquí puedes enviar email o guardar en DB en el siguiente paso

    return res.status(200).json({
      success: true,
      ticketId,
      message: "Ticket creado correctamente"
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error interno",
      details: error.message
    });
  }
}
