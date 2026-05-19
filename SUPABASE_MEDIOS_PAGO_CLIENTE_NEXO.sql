
-- nexo™ · Medios de pago seguros y campos tributarios Bolivia
-- Ejecutar una sola vez en Supabase SQL Editor.

create table if not exists public.medios_pago_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  tipo text not null check (tipo in ('card','bank','paypal','payoneer')),
  titular text,
  marca text,
  ultimos4 text,
  vencimiento text,
  mascara text,
  banco text,
  routing text,
  cuenta_mascara text,
  tipo_transferencia text,
  cvv_guardado boolean default false,
  activo boolean default true,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

alter table public.facturas add column if not exists cliente_email text;
alter table public.facturas add column if not exists nit_documento_cliente_internacional text default '99001';
alter table public.facturas add column if not exists nit_documento_cliente text;

alter table public.pedidos add column if not exists cliente_documento text;
alter table public.pedidos add column if not exists cliente_direccion text;
alter table public.pedidos add column if not exists cliente_ciudad text;
alter table public.pedidos add column if not exists cliente_pais text;

-- Seguridad: jamás guardar CVV ni número completo de tarjeta.
comment on table public.medios_pago_cliente is 'Medios de pago del cliente guardados de forma enmascarada. No almacenar CVV ni tarjeta completa.';
