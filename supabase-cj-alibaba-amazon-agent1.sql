-- NEXO: integración CJ + Alibaba + Amazon bajo Agente 1
-- Ejecutar en Supabase SQL Editor. Seguro para repetir por IF NOT EXISTS / ON CONFLICT.

alter table proveedores
add column if not exists proveedor_tipo text,
add column if not exists api_activa boolean default false,
add column if not exists api_key text,
add column if not exists callback_url text,
add column if not exists afiliado_tag text,
add column if not exists estado_integracion text default 'activo';

insert into proveedores (codigo, nombre, proveedor_tipo, api_activa, estado_integracion)
values
('CJ', 'CJ Dropshipping', 'dropshipping_api', true, 'activo'),
('ALIBABA', 'Alibaba', 'sourcing_api', true, 'activo'),
('AMAZON', 'Amazon', 'afiliado_redirect', true, 'activo')
on conflict (codigo) do update
set nombre = excluded.nombre,
    proveedor_tipo = excluded.proveedor_tipo,
    api_activa = excluded.api_activa,
    estado_integracion = excluded.estado_integracion;

update proveedores
set afiliado_tag = 'nexo20-8'
where codigo = 'AMAZON';

alter table productos
add column if not exists proveedor text,
add column if not exists proveedor_producto_id text,
add column if not exists proveedor_url text,
add column if not exists amazon_asin text,
add column if not exists alibaba_product_id text,
add column if not exists cj_product_id text,
add column if not exists fuente text,
add column if not exists comision_nexo numeric default 30,
add column if not exists precio_proveedor numeric,
add column if not exists precio_cliente numeric,
add column if not exists activo boolean default true;

alter table proveedor_productos
add column if not exists proveedor text,
add column if not exists proveedor_producto_id text,
add column if not exists proveedor_url text,
add column if not exists amazon_asin text,
add column if not exists alibaba_product_id text,
add column if not exists cj_product_id text,
add column if not exists precio_proveedor numeric,
add column if not exists precio_cliente numeric,
add column if not exists comision_nexo numeric default 30,
add column if not exists agente_responsable text default 'agente1',
add column if not exists activo boolean default true;

alter table pedidos
add column if not exists proveedor text,
add column if not exists proveedor_producto_id text,
add column if not exists proveedor_url text,
add column if not exists amazon_asin text,
add column if not exists alibaba_product_id text,
add column if not exists cj_product_id text,
add column if not exists agente_responsable text default 'agente1',
add column if not exists estado_agente1 text default 'pendiente',
add column if not exists estado_compra_proveedor text default 'pendiente',
add column if not exists proveedor_order_id text,
add column if not exists tracking text,
add column if not exists comision_nexo numeric default 30,
add column if not exists precio_proveedor numeric,
add column if not exists precio_cliente numeric;

alter table compras_proveedor
add column if not exists proveedor text,
add column if not exists proveedor_producto_id text,
add column if not exists proveedor_url text,
add column if not exists agente_responsable text default 'agente1',
add column if not exists estado_compra text default 'pendiente',
add column if not exists proveedor_order_id text,
add column if not exists tracking text;

alter table pagos
add column if not exists proveedor text,
add column if not exists agente_responsable text default 'agente1',
add column if not exists metodo_pago_cliente text,
add column if not exists redireccion_externa boolean default false,
add column if not exists amazon_tag text default 'nexo20-8';

create table if not exists logs_agente1 (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid,
  proveedor text,
  accion text,
  detalle text,
  estado text default 'pendiente',
  creado_en timestamp with time zone default now()
);
