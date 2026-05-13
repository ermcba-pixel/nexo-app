-- Políticas mínimas para que nexo™ pueda insertar y leer datos desde Supabase JS/REST.
-- Ejecutar en Supabase SQL Editor si alguna tabla aparece vacía por bloqueo RLS.

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

drop policy if exists "nexo clientes insert anon" on public.clientes;
create policy "nexo clientes insert anon" on public.clientes for insert to anon, authenticated with check (true);
drop policy if exists "nexo clientes select anon" on public.clientes;
create policy "nexo clientes select anon" on public.clientes for select to anon, authenticated using (true);
drop policy if exists "nexo clientes update anon" on public.clientes;
create policy "nexo clientes update anon" on public.clientes for update to anon, authenticated using (true) with check (true);

drop policy if exists "nexo pedidos insert anon" on public.pedidos;
create policy "nexo pedidos insert anon" on public.pedidos for insert to anon, authenticated with check (true);
drop policy if exists "nexo pedidos select anon" on public.pedidos;
create policy "nexo pedidos select anon" on public.pedidos for select to anon, authenticated using (true);
drop policy if exists "nexo pedidos update anon" on public.pedidos;
create policy "nexo pedidos update anon" on public.pedidos for update to anon, authenticated using (true) with check (true);

drop policy if exists "nexo pagos insert anon" on public.pagos;
create policy "nexo pagos insert anon" on public.pagos for insert to anon, authenticated with check (true);
drop policy if exists "nexo pagos select anon" on public.pagos;
create policy "nexo pagos select anon" on public.pagos for select to anon, authenticated using (true);

drop policy if exists "nexo productos insert anon" on public.productos;
create policy "nexo productos insert anon" on public.productos for insert to anon, authenticated with check (true);
drop policy if exists "nexo productos select anon" on public.productos;
create policy "nexo productos select anon" on public.productos for select to anon, authenticated using (true);

drop policy if exists "nexo facturas insert anon" on public.facturas;
create policy "nexo facturas insert anon" on public.facturas for insert to anon, authenticated with check (true);
drop policy if exists "nexo facturas select anon" on public.facturas;
create policy "nexo facturas select anon" on public.facturas for select to anon, authenticated using (true);

drop policy if exists "nexo tracking insert anon" on public.tracking_envios;
create policy "nexo tracking insert anon" on public.tracking_envios for insert to anon, authenticated with check (true);
drop policy if exists "nexo tracking select anon" on public.tracking_envios;
create policy "nexo tracking select anon" on public.tracking_envios for select to anon, authenticated using (true);

drop policy if exists "nexo afiliados insert anon" on public.afiliados_amazon;
create policy "nexo afiliados insert anon" on public.afiliados_amazon for insert to anon, authenticated with check (true);
drop policy if exists "nexo afiliados select anon" on public.afiliados_amazon;
create policy "nexo afiliados select anon" on public.afiliados_amazon for select to anon, authenticated using (true);

drop policy if exists "nexo logs insert anon" on public.logs_agente1;
create policy "nexo logs insert anon" on public.logs_agente1 for insert to anon, authenticated with check (true);
drop policy if exists "nexo logs select anon" on public.logs_agente1;
create policy "nexo logs select anon" on public.logs_agente1 for select to anon, authenticated using (true);

drop policy if exists "nexo tickets insert anon" on public.tickets;
create policy "nexo tickets insert anon" on public.tickets for insert to anon, authenticated with check (true);
drop policy if exists "nexo tickets select anon" on public.tickets;
create policy "nexo tickets select anon" on public.tickets for select to anon, authenticated using (true);
drop policy if exists "nexo respuestas insert anon" on public.respuestas_ticket;
create policy "nexo respuestas insert anon" on public.respuestas_ticket for insert to anon, authenticated with check (true);
drop policy if exists "nexo respuestas select anon" on public.respuestas_ticket;
create policy "nexo respuestas select anon" on public.respuestas_ticket for select to anon, authenticated using (true);
