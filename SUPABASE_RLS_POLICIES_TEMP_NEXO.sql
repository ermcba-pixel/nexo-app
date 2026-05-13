-- Ejecutar en Supabase SQL Editor si las tablas siguen vacías desde el sitio.
-- Permisos temporales operativos para que el frontend/API pueda insertar y leer.
-- Luego los endurecemos cuando Auth quede completo.

alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pagos enable row level security;
alter table public.productos enable row level security;
alter table public.facturas enable row level security;
alter table public.tracking_envios enable row level security;
alter table public.afiliados_amazon enable row level security;
alter table public.logs_agente1 enable row level security;
alter table public.tickets enable row level security;
alter table public.respuestas_ticket enable row level security;

create policy if not exists "nexo_clientes_operativo" on public.clientes for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_pedidos_operativo" on public.pedidos for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_pagos_operativo" on public.pagos for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_productos_operativo" on public.productos for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_facturas_operativo" on public.facturas for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_tracking_operativo" on public.tracking_envios for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_afiliados_operativo" on public.afiliados_amazon for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_logs_operativo" on public.logs_agente1 for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_tickets_operativo" on public.tickets for all to anon, authenticated using (true) with check (true);
create policy if not exists "nexo_respuestas_ticket_operativo" on public.respuestas_ticket for all to anon, authenticated using (true) with check (true);
