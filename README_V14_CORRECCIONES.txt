INTEGRACION AMAZON BUSINESS / SP-API PARA nexo

Cambios realizados:
1. Nuevo endpoint /api/amazon-products
   - Carga productos Amazon Business Sandbox.
   - Usa Environment Variables AMAZON_CLIENT_ID y AMAZON_CLIENT_SECRET para detectar credenciales LWA.
   - Deja la estructura lista para reemplazar Sandbox por llamada SP-API producción cuando Amazon entregue OAuth refresh token + AWS IAM Role.

2. Nuevo endpoint /api/agent1-amazon
   - Recibe pedidos del checkout.
   - Prepara cola del Agente 1 para productos Amazon.
   - En modo sandbox no ejecuta compra real automática.

3. api/agente1-pagos.js actualizado
   - Detecta credenciales Amazon y Supabase.
   - Devuelve estado de cola pago/compra.

4. nexo-tienda-cliente.html actualizado
   - Busca productos desde /api/amazon-products.
   - Muestra proveedor encima del producto.
   - Soporta imágenes de Amazon y datos de precio/stock.
   - Mantiene respaldo local si la API no responde.

5. nexo-checkout.html actualizado
   - Envía pedido también a /api/agent1-amazon.
   - PayPal solo redirige cuando se selecciona PayPal.

6. vercel.json actualizado
   - Permite imágenes de m.media-amazon.com y dominios SSL de Amazon.
   - Permite conexión a Supabase.

Variables requeridas en Vercel:
SUPABASE_URL=https://ujqbbniptflzytdankwp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
AMAZON_CLIENT_ID=amzn1.application-oa2-client...
AMAZON_CLIENT_SECRET=amzn1.oa2-cs.v1...

IMPORTANTE:
Con las credenciales actuales solo queda listo Sandbox. Para compra real automática en producción, Amazon debe entregar/aprobar:
- autorización OAuth de app con refresh token,
- AWS IAM Role/ARN para SP-API,
- permisos/roles de Ordering/Orders/Cart según el flujo final.
