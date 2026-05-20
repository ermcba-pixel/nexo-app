CORRECCIÓN REAL APLICADA

1) Nombre oficial SENAPI
Se eliminó la frase "Intermediación Digital" y "Plataforma de intermediación comercial internacional".
El sistema queda como:

nexo – Sistema de Intermediación Comercial Internacional

Aplicado en panel principal, portal principal, footers, i18n global y paneles internos.

2) Tienda / productos Amazon
Se eliminó el catálogo demo local como fuente visible inicial para evitar que aparezcan productos falsos de AliExpress/Temu/Marketplace cuando se busca iPhone/laptop.
Ahora la tienda consulta primero:
/api/amazon-products

El endpoint está preparado para PA-API 5.0 de Amazon y devuelve productos reales ordenados de mayor a menor precio, con imágenes originales Amazon.

Para que Amazon devuelva productos reales en Vercel deben existir estas variables:
AMAZON_ACCESS_KEY
AMAZON_SECRET_KEY
AMAZON_ASSOCIATE_TAG
AMAZON_REGION=us-east-1
AMAZON_HOST=webservices.amazon.com
AMAZON_MARKETPLACE=www.amazon.com

Las variables AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET y AMAZON_REFRESH_TOKEN son de SP-API/LWA y sirven para la fase de órdenes/compras, pero por sí solas no reemplazan PA-API para búsqueda de productos e imágenes originales.

3) Gastos reales Amazon / Marketplace
/api/amazon-shipping-quote recibe dirección real del cliente e items.
No inventa costos sandbox. Si Amazon no devuelve costo real, deja shippingAmazon/vendorFee en null y marca status pending_real_amazon_checkout_quote.

4) Después de subir este ZIP a GitHub/Vercel
Hacer Redeploy y limpiar caché del navegador con Ctrl+F5.
