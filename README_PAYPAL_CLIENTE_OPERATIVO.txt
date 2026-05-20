nexo – pago del cliente por PayPal operativo

Flujo aplicado en este ZIP:
1. El cliente arma carrito y va a checkout.
2. El único método visible/operativo es PayPal.
3. Al confirmar, nexo guarda el pedido local/Supabase si está disponible.
4. nexo llama a /api/paypal-create-order.
5. Si Vercel tiene PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET, se crea orden real PayPal Orders API y redirige al cliente a PayPal.
6. Al volver de PayPal, nexo-confirmacion.html llama a /api/paypal-capture-order para capturar el cobro.
7. El pedido queda marcado como pago PayPal capturado y pendiente de Agente 1 para compra Amazon.
8. Si faltan credenciales PayPal API, se usa fallback PayPal Standard directo a ermcba@hotmail.com para no frenar la prueba del cobro.

Variables necesarias en Vercel:
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=live

Opcional si usas sandbox:
PAYPAL_ENV=sandbox

Importante:
- Meru no se usa como API del sistema.
- Meru queda solo para retiro/uso bancario empresarial.
- La diferencia/comisión queda en PayPal después de pagar a Amazon.
- Para productos/fotos originales Amazon siguen siendo necesarias las variables PA-API:
  AMAZON_ACCESS_KEY
  AMAZON_SECRET_KEY
  AMAZON_ASSOCIATE_TAG=nexo08-20
