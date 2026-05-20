nexo - Sistema de Intermediación Comercial Internacional
Versión Amazon Sandbox v8 estable

Cambios aplicados:
1. Se cambió el nombre del sistema aprobado por SENAPI en los paneles principales:
   nexo - Sistema de Intermediación Comercial Internacional.
2. Se eliminó el catálogo demo viejo de la tienda pública para que no reaparezcan AliExpress, Temu, Shein ni Marketplace ficticio.
3. La tienda pública consume solo el endpoint /api/amazon-products.
4. El endpoint Amazon queda en modo Sandbox estable, con filtros estrictos por búsqueda.
5. Las imágenes rotas del Sandbox de Amazon ya no se muestran; se usa imagen segura generada por nexo cuando Amazon no entregue una imagen válida.
6. Base preparada para pasar a producción Amazon Business SP-API cuando Amazon libere roles productivos.

Después de subir este ZIP a GitHub/Vercel:
- Hacer Redeploy.
- Abrir en incógnito o Ctrl+Shift+R.
- Probar búsqueda: iphone, laptop, macbook, monitor.
