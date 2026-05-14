grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.respuestas_ticket to anon, authenticated, service_role;
grant select, insert, update, delete on public.tickets to anon, authenticated, service_role;
alter table public.respuestas_ticket enable row level security;
alter table public.tickets enable row level security;
drop policy if exists "nexo_respuestas_ticket_all_v12" on public.respuestas_ticket;
create policy "nexo_respuestas_ticket_all_v12" on public.respuestas_ticket for all to anon, authenticated using (true) with check (true);
drop policy if exists "nexo_tickets_all_v12" on public.tickets;
create policy "nexo_tickets_all_v12" on public.tickets for all to anon, authenticated using (true) with check (true);
