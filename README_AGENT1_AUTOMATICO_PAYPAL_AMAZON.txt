nexo – Agente 1 automático PayPal → Amazon

Cambios aplicados:
1. Se agregó /api/agent1-auto-purchase.
2. Al volver de PayPal Orders API, nexo-confirmacion.html captura el pago y llama automáticamente al Agente 1.
3. El pedido ya no queda como “pendiente de aprobación manual”; queda como:
   - agente_1_compra_automatica_iniciada
   - agente_1_compra_automatica_preparada_sandbox
   - agente_1_compra_automatica_en_cola
4. La comisión/diferencia queda registrada como margen nexo en PayPal.
5. Meru no se usa como API. Solo queda como cuenta bancaria/retiro.
6. Cuando Amazon habilite producción real, activar en Vercel:
   AMAZON_PRODUCTION_ENABLED=true
   o
   AMAZON_AUTO_PURCHASE_ENABLED=true

Variables mínimas Vercel:
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=live
AMAZON_CLIENT_ID=
AMAZON_CLIENT_SECRET=
AMAZON_REFRESH_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

Cuando Amazon habilite Creators API:
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_ASSOCIATE_TAG=nexo08-20

Nota técnica honesta:
Mientras Amazon mantenga SP-API en entorno de pruebas o Creators API bloqueada por ventas calificadas, el Agente 1 toma el pedido automáticamente y lo deja en cola técnica automática, sin aprobación manual humana. La ejecución real de compra Amazon requiere Amazon Ordering/SP-API en producción y permisos activos.
