export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agent = 'general', question = '', page = '' } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Consulta vacía' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        answer: respuestaLocal(agent, question),
        mode: 'fallback_without_openai_key'
      });
    }

    const systemPrompt = construirPrompt(agent);
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Página: ${page}\nConsulta del usuario: ${question}` }
        ],
        max_output_tokens: 650
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('OpenAI error:', detail);
      return res.status(200).json({ answer: respuestaLocal(agent, question), mode: 'fallback_openai_error' });
    }

    const data = await response.json();
    const answer = extraerTexto(data) || respuestaLocal(agent, question);
    return res.status(200).json({ answer, mode: 'openai' });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ answer: respuestaLocal('general', req.body?.question || ''), mode: 'fallback_exception' });
  }
}

function construirPrompt(agent) {
  const base = `Eres un agente virtual profesional de nexo, plataforma de intermediación digital internacional. Responde en español claro, ejecutivo y útil. No inventes datos. Si faltan datos, pide lo mínimo necesario. No prometas acciones imposibles. Mantén tono corporativo y orientado a solución.`;
  const reglas = `\nReglas: no solicites claves ni datos bancarios completos; no digas que una compra o pago fue ejecutado si no hay confirmación; si el caso requiere revisión humana, genera pasos y sugiere crear ticket.`;
  if (agent === 'compras') return base + reglas + `\nRol: Agente 1 de compras. Ayudas con búsqueda de productos, proveedor, precio, disponibilidad, compra internacional, riesgo, tiempos de entrega y comparación Amazon/CJ Dropshipping.`;
  if (agent === 'soporte') return base + reglas + `\nRol: Agente 2 de soporte. Ayudas con reclamos, consultas, cambios, devoluciones, seguimiento de pedido, pago y prioridad del ticket.`;
  if (agent === 'marketing') return base + reglas + `\nRol: Agente 3 de marketing. Ayudas con campañas, ventas, ROI, conversión, segmentación, posicionamiento y recomendaciones comerciales para nexo.`;
  return base + reglas;
}

function extraerTexto(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text);
      if (content.text && typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

function respuestaLocal(agent, question) {
  const ticket = 'NEXO-IA-' + new Date().toISOString().slice(0,10).replaceAll('-', '') + '-' + Math.floor(1000 + Math.random() * 9000);
  const q = String(question || '').toLowerCase();
  if (agent === 'compras') {
    return `Agente IA Compras nexo\n\nRecibí tu consulta: "${question}".\n\nOrientación inicial:\n1. Confirmar producto, cantidad, país de destino y presupuesto.\n2. Comparar proveedor, disponibilidad, precio final y tiempo de entrega.\n3. Validar margen y riesgo antes de emitir la orden.\n\nReferencia: ${ticket}\n\nModo actual: respuesta local. Para IA completa, configura OPENAI_API_KEY en Vercel.`;
  }
  if (agent === 'soporte') {
    return `Agente IA Soporte nexo\n\nRecibí tu consulta: "${question}".\n\nOrientación inicial:\n1. Indica número de pedido, producto y correo registrado.\n2. Describe si es reclamo, devolución, cambio, pago o seguimiento.\n3. Completa el formulario para registrar el ticket formal.\n\nReferencia: ${ticket}\n\nModo actual: respuesta local. Para IA completa, configura OPENAI_API_KEY en Vercel.`;
  }
  if (agent === 'marketing') {
    return `Agente IA Marketing nexo\n\nRecibí tu consulta: "${question}".\n\nOrientación inicial:\n1. Definir objetivo: ventas, tráfico, captación o retención.\n2. Medir conversión, costo por cliente y ROI.\n3. Priorizar campañas con mayor margen y menor riesgo operativo.\n\nReferencia: ${ticket}\n\nModo actual: respuesta local. Para IA completa, configura OPENAI_API_KEY en Vercel.`;
  }
  return `Agente IA nexo\n\nRecibí tu consulta. Referencia: ${ticket}\n\nPara IA completa, configura OPENAI_API_KEY en Vercel.`;
}