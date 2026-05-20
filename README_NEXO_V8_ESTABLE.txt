Corrección soporte nexo 2026-05-15:
- El correo oficial ermcba@hotmail.com ahora abre Gmail web compose como respaldo, además de mailto.
- Los botones "Copiar ticket" y "Enviar correo oficial" quedan con acciones JS reales.
- El formulario de reclamo guarda el ticket por /api/ticket y asocia cliente_id buscando el cliente por email en Supabase.
- Ya no se elimina nexoClientProfile al entrar a Atención al Cliente.
- El panel intenta autocompletar nombre/email/teléfono/país desde la sesión del cliente.
- El Agente IA usa /api/nexo-ai; si OpenAI no está activo, muestra aviso de respaldo local.

IMPORTANTE PARA ACTIVAR OPENAI REAL EN VERCEL:
Vercel > Project > Settings > Environment Variables > agregar OPENAI_API_KEY en Production.
Luego hacer redeploy. Puedes probar en navegador: /api/nexo-ai. Debe devolver hasOpenAIKey: true.
