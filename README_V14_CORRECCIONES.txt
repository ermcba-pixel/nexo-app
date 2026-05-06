Correcciones v14:
- Registro cliente: validador completo con tildes/ticks por Mayúscula, minúscula, Número, Símbolo y 8 caracteres. El botón solo habilita cuando todo está correcto.
- Amazon: endpoint /api/amazon-products creado para Amazon Business Sandbox con orden mayor a menor.
- Imágenes: preparado para usar imágenes originales Amazon cuando Producción entregue URLs válidas; Sandbox usa fallback sin errores.
- Carrito: los costos de envío/proveedor quedan marcados como estimados de Sandbox. El costo real debe venir de Amazon con la dirección completa del cliente en Producción/Ordering API.
