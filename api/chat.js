export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensaje requerido" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        messages: [
          {
            role: "system",
            content: "Eres el agente de atención al cliente de nexo. Responde claro, profesional y orientado a solución.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "Error al generar respuesta.";

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: "Error interno", details: error.message });
  }
}