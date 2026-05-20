nexo™ – Activación backend real Agente 1 + PayPal

1) Variables necesarias en Vercel
- PAYPAL_ENV=live
- PAYPAL_CLIENT_ID=tu_client_id_live
- PAYPAL_CLIENT_SECRET=tu_secret_live
- SUPABASE_URL=https://ujqbbniptflzytdankwp.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
- AMAZON_ASSOCIATE_TAG=nexo08-20
- NEXO_PUBLIC_URL=https://tu-dominio.vercel.app

2) Webhook PayPal
En PayPal Developer > Live App > Webhooks agregar:
https://tu-dominio.vercel.app/api/paypal-webhook

Eventos mínimos:
- PAYMENT.CAPTURE.COMPLETED
- CHECKOUT.ORDER.APPROVED
- CHECKOUT.ORDER.COMPLETED

Luego copiar el Webhook ID y crear en Vercel:
PAYPAL_WEBHOOK_ID=...

3) Prueba técnica
Abrir:
/api/paypal-create-order
/api/paypal-capture-order
/api/agent1-procesar?health=1
/api/paypal-webhook

4) Flujo operativo
Cliente elige PayPal -> nexo crea pedido -> crea orden PayPal -> cliente paga -> PayPal vuelve a nexo -> captura pago -> Supabase actualiza estado_pago -> Agente 1 toma el pedido.

5) Amazon
Hasta que Amazon autorice API completa, Agente 1 deja la compra en cola operativa con link proveedor, tag nexo08-20, comisión y tracking PENDIENTE_AMAZON.
Cuando Amazon API esté autorizada se activa AMAZON_AUTO_PURCHASE_ENABLED=true y se conecta la compra real.
