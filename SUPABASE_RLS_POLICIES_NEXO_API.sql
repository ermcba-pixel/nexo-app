-- NEXO PRODUCCIÓN · RLS POLICIES Y GRANTS PARA API REST / supabase-js
-- Ejecutar una sola vez en Supabase → SQL Editor.

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.clientes to anon, authenticated, service_role;
grant select, insert, update, delete on table public.pedidos to anon, authenticated, service_role;
grant select, insert, update, delete on table public.pagos to anon, authenticated, service_role;
grant select, insert, update, delete on table public.productos to anon, authenticated, service_role;
grant select, insert, update, delete on table public.facturas to anon, authenticated, service_role;
grant select, insert, update, delete on table public.tracking_envios to anon, authenticated, service_role;
grant select, insert, update, delete on table public.afiliados_amazon to anon, authenticated, service_role;
grant select, insert, update, delete on table public.logs_agente1 to anon, authenticated, service_role;
grant select, insert, update, delete on table public.tickets to anon, authenticated, service_role;
grant select, insert, update, delete on table public.respuestas_ticket to anon, authenticated, service_role;
grant select, insert, update, delete on table public.usuarios_admin to authenticated, service_role;

alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pagos enable row level security;
alter table public.productos enable row level security;
alter table public.facturas enable row level security;
alter table public.tracking_envios enable row level security;
alter table public.afiliados_amazon enable row level security;
alter table public.logs_agente1 enable row level security;

drop policy if exists "nexo_clientes_api_insert" on public.clientes;
create policy "nexo_clientes_api_insert" on public.clientes for insert to anon, authenticated with check (true);
drop policy if exists "nexo_clientes_api_select" on public.clientes;
create policy "nexo_clientes_api_select" on public.clientes for select to anon, authenticated using (true);
drop policy if exists "nexo_clientes_api_update" on public.clientes;
create policy "nexo_clientes_api_update" on public.clientes for update to anon, authenticated using (true) with check (true);

drop policy if exists "nexo_pedidos_api_insert" on public.pedidos;
create policy "nexo_pedidos_api_insert" on public.pedidos for insert to anon, authenticated with check (true);
drop policy if exists "nexo_pedidos_api_select" on public.pedidos;
create policy "nexo_pedidos_api_select" on public.pedidos for select to anon, authenticated using (true);
drop policy if exists "nexo_pedidos_api_update" on public.pedidos;
create policy "nexo_pedidos_api_update" on public.pedidos for update to anon, authenticated using (true) with check (true);

drop policy if exists "nexo_pagos_api_all" on public.pagos;
create policy "nexo_pagos_api_all" on public.pagos for all to anon, authenticated using (true) with check (true);
drop policy if exists "nexo_productos_api_all" on public.productos;
create policy "nexo_productos_api_all" on public.productos for all to anon, authenticated using (true) with check (true);
drop policy if exists "nexo_facturas_api_all" on public.facturas;
create policy "nexo_facturas_api_all" on public.facturas for all to anon, authenticated using (true) with check (true);
drop policy if exists "nexo_tracking_api_all" on public.tracking_envios;
create policy "nexo_tracking_api_all" on public.tracking_envios for all to anon, authenticated using (true) with check (true);
drop policy if exists "nexo_afiliados_api_all" on public.afiliados_amazon;
create policy "nexo_afiliados_api_all" on public.afiliados_amazon for all to anon, authenticated using (true) with check (true);
drop policy if exists "nexo_logs_agente1_api_all" on public.logs_agente1;
create policy "nexo_logs_agente1_api_all" on public.logs_agente1 for all to anon, authenticated using (true) with check (true);
