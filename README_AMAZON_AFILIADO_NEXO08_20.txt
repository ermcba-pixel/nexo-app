nexo – Amazon Afiliado temporal hasta Creators API

Ajustes incluidos:
1. Todos los enlaces Amazon generados desde la tienda incorporan tag=nexo08-20.
2. Si el cliente hace clic en “Ver proveedor original”, sale a Amazon como referido de nexo.
3. Se guarda rastro local del click y se intenta registrar en Supabase tabla afiliados_amazon.
4. En pedidos se guarda producto_url/amazon_url con tag=nexo08-20, amazon_tag y amazon_asin si existe.
5. api/amazon-products.js devuelve URLs temporales y PA-API con tag afiliado.

Importante:
- Amazon exige ventas calificadas antes de liberar Creators API completa.
- Mientras tanto, los links afiliados permiten acumular compras/referidos para nexo08-20.
- Cuando Amazon autorice Creators API, solo se reemplaza proveedor de catálogo sin cambiar el flujo principal.
