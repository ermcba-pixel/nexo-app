INTEGRACION AMAZON BUSINESS - nexo

Este ZIP actualiza:
- api/amazon-products.js
- api/agent1-amazon.js
- nexo-tienda-cliente.html

Qué hace:
1. Intercambia AMAZON_REFRESH_TOKEN + AMAZON_CLIENT_ID + AMAZON_CLIENT_SECRET por access token LWA.
2. Intenta llamar a Amazon Business Product Search API usando endpoint sandbox NA por defecto.
3. Si Amazon sandbox/producción no devuelve catálogo dinámico, muestra un catálogo inteligente de respaldo de hasta 24 productos para evitar resultados pobres como una sola funda.
4. Agent 1 verifica token LWA y prepara pedido en sandbox-ready.

Variables necesarias en Vercel:
- AMAZON_CLIENT_ID
- AMAZON_CLIENT_SECRET
- AMAZON_REFRESH_TOKEN
- SUPABASE_URL
- SUPABASE_ANON_KEY

Variables opcionales:
- AMAZON_REGION=NA
- AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
- AMAZON_BUSINESS_API_ENDPOINT=https://sandbox.na.business-api.amazon.com
- AMAZON_PRODUCT_SEARCH_PATH=/products/2020-08-26/products
- AMAZON_USE_LIVE=1

Importante:
Amazon Business Sandbox es estático y puede devolver respuestas simuladas solo con parámetros exactos de su guía. Para compra real se necesita aprobación de producción para Product Search, Cart API y Ordering API.
