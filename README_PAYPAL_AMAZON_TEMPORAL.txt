NEXO - ZIP operativo hasta pago PayPal

Cambios incluidos:
1. Se mantiene nombre oficial SENAPI:
   nexo – Sistema de Intermediación Comercial Internacional

2. PayPal queda como flujo principal de cobro del cliente:
   PAYPAL_CLIENT_ID
   PAYPAL_CLIENT_SECRET
   PAYPAL_ENV=live

3. Amazon Creators API / PA-API:
   Como Amazon aún no habilitó credenciales oficiales de catálogo para la cuenta nueva de Associates, se eliminó el bloqueo visual que detenía la tienda.
   El endpoint /api/amazon-products ahora usa:
   - Catálogo oficial Amazon cuando existan AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_ASSOCIATE_TAG.
   - Catálogo temporal profesional mientras Amazon aprueba Creators API.

4. El objetivo de este ZIP es que el sistema avance hasta el pago real del cliente por PayPal.

Variables requeridas en Vercel:
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=live
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AMAZON_CLIENT_ID=
AMAZON_CLIENT_SECRET=
AMAZON_REFRESH_TOKEN=

Variable Amazon ya conocida:
AMAZON_ASSOCIATE_TAG=nexo08-20

Cuando Amazon habilite Creators API, agregar:
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_ASSOCIATE_TAG=nexo08-20
