export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'nexo-ai',
      hasOpenAIKey: Boolean(apiKey),
      keyPrefix: apiKey ? apiKey.slice(0, 10) + '...' : null,
      environment: process.env.VERCEL_ENV || 'unknown'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agent = 'soporte', question = '', page = '' } = req.body || {};

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Consulta vacía' });
    }

    if (!apiKey) {
      return res.status(200).json({
        answer: respuestaLocal(agent, question),
        mode: 'fallback_without_openai_key',
        hasOpenAIKey: false
      });
    }

    const systemPrompt = construirPrompt(agent);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.35,
        max_tokens: 450
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(200).json({
        answer: respuestaLocal(agent, question) + "\n\nAviso técnico: la clave existe, pero OpenAI devolvió error. Revise créditos/facturación o permisos de la API.",
        mode: 'openai_error',
        hasOpenAIKey: true,
        openaiStatus: r.status,
        openaiError: data?.error?.message || 'Error no especificado'
      });
    }

    const answer = data?.choices?.[0]?.message?.content || respuestaLocal(agent, question);

    return res.status(200).json({
      answer,
      mode: 'openai',
      hasOpenAIKey: true
    });

  } catch (err) {
    return res.status(200).json({
      answer: 'No pude conectar con la IA en este momento. El caso puede registrarse mediante el formulario de soporte.',
      mode: 'server_error',
      error: err?.message || String(err)
    });
  }
}

function construirPrompt(agent) {
  if (agent === 'compras') {
    return `Eres el Agente IA de Compras de nexo. Ayudas a clientes con productos, proveedores, presupuesto, tiempos, riesgos de compra, validación de pedido y pasos de compra internacional. Responde en español, claro, profesional y breve.`;
  }
  if (agent === 'marketing') {
    return `Eres el Agente IA de Marketing de nexo. Ayudas con ventas digitales, campañas, ROI, segmentación, anuncios, embudos y recomendaciones comerciales. Responde en español, claro, profesional y accionable.`;
  }
  return `Eres el Agente IA de Soporte de nexo. Atiendes reclamos, pedidos, pagos, devoluciones, cambios, seguimiento y tickets. Responde en español, con tono profesional, humano y orientado a resolver. Si faltan datos, pide número de pedido, correo registrado, producto, país, método de pago y detalle del problema. No inventes información.`;
}

function respuestaLocal(agent, question) {
  const ref = 'NEXO-IA-' + new Date().toISOString().slice(0,10).replaceAll('-','') + '-' + Math.floor(1000 + Math.random()*9000);
  if (agent === 'compras') {
    return `Agente IA Compras nexo\n\nRecibí tu consulta: "${question}".\n\nOrientación inicial:\n1. Indica producto exacto, país de destino y presupuesto máximo.\n2. Valida proveedor, tiempo de entrega y costo total antes de confirmar.\n3. Si deseas, registra la solicitud para análisis de compra.\n\nReferencia: ${ref}\n\nModo actual: respuesta local. Para IA completa, configura OPENAI_API_KEY en Vercel.`;
  }
  if (agent === 'marketing') {
    return `Agente IA Marketing nexo\n\nRecibí tu consulta: "${question}".\n\nOrientación inicial:\n1. Define objetivo: ventas, tráfico, posicionamiento o conversión.\n2. Indica canal, presupuesto y público objetivo.\n3. Solicita un plan de campaña para medir ROI.\n\nReferencia: ${ref}\n\nModo actual: respuesta local. Para IA completa, configura OPENAI_API_KEY en Vercel.`;
  }
  return `Agente IA Soporte nexo\n\nRecibí tu consulta: "${question}".\n\nOrientación inicial:\n1. Indica número de pedido, producto y correo registrado.\n2. Describe si es reclamo, devolución, cambio, pago o seguimiento.\n3. Completa el formulario para registrar el ticket formal.\n\nReferencia: ${ref}\n\nModo actual: respuesta local. Para IA completa, configura OPENAI_API_KEY en Vercel.`;
}
