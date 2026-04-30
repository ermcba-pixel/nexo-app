export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "nexo-ai",
      hasOpenAIKey: Boolean(apiKey),
      keyPrefix: apiKey ? apiKey.slice(0, 10) + "..." : null,
      environment: process.env.VERCEL_ENV || "unknown"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { agent = "soporte", question = "", page = "" } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Consulta vacía" });
    }

    if (!apiKey) {
      return res.status(200).json({
        answer: respuestaLocal(agent, question),
        mode: "fallback_without_openai_key",
        hasOpenAIKey: false
      });
    }

    const systemPrompt = construirPrompt(agent, page);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.35,
        max_output_tokens: 500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        answer:
          "Agente IA Soporte nexo™\n\n" +
          "Recibí tu consulta, pero OpenAI devolvió un error técnico.\n\n" +
          "Esto suele pasar por falta de créditos, facturación no activada o permisos de la API.\n\n" +
          `Detalle técnico: ${data?.error?.message || "Error no especificado"}`,
        mode: "openai_error",
        hasOpenAIKey: true,
        openaiStatus: response.status
      });
    }

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      data.choices?.[0]?.message?.content ||
      respuestaLocal(agent, question);

    return res.status(200).json({
      answer: text,
      mode: "openai",
      hasOpenAIKey: true
    });

  } catch (error) {
    return res.status(200).json({
      answer:
        "Agente IA Soporte nexo™\n\n" +
        "No pude conectar con OpenAI en este momento. Puedes registrar el caso usando el formulario de soporte.",
      mode: "server_error",
      error: error?.message || String(error)
    });
  }
}

function construirPrompt(agent, page) {
  if (agent === "compras") {
    return "Eres el Agente 1 de Compras IA de nexo™. Ayudas con productos, proveedores, precios, disponibilidad, presupuesto, tiempos de entrega y riesgos de compra internacional. Responde en español, claro, profesional y breve.";
  }

  if (agent === "marketing") {
    return "Eres el Agente 3 de Marketing IA de nexo™. Ayudas con campañas digitales, ventas, posicionamiento, ROI, segmentación y recomendaciones comerciales. Responde en español, claro y accionable.";
  }

  return [
    "Eres el Agente 2 de Soporte IA de nexo™.",
    "Tu función es atender consultas de clientes sobre tickets, pedidos, pagos, devoluciones, cambios, reclamos y seguimiento.",
    "Responde en español con tono profesional, humano y directo.",
    "No inventes datos del pedido. Si faltan datos, solicita número de pedido, correo registrado, producto, país, método de pago y fecha aproximada.",
    "Sugiere completar el formulario de soporte para crear registro formal del ticket.",
    "Mantén la respuesta breve y ordenada."
  ].join(" ");
}

function respuestaLocal(agent, question) {
  const ref = "NEXO-SOP-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") + "-" + Math.floor(1000 + Math.random() * 9000);

  if (agent === "compras") {
    return `Agente IA Compras nexo™\n\nRecibí tu consulta: "${question}".\n\nPara avanzar necesito producto, país de destino, cantidad y presupuesto máximo.\n\nReferencia: ${ref}`;
  }

  if (agent === "marketing") {
    return `Agente IA Marketing nexo™\n\nRecibí tu consulta: "${question}".\n\nPara ayudarte necesito objetivo comercial, canal, público objetivo y presupuesto.\n\nReferencia: ${ref}`;
  }

  return `Agente IA Soporte nexo™\n\nRecibí tu consulta: "${question}".\n\nPara ubicar tu caso necesito:\n1. Número de pedido o ticket.\n2. Correo usado en la compra.\n3. Producto y fecha aproximada.\n4. Descripción del problema.\n\nReferencia: ${ref}`;
}
