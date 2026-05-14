-- nexo™ v11 - políticas RLS operativas con backend service_role
-- Ejecutar en Supabase SQL Editor si el Security Advisor muestra "RLS enabled no policy".
-- La app usa rutas /api con SUPABASE_SERVICE_ROLE_KEY para operaciones reales.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.pedidos to authenticated;
grant select, insert, update, delete on public.pagos to authenticated;
grant select, insert, update, delete on public.productos to authenticated;
grant select, insert, update, delete on public.facturas to authenticated;
grant select, insert, update, delete on public.tracking_envios to authenticated;
grant select, insert, update, delete on public.afiliados_amazon to authenticated;
grant select, insert, update, delete on public.logs_agente1 to authenticated;
grant select, insert, update, delete on public.tickets to authenticated;
grant select, insert, update, delete on public.respuestas_ticket to authenticated;
grant select, insert, update, delete on public.usuarios_admin to authenticated;

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
alter table public.usuarios_admin enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clientes','pedidos','pagos','productos','facturas','tracking_envios','afiliados_amazon','logs_agente1','tickets','respuestas_ticket','usuarios_admin'] loop
    execute format('drop policy if exists "nexo_backend_service_%s" on public.%I', t, t);
    execute format('create policy "nexo_backend_service_%s" on public.%I for all to service_role using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t, t);
  end loop;
end $$;

-- Si todavía necesitas que un usuario autenticado lea datos desde UI protegida por login de Supabase Auth,
-- crea políticas por auth.uid() más adelante. Por ahora el backend seguro opera con service_role.
