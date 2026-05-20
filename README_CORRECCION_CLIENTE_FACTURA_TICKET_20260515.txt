CORRECCIÓN 2026-05-15 - nexo

Incluye:
1. Checkout vuelve a cargar datos reales del cliente desde localStorage/sessionStorage y Supabase.
2. Al volver a ingresar, ya no se borra nexoClientProfile ni clientEmail.
3. Factura/confirmación muestra:
   - Cliente: nombre real registrado.
   - Correo: correo real registrado.
   - NIT / Documento del cliente internacional: 99001 fijo.
   - NIT / Documento del cliente: documento/NIT declarado por el cliente.
4. API de guardado de orden deja numero_fiscal siempre como 99001 y guarda el documento real aparte.
5. Atención al cliente ya no muestra alert fijo: muestra recibo visible del ticket para respaldo del cliente.
6. Correo oficial mantiene enlace mailto a ermcba@hotmail.com con asunto RECLAMO.

Subir este ZIP completo a GitHub/Vercel y probar nuevamente con una compra pequeña.
