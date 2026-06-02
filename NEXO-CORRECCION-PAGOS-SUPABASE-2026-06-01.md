# nexo™ – Corrección de pagos, Supabase y Agente 1

Correcciones aplicadas sobre el último ZIP enviado:

## 1. PayPal
- Se mantiene el flujo correcto: el cliente sale a PayPal Business Checkout.
- La factura final se emite solo después de captura real PayPal por `/api/paypal-capture-order` o webhook.
- Se añadió captura automática al volver desde PayPal con `token`.
- Se corrigió la emisión de factura en Supabase solo cuando el pago está confirmado.

## 2. Tarjeta
- Se eliminó la falsa confirmación de compra sin débito.
- La tarjeta ahora se trata como pago pendiente de captura segura.
- Para débito real, se abre checkout seguro PayPal con preferencia de tarjeta cuando PayPal lo permita.
- nexo™ NO guarda CVV ni número completo; solo marca, últimos 4 y máscara.

## 3. Transferencia bancaria / ACH / Wire
- Se eliminó la falsa factura pagada sin abono.
- El pedido queda como `transferencia_registrada_pendiente_abono`.
- La pantalla de confirmación indica “Pedido registrado - pago pendiente”.
- Se ocultan botones de imprimir/descargar factura hasta confirmar pago.
- Los datos bancarios se guardan en `client_payment_profiles` y localmente para precarga.

## 4. Supabase
- Se conectó con las tablas nuevas:
  - `client_payment_profiles`
  - `agent1_orders`
  - `payment_webhooks`
  - `shipping_quotes`
  - `session_checkout`
  - `logs_agent1`
- Se corrigió uso de `logs_agent1` en lugar de `logs_agente1`.
- `agent1-intake-payment` ahora registra en `agent1_orders`.

## 5. CJ Dropshipping / costos
- Se mantienen costos de envío y operativos CJ estimados cuando CJ todavía no devuelve cotización real.
- Cuando CJ API devuelva costo real, ese valor reemplaza la estimación.

## Pendiente operativo externo
- Payoneer queda pendiente hasta que Payoneer responda y entregue Checkout/API real.
- Tarjeta directa sin PayPal requiere PayPal Advanced Card Payments o pasarela bancaria autorizada.
