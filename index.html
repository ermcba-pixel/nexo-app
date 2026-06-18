-- ============================================================
-- nexo - SUPABASE: MÓDULO DE FACTURACIÓN MASIVA BOLIVIA / SIAT
-- Versión: 1.0.1
-- Ejecutar en Supabase SQL Editor.
-- Objetivo: preparar la base de datos para autorización SIAT,
-- emisión masiva, control tributario, auditoría, XML, QR, CUIS,
-- CUFD, CUF, contingencias y trazabilidad.
-- ============================================================

create extension if not exists pgcrypto;

-- =========================
-- 1) FUNCIONES BASE
-- =========================

create or replace function public.nexo_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.nexo_factura_nit_ci_por_pais(p_pais text, p_nit_ci text)
returns text
language plpgsql
as $$
begin
  -- Regla operativa nexo:
  -- Cliente fuera de Bolivia => NIT/CI 99001.
  -- Cliente Bolivia => NIT/CI real del cliente.
  if lower(coalesce(p_pais,'')) not in ('bolivia','bo','bol','estado plurinacional de bolivia') then
    return '99001';
  end if;

  if nullif(trim(coalesce(p_nit_ci,'')), '') is null then
    raise exception 'Cliente Bolivia requiere NIT/CI real para facturación';
  end if;

  return trim(p_nit_ci);
end;
$$;

create or replace function public.nexo_periodo_yyyymm(p_fecha timestamptz)
returns text
language sql
immutable
as $$
  select to_char(p_fecha at time zone 'America/La_Paz','YYYY-MM');
$$;

-- =========================
-- 2) TABLAS EXISTENTES: CAMPOS MÍNIMOS PARA ENLACE
-- =========================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  apellido text,
  email text,
  telefono text,
  pais text,
  region text,
  ciudad text,
  direccion text,
  codigo_postal text,
  documento text,
  nit_ci text,
  razon_social text,
  tipo_documento text,
  fecha_registro timestamptz default now(),
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clientes add column if not exists nit_ci text;
alter table public.clientes add column if not exists razon_social text;
alter table public.clientes add column if not exists tipo_documento text;
alter table public.clientes add column if not exists updated_at timestamptz default now();

create index if not exists idx_clientes_email on public.clientes(email);
create index if not exists idx_clientes_nit_ci on public.clientes(nit_ci);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  estado text default 'pendiente',
  estado_pago text default 'pendiente',
  total numeric(14,2) default 0,
  moneda text default 'USD',
  proveedor text,
  items jsonb default '[]'::jsonb,
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pedidos add column if not exists factura_id uuid;
alter table public.pedidos add column if not exists requiere_factura boolean default true;
alter table public.pedidos add column if not exists pais_facturacion text;
alter table public.pedidos add column if not exists nit_ci_facturacion text;
alter table public.pedidos add column if not exists razon_social_facturacion text;
alter table public.pedidos add column if not exists total_bs numeric(14,2);
alter table public.pedidos add column if not exists tipo_cambio numeric(12,6);
alter table public.pedidos add column if not exists updated_at timestamptz default now();

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid,
  cliente_id uuid,
  metodo text,
  estado text default 'pendiente',
  monto numeric(14,2) default 0,
  moneda text default 'USD',
  referencia text,
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pagos add column if not exists factura_id uuid;
alter table public.pagos add column if not exists monto_bs numeric(14,2);
alter table public.pagos add column if not exists tipo_cambio numeric(12,6);
alter table public.pagos add column if not exists conciliado boolean default false;
alter table public.pagos add column if not exists fecha_conciliacion timestamptz;
alter table public.pagos add column if not exists updated_at timestamptz default now();

-- =========================
-- 3) CONFIGURACIÓN SIAT / CONTRIBUYENTE
-- =========================

create table if not exists public.siat_configuracion (
  id uuid primary key default gen_random_uuid(),
  activo boolean default true,
  ambiente text not null default 'pruebas' check (ambiente in ('pruebas','produccion')),
  modalidad text not null default 'ELECTRONICA_EN_LINEA',
  tipo_sistema text not null default 'PROPIO',
  proceso_masivo boolean default true,
  registro_compras boolean default false,
  nombre_software text not null default 'nexo',
  version_software text not null default '1.0.1',
  nit_emisor text not null default '774651015',
  razon_social_emisor text not null default 'EDUARDO RODRIGUEZ MARTINEZ',
  nombre_comercial text default 'nexo',
  sucursal_nro integer default 435,
  punto_venta_nro integer default 0,
  domicilio text default 'ZONA: QUERU QUERU, AVENIDA: AMÉRICA, NRO: 435, EDIFICIO: S/N PISO: 4 NRO LOCAL/OFICINA: Oficina No. 9',
  municipio text default 'COCHABAMBA',
  telefono text,
  actividad_economica text,
  codigo_actividad_sin text,
  codigo_producto_sin text,
  unidad_medida_sin text default 'Unidad (Servicios)',
  sector_documento text default 'FACTURA COMPRA-VENTA',
  tipo_factura_documento text default 'FACTURA',
  tipo_emision text default 'ONLINE',
  tipo_documento_sector text,
  leyenda_sin text default 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY',
  leyenda_consumidor text default 'Ley N° 453: El proveedor debe brindar atención sin discriminación, con respeto, calidez y cordialidad a los usuarios y consumidores.',
  leyenda_representacion_grafica text default 'Este documento es la Representación Gráfica de un Documento Fiscal Digital emitido en una modalidad de facturación en línea',
  certificado_digital_estado text default 'pendiente',
  certificado_digital_vencimiento timestamptz,
  token_delegado_estado text default 'pendiente',
  autorizado_siat boolean default false,
  fecha_autorizacion_siat timestamptz,
  observaciones text,
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_siat_configuracion_updated_at
before update on public.siat_configuracion
for each row execute function public.nexo_touch_updated_at();

insert into public.siat_configuracion (
  ambiente, modalidad, tipo_sistema, proceso_masivo, registro_compras,
  nombre_software, version_software, nit_emisor, razon_social_emisor, nombre_comercial
)
select 'pruebas','ELECTRONICA_EN_LINEA','PROPIO',true,false,'nexo','1.0.1','774651015','EDUARDO RODRIGUEZ MARTINEZ','nexo'
where not exists (select 1 from public.siat_configuracion);

-- =========================
-- 4) CÓDIGOS SIAT: CUIS / CUFD / CUF
-- =========================

create table if not exists public.siat_cuis (
  id uuid primary key default gen_random_uuid(),
  configuracion_id uuid references public.siat_configuracion(id) on delete cascade,
  cuis text not null,
  codigo_sucursal integer default 0,
  codigo_punto_venta integer default 0,
  fecha_inicio timestamptz default now(),
  fecha_vencimiento timestamptz,
  vigente boolean default true,
  respuesta_siat jsonb default '{}'::jsonb,
  creado_en timestamptz default now()
);

create index if not exists idx_siat_cuis_vigente on public.siat_cuis(vigente, fecha_vencimiento);

create table if not exists public.siat_cufd (
  id uuid primary key default gen_random_uuid(),
  cuis_id uuid references public.siat_cuis(id) on delete set null,
  cufd text not null,
  codigo_control text,
  direccion text,
  codigo_sucursal integer default 0,
  codigo_punto_venta integer default 0,
  fecha_inicio timestamptz default now(),
  fecha_vencimiento timestamptz,
  vigente boolean default true,
  respuesta_siat jsonb default '{}'::jsonb,
  creado_en timestamptz default now()
);

create index if not exists idx_siat_cufd_vigente on public.siat_cufd(vigente, fecha_vencimiento);

-- =========================
-- 5) CATÁLOGOS SIAT SINCRONIZADOS
-- =========================

create table if not exists public.siat_catalogos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  codigo text not null,
  descripcion text not null,
  estado text default 'activo',
  raw jsonb default '{}'::jsonb,
  sincronizado_en timestamptz default now(),
  unique(tipo, codigo)
);

create index if not exists idx_siat_catalogos_tipo on public.siat_catalogos(tipo);

-- =========================
-- 6) FACTURAS: CABECERA / DETALLE / XML / PDF
-- =========================

create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid,
  pago_id uuid,
  cliente_id uuid,
  configuracion_id uuid references public.siat_configuracion(id),
  numero_factura bigint,
  cuf text,
  cufd text,
  cuis text,
  codigo_autorizacion text,
  estado text not null default 'borrador'
    check (estado in ('borrador','pendiente_envio','emitida','validada','rechazada','anulada','contingencia','observada')),
  modalidad text default 'ELECTRONICA_EN_LINEA',
  proceso_masivo boolean default true,
  nit_emisor text default '774651015',
  razon_social_emisor text default 'EDUARDO RODRIGUEZ MARTINEZ',
  nombre_comercial text default 'nexo',
  sucursal_nro integer default 435,
  punto_venta_nro integer default 0,
  municipio text default 'COCHABAMBA',
  direccion_emisor text,
  fecha_emision timestamptz default now(),
  periodo text generated always as (to_char(fecha_emision at time zone 'America/La_Paz','YYYY-MM')) stored,
  nit_ci_cliente text not null,
  razon_social_cliente text not null,
  codigo_cliente text,
  pais_cliente text,
  email_cliente text,
  tipo_documento_cliente text,
  moneda text default 'BOB',
  tipo_cambio numeric(12,6) default 1,
  subtotal numeric(14,2) not null default 0,
  descuento numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  monto_gift_card numeric(14,2) not null default 0,
  monto_a_pagar numeric(14,2) not null default 0,
  importe_base_credito_fiscal numeric(14,2) not null default 0,
  total_literal text,
  codigo_qr text,
  qr_url text,
  xml_path text,
  pdf_path text,
  xml_hash text,
  firma_hash text,
  respuesta_siat jsonb default '{}'::jsonb,
  errores jsonb default '[]'::jsonb,
  motivo_anulacion text,
  anulada_en timestamptz,
  enviada_email_en timestamptz,
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.facturas add column if not exists proceso_masivo boolean default true;
alter table public.facturas add column if not exists periodo text generated always as (to_char(fecha_emision at time zone 'America/La_Paz','YYYY-MM')) stored;

create unique index if not exists ux_facturas_cuf on public.facturas(cuf) where cuf is not null;
create index if not exists idx_facturas_estado_periodo on public.facturas(estado, periodo);
create index if not exists idx_facturas_cliente on public.facturas(cliente_id);
create index if not exists idx_facturas_pedido on public.facturas(pedido_id);

create trigger trg_facturas_updated_at
before update on public.facturas
for each row execute function public.nexo_touch_updated_at();

create table if not exists public.factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  codigo_producto_servicio text,
  codigo_producto_sin text,
  cantidad numeric(14,2) not null default 1,
  unidad_medida text default 'Unidad (Servicios)',
  codigo_unidad_medida_sin text,
  descripcion text not null,
  precio_unitario numeric(14,2) not null default 0,
  descuento numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  numero_serie text,
  imei text,
  raw jsonb default '{}'::jsonb,
  creado_en timestamptz default now()
);

create index if not exists idx_factura_items_factura on public.factura_items(factura_id);

-- =========================
-- 7) LOTES DE EMISIÓN MASIVA
-- =========================

create table if not exists public.facturacion_masiva_lotes (
  id uuid primary key default gen_random_uuid(),
  periodo text not null,
  estado text default 'preparado'
    check (estado in ('preparado','procesando','enviado','validado','parcial','rechazado','cerrado')),
  total_facturas integer default 0,
  total_monto numeric(14,2) default 0,
  archivo_paquete_path text,
  hash_paquete text,
  respuesta_siat jsonb default '{}'::jsonb,
  errores jsonb default '[]'::jsonb,
  creado_por text,
  creado_en timestamptz default now(),
  enviado_en timestamptz,
  validado_en timestamptz,
  updated_at timestamptz default now()
);

create trigger trg_facturacion_masiva_lotes_updated_at
before update on public.facturacion_masiva_lotes
for each row execute function public.nexo_touch_updated_at();

create table if not exists public.facturacion_masiva_lote_items (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid references public.facturacion_masiva_lotes(id) on delete cascade,
  factura_id uuid references public.facturas(id) on delete cascade,
  estado text default 'incluida',
  respuesta_siat jsonb default '{}'::jsonb,
  creado_en timestamptz default now(),
  unique(lote_id, factura_id)
);

-- =========================
-- 8) EVENTOS SIGNIFICATIVOS / CONTINGENCIAS
-- =========================

create table if not exists public.siat_eventos_significativos (
  id uuid primary key default gen_random_uuid(),
  codigo_evento text not null,
  descripcion text not null,
  fecha_inicio timestamptz not null default now(),
  fecha_fin timestamptz,
  estado text default 'abierto' check (estado in ('abierto','cerrado','enviado','validado','rechazado')),
  cufd_evento text,
  cafc text,
  respuesta_siat jsonb default '{}'::jsonb,
  observaciones text,
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_siat_eventos_updated_at
before update on public.siat_eventos_significativos
for each row execute function public.nexo_touch_updated_at();

-- =========================
-- 9) REGISTRO DE VENTAS / CONTROL TRIBUTARIO
-- =========================

create table if not exists public.registro_ventas_iva (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid references public.facturas(id) on delete set null,
  periodo text not null,
  fecha_factura date not null,
  numero_factura bigint,
  cuf text,
  nit_ci_cliente text,
  razon_social_cliente text,
  importe_total numeric(14,2) default 0,
  importe_ice numeric(14,2) default 0,
  importe_iehd numeric(14,2) default 0,
  importe_ipj numeric(14,2) default 0,
  tasas numeric(14,2) default 0,
  importe_no_sujeto_cf numeric(14,2) default 0,
  descuentos numeric(14,2) default 0,
  importe_base_cf numeric(14,2) default 0,
  debito_fiscal numeric(14,2) generated always as (round((coalesce(importe_base_cf,0) * 0.13)::numeric, 2)) stored,
  estado text default 'registrado',
  consolidado boolean default false,
  consolidado_en timestamptz,
  raw jsonb default '{}'::jsonb,
  creado_en timestamptz default now()
);

create index if not exists idx_registro_ventas_periodo on public.registro_ventas_iva(periodo);
create unique index if not exists ux_registro_ventas_factura on public.registro_ventas_iva(factura_id) where factura_id is not null;

create table if not exists public.cierres_fiscales (
  id uuid primary key default gen_random_uuid(),
  periodo text not null unique,
  ventas_total numeric(14,2) default 0,
  ventas_base_cf numeric(14,2) default 0,
  debito_fiscal numeric(14,2) default 0,
  facturas_emitidas integer default 0,
  facturas_anuladas integer default 0,
  estado text default 'abierto' check (estado in ('abierto','revisado','consolidado','declarado','bloqueado')),
  revisado_por text,
  revisado_en timestamptz,
  notas text,
  creado_en timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_cierres_fiscales_updated_at
before update on public.cierres_fiscales
for each row execute function public.nexo_touch_updated_at();

-- =========================
-- 10) AUDITORÍA INALTERABLE
-- =========================

create table if not exists public.auditoria_fiscal (
  id uuid primary key default gen_random_uuid(),
  entidad text not null,
  entidad_id uuid,
  accion text not null,
  antes jsonb,
  despues jsonb,
  usuario text,
  ip text,
  user_agent text,
  hash_evento text,
  creado_en timestamptz default now()
);

create index if not exists idx_auditoria_fiscal_entidad on public.auditoria_fiscal(entidad, entidad_id);
create index if not exists idx_auditoria_fiscal_fecha on public.auditoria_fiscal(creado_en);

create or replace function public.nexo_auditar_factura()
returns trigger
language plpgsql
as $$
begin
  insert into public.auditoria_fiscal(entidad, entidad_id, accion, antes, despues, hash_evento)
  values(
    'facturas',
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    encode(digest(coalesce(to_jsonb(new)::text, '') || coalesce(to_jsonb(old)::text, '') || now()::text, 'sha256'),'hex')
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_auditar_factura on public.facturas;
create trigger trg_auditar_factura
after insert or update or delete on public.facturas
for each row execute function public.nexo_auditar_factura();

-- =========================
-- 11) VISTAS ADMINISTRATIVAS
-- =========================

create or replace view public.vw_facturacion_pendiente as
select
  p.id as pedido_id,
  p.cliente_id,
  c.email,
  c.pais,
  coalesce(p.razon_social_facturacion, c.razon_social, trim(coalesce(c.nombre,'') || ' ' || coalesce(c.apellido,''))) as razon_social_facturacion,
  public.nexo_factura_nit_ci_por_pais(coalesce(p.pais_facturacion,c.pais), coalesce(p.nit_ci_facturacion,c.nit_ci,c.documento)) as nit_ci_facturacion,
  coalesce(p.total_bs, p.total) as total_bs,
  p.estado,
  p.estado_pago,
  p.creado_en
from public.pedidos p
left join public.clientes c on c.id = p.cliente_id
where coalesce(p.requiere_factura,true) = true
  and p.factura_id is null
  and lower(coalesce(p.estado_pago,'')) in ('pagado','capturado','completed','aprobado');

create or replace view public.vw_resumen_fiscal_periodo as
select
  periodo,
  count(*) filter (where estado in ('emitida','validada')) as facturas_validas,
  count(*) filter (where estado = 'anulada') as facturas_anuladas,
  sum(total) filter (where estado in ('emitida','validada')) as total_facturado,
  sum(importe_base_credito_fiscal) filter (where estado in ('emitida','validada')) as base_credito_fiscal,
  round((sum(importe_base_credito_fiscal) filter (where estado in ('emitida','validada')) * 0.13)::numeric,2) as debito_fiscal_estimado
from public.facturas
group by periodo;

-- =========================
-- 12) RLS: bloquear escritura pública directa
-- =========================

alter table public.siat_configuracion enable row level security;
alter table public.siat_cuis enable row level security;
alter table public.siat_cufd enable row level security;
alter table public.siat_catalogos enable row level security;
alter table public.facturas enable row level security;
alter table public.factura_items enable row level security;
alter table public.facturacion_masiva_lotes enable row level security;
alter table public.facturacion_masiva_lote_items enable row level security;
alter table public.siat_eventos_significativos enable row level security;
alter table public.registro_ventas_iva enable row level security;
alter table public.cierres_fiscales enable row level security;
alter table public.auditoria_fiscal enable row level security;

-- Lectura pública deshabilitada por defecto. El backend con SERVICE_ROLE puede operar.
-- Cuando creemos usuarios administrativos con auth.uid(), añadiremos políticas específicas.
-- ============================================================
-- FIN SCRIPT SUPABASE SIAT
-- ============================================================
