Corrección aplicada:
- Todos los enlaces Amazon quedan forzados con tag=nexo08-20.
- Los clicks en “Ver proveedor original” se registran en Supabase tabla afiliados_amazon.
- Los pedidos registran amazon_tag, amazon_asin, factura_numero, courier/tracking_url y log Agente 1.
- Al guardar pedido se crean registros relacionados en pagos, facturas, logs_agente1 y afiliados_amazon.
- Se corrige cliente_telefono en lugar de cliente_tel para coincidir con Supabase.
- La impresión de confirmación queda enfocada solo en factura/recibo.
