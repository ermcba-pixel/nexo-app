# NEXO - Flujo Real Automático de Pagos (Agente 1)

## Flujo definitivo

1. Cliente confirma pedido en checkout.
2. Cliente selecciona:
   - PayPal
   - Tarjeta
   - Transferencia bancaria
   - Payoneer

3. El sistema procesa el cobro automáticamente mediante APIs oficiales.
4. Supabase registra:
   - pedido
   - pago
   - estado
   - tracking
   - comisión
   - proveedor

5. Agente 1 toma automáticamente pedidos PAGADOS.
6. Si el proveedor es CJ:
   - Agente 1 crea automáticamente la orden CJ mediante API CJ.
   - Agente 1 paga automáticamente al proveedor CJ.
   - Agente 1 registra tracking y costos.
   - La comisión queda registrada automáticamente.

## Seguridad

NO guardar:
- contraseñas PayPal
- contraseñas Payoneer
- CVV
- datos completos de tarjeta

SI guardar:
- IDs de transacción
- estados
- tracking
- comisión
- token API empresarial cifrado

## Corrección técnica importante

El cliente NO debe entregar usuario/contraseña PayPal o Payoneer dentro de nexo.

La autorización debe realizarse únicamente mediante:
- OAuth,
- Checkout API,
- Tokens oficiales,
- Webhooks.

## Estado objetivo

Cliente paga una sola vez en nexo y no realiza más acciones.
Agente 1 ejecuta todo automáticamente:
- cobro,
- pago proveedor,
- tracking,
- actualización estados,
- comisión,
- facturación.
