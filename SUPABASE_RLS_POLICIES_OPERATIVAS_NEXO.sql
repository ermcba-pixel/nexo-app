-- NEXO: políticas RLS operativas para permitir API con clave publishable/anon
-- Ejecutar en Supabase SQL Editor si las tablas siguen vacías después de probar el sistema.

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

-- Lectura/escritura operativa temporal para integración inicial. Luego se endurece por usuario/auth.
do $$
declare t text;
begin
  foreach t in array array['clientes','pedidos','pagos','productos','facturas','tracking_envios','afiliados_amazon','logs_agente1','tickets','respuestas_ticket'] loop
    execute format('drop policy if exists "nexo_api_operativa_%s" on public.%I', t, t);
    execute format('create policy "nexo_api_operativa_%s" on public.%I for all to anon, authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Admin: solo roles autenticados/servicio
alter table public.usuarios_admin enable row level security;
drop policy if exists "nexo_admin_auth" on public.usuarios_admin;
create policy "nexo_admin_auth" on public.usuarios_admin for all to authenticated using (true) with check (true);
