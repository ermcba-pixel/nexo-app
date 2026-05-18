-- Crear tabla segura para medios de pago declarados por cliente (NO guardar CVV ni número completo de tarjeta)
create table if not exists public.medios_pago_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  tipo text not null check (tipo in ('card','bank','paypal','payoneer')),
  titular text,
  marca text,
  ultimos4 text,
  vencimiento text,
  banco text,
  routing_aba text,
  cuenta_ultimos4 text,
  tipo_transferencia text,
  token_pasarela text,
  activo boolean default true,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

comment on table public.medios_pago_cliente is 'Medios de pago tokenizados/enmascarados. Nunca guardar CVV ni número completo de tarjeta.';
