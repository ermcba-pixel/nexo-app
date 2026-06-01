# Correcciones aplicadas al flujo de pago nexo™

1. Tarjeta ya no abre PayPal clásico: queda en flujo interno Agente 1 / pasarela directa server-side.
2. PayPal sigue abriendo PayPal Business Checkout LIVE.
3. Payoneer abre URL/API de Payoneer si en Vercel existe `PAYONEER_PAYMENT_URL` o `PAYONEER_CHECKOUT_URL`.
4. Transferencia ACH/Wire elimina referencia fija a Lead Bank/Land Bank.
5. Tarjeta guarda solo máscara, marca, últimos 4 y vencimiento. CVV nunca se guarda.
6. Transferencia guarda datos protegidos/marcados para reusar al volver a ingresar.
7. Se agregó `/api/nexo-save-payment-profile` para guardar el perfil de pago en Supabase.
8. Costos CJ: el sistema usa `cjShippingCost`, `shippingCost`, `logisticPrice`, `freightPrice`, `cjHandlingFee`, etc. Si CJ no devuelve flete por falta de variante/dirección completa, Agente 1 debe completar con `/api/cj-shipping-quote` al crear la orden.

## Tabla recomendada Supabase

```sql
create table if not exists client_payment_profiles (
  id uuid primary key default gen_random_uuid(),
  cliente_email text,
  cliente_documento text,
  metodo text,
  card_last4 text,
  card_brand text,
  bank_name text,
  bank_routing text,
  bank_account_masked text,
  payload jsonb,
  updated_at timestamptz default now()
);
```

## Variable para Payoneer

Crear en Vercel cuando Payoneer entregue URL/API de checkout:

```env
PAYONEER_PAYMENT_URL=https://...
```

Sin esa variable, el pedido queda registrado pero no puede redirigir a Payoneer real.
