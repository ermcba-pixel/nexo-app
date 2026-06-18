-- ============================================================
-- nexo - Adaptación Supabase a SIAT Bolivia
-- Facturación Electrónica en Línea / Proceso Masivo
-- Este script NO borra tablas existentes.
-- Crea estructura fiscal oficial y enlaza nexo -> SIAT.
-- ============================================================

create extension if not exists pgcrypto;

-- =========================
-- 1) CONFIGURACIÓN SIAT
-- =========================
create table if not exists public.siat_configuracion (
  id uuid primary key default gen_random_uuid(),
  activo boolean not null default true,
  ambiente varchar(20) not null default 'PILOTO' check (ambiente in ('PILOTO','PRODUCCION')),
  modalidad_facturacion varchar(40) not null default 'ELECTRONICA_EN_LINEA',
  tipo_sistema varchar(20) not null default 'PROPIO',
  proceso_masivo boolean not null default true,
  registro_compras boolean not null default false,
  nombre_software varchar(100) not null default 'nexo',
  version_software varchar(30) not null default '1.0.1',
  nit_emisor varchar(20) not null default '774651015',
  razon_social_emisor varchar(200) not null default 'EDUARDO RODRIGUEZ MARTINEZ',
  nombre_comercial varchar(120) not null default 'nexo',
  sucursal int not null default 435,
  punto_venta int not null default 0,
  municipio varchar(80) not null default 'COCHABAMBA',
  direccion text,
  telefono varchar(50),
  cuis varchar(120),
  cuis_vigente_hasta timestamptz,
  cufd varchar(250),
  codigo_control_cufd varchar(250),
  cufd_vigente_desde timestamptz,
  cufd_vigente_hasta timestamptz,
  certificado_digital_activo boolean not null default false,
  token_delegado_activo boolean not null default false,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.siat_configuracion (
  direccion, telefono, observaciones
)
select
  'ZONA: QUERU QUERU, AVENIDA: AMÉRICA, NRO: 435, EDIFICIO: S/N PISO: 4 NRO LOCAL/OFICINA: Oficina No. 9',
  '-',
  'Configuración inicial para autorización SIAT. Completar CUIS, CUFD, certificado/firma digital y credenciales cuando Impuestos autorice el sistema.'
where not exists (select 1 from public.siat_configuracion);

-- =========================
-- 2) CATÁLOGOS SIAT
-- =========================
create table if not exists public.siat_catalogos (
  id uuid primary key default gen_random_uuid(),
  catalogo varchar(80) not null,
  codigo varchar(80) not null,
  descripcion text not null,
  estado varchar(20) not null default 'ACTIVO',
  raw jsonb,
  sincronizado_at timestamptz,
  created_at timestamptz not null default now(),
  unique (catalogo, codigo)
);

insert into public.siat_catalogos (catalogo, codigo, descripcion)
values
('modalidad_facturacion','1','Electrónica en Línea'),
('tipo_sistema','1','Propio'),
('tipo_documento_sector','1','Factura Compra-Venta'),
('tipo_emision','1','Online'),
('tipo_factura','1','Con Derecho a Crédito Fiscal'),
('unidad_medida','58','Unidad (Servicios)'),
('documento_identidad','1','CI - Cédula de Identidad'),
('documento_identidad','5','NIT'),
('documento_identidad','6','Pasaporte / extranjero'),
('forma_pago','1','Efectivo'),
('forma_pago','2','Tarjeta'),
('forma_pago','31','Transferencia bancaria'),
('forma_pago','42','PayPal / billetera digital')
on conflict (catalogo, codigo) do nothing;

-- =========================
-- 3) CLIENTE FISCAL
-- =========================
create table if not exists public.siat_clientes_fiscales (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  pais varchar(80) not null default 'Bolivia',
  es_bolivia boolean not null default true,
  tipo_documento varchar(20) not null default 'NIT',
  numero_documento varchar(40) not null,
  complemento varchar(10),
  razon_social text not null,
  email text,
  telefono text,
  direccion text,
  nit_facturacion varchar(40) generated always as (
    case when es_bolivia then numero_documento else '99001' end
  ) stored,
  validado_siat boolean not null default false,
  fecha_validacion timestamptz,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_siat_clientes_fiscales_cliente_id on public.siat_clientes_fiscales(cliente_id);
create index if not exists idx_siat_clientes_fiscales_doc on public.siat_clientes_fiscales(numero_documento);

-- =========================
-- 4) FACTURA FISCAL SIAT
-- =========================
create table if not exists public.siat_facturas (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid,
  pedido_id uuid,
  pago_id uuid,
  cliente_fiscal_id uuid references public.siat_clientes_fiscales(id),

  estado varchar(30) not null default 'BORRADOR' check (estado in (
    'BORRADOR','PENDIENTE_ENVIO','ENVIADA','VALIDADA','OBSERVADA','RECHAZADA','ANULADA','CONTINGENCIA'
  )),
  ambiente varchar(20) not null default 'PILOTO',
  modalidad_facturacion varchar(40) not null default 'ELECTRONICA_EN_LINEA',
  tipo_documento_sector varchar(50) not null default 'FACTURA_COMPRA_VENTA',
  tipo_emision varchar(30) not null default 'ONLINE',
  tipo_factura varchar(60) not null default 'CON_DERECHO_CREDITO_FISCAL',

  nit_emisor varchar(20) not null default '774651015',
  razon_social_emisor varchar(200) not null default 'EDUARDO RODRIGUEZ MARTINEZ',
  sucursal int not null default 435,
  punto_venta int not null default 0,
  municipio varchar(80) not null default 'COCHABAMBA',
  direccion_emisor text,

  numero_factura bigint,
  cuf text,
  cuis text,
  cufd text,
  codigo_control_cufd text,
  codigo_recepcion text,
  codigo_autorizacion text,

  fecha_emision timestamptz not null default now(),
  periodo varchar(7) not null default to_char(now(), 'YYYY-MM'),
  fecha_limite_emision date,

  nit_ci_cliente varchar(40) not null,
  razon_social_cliente text not null,
  codigo_cliente varchar(80),
  pais_cliente varchar(80),
  email_cliente text,

  moneda varchar(10) not null default 'BOB',
  tipo_cambio numeric(18,6) not null default 1,
  subtotal_bs numeric(18,2) not null default 0,
  descuento_bs numeric(18,2) not null default 0,
  total_bs numeric(18,2) not null default 0,
  monto_gift_card_bs numeric(18,2) not null default 0,
  monto_pagar_bs numeric(18,2) not null default 0,
  importe_base_credito_fiscal_bs numeric(18,2) not null default 0,

  forma_pago varchar(80),
  canal_pago varchar(80),
  transaccion_pago text,

  xml_firmado text,
  xml_hash text,
  pdf_url text,
  qr_data text,
  qr_url text,
  leyenda_sin text not null default 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY',
  leyenda_consumidor text not null default 'Ley N° 453: El proveedor debe brindar atención sin discriminación, con respeto, calidez y cordialidad a los usuarios y consumidores.',
  leyenda_representacion text not null default 'Este documento es la Representación Gráfica de un Documento Fiscal Digital emitido en una modalidad de facturación en línea',

  respuesta_siat jsonb,
  observaciones text,
  motivo_anulacion text,
  anulada_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_siat_facturas_pedido_id on public.siat_facturas(pedido_id);
create index if not exists idx_siat_facturas_pago_id on public.siat_facturas(pago_id);
create index if not exists idx_siat_facturas_estado on public.siat_facturas(estado);
create index if not exists idx_siat_facturas_periodo on public.siat_facturas(periodo);
create unique index if not exists uq_siat_facturas_numero on public.siat_facturas(numero_factura) where numero_factura is not null;

-- =========================
-- 5) ITEMS DE FACTURA
-- =========================
create table if not exists public.siat_factura_items (
  id uuid primary key default gen_random_uuid(),
  siat_factura_id uuid not null references public.siat_facturas(id) on delete cascade,
  producto_id uuid,
  codigo_producto_servicio varchar(80) not null default 'SICI-2',
  codigo_producto_sin varchar(80),
  cantidad numeric(18,2) not null default 1,
  unidad_medida_codigo varchar(30) not null default '58',
  unidad_medida_descripcion varchar(80) not null default 'Unidad (Servicios)',
  descripcion text not null,
  precio_unitario_bs numeric(18,2) not null default 0,
  descuento_bs numeric(18,2) not null default 0,
  subtotal_bs numeric(18,2) not null default 0,
  imei_serie text,
  created_at timestamptz not null default now()
);

create index if not exists idx_siat_factura_items_factura on public.siat_factura_items(siat_factura_id);

-- =========================
-- 6) LOTES MASIVOS
-- =========================
create table if not exists public.siat_facturacion_masiva_lotes (
  id uuid primary key default gen_random_uuid(),
  periodo varchar(7) not null,
  estado varchar(30) not null default 'PREPARADO' check (estado in ('PREPARADO','GENERANDO_XML','ENVIADO','VALIDADO','OBSERVADO','RECHAZADO','CERRADO')),
  cantidad_facturas int not null default 0,
  total_bs numeric(18,2) not null default 0,
  archivo_paquete_url text,
  hash_paquete text,
  codigo_recepcion text,
  respuesta_siat jsonb,
  generado_at timestamptz,
  enviado_at timestamptz,
  validado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.siat_facturacion_masiva_lote_items (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.siat_facturacion_masiva_lotes(id) on delete cascade,
  siat_factura_id uuid not null references public.siat_facturas(id),
  estado varchar(30) not null default 'INCLUIDA',
  respuesta_individual jsonb,
  created_at timestamptz not null default now(),
  unique(lote_id, siat_factura_id)
);

-- =========================
-- 7) EVENTOS SIGNIFICATIVOS / CONTINGENCIA
-- =========================
create table if not exists public.siat_eventos_significativos (
  id uuid primary key default gen_random_uuid(),
  codigo_evento varchar(30) not null,
  descripcion text not null,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz,
  cufd_evento text,
  codigo_recepcion_evento text,
  estado varchar(30) not null default 'ABIERTO' check (estado in ('ABIERTO','CERRADO','ENVIADO_SIAT','OBSERVADO')),
  respuesta_siat jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.siat_contingencias (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.siat_eventos_significativos(id),
  siat_factura_id uuid references public.siat_facturas(id),
  tipo varchar(40) not null default 'FUERA_DE_LINEA',
  estado varchar(30) not null default 'PENDIENTE_ENVIO',
  fecha_emision timestamptz not null default now(),
  fecha_envio timestamptz,
  plazo_limite_envio timestamptz,
  respuesta_siat jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- 8) REGISTRO VENTAS IVA Y CIERRES
-- =========================
create table if not exists public.siat_registro_ventas_iva (
  id uuid primary key default gen_random_uuid(),
  periodo varchar(7) not null,
  siat_factura_id uuid references public.siat_facturas(id),
  fecha_factura date not null,
  numero_factura bigint,
  cuf text,
  nit_ci_cliente varchar(40),
  razon_social_cliente text,
  total_venta_bs numeric(18,2) not null default 0,
  importe_no_sujeto_credito_fiscal_bs numeric(18,2) not null default 0,
  subtotal_bs numeric(18,2) not null default 0,
  descuentos_bs numeric(18,2) not null default 0,
  importe_base_credito_fiscal_bs numeric(18,2) not null default 0,
  debito_fiscal_bs numeric(18,2) generated always as (round(importe_base_credito_fiscal_bs * 0.13, 2)) stored,
  estado varchar(30) not null default 'VALIDA',
  created_at timestamptz not null default now()
);

create index if not exists idx_siat_registro_ventas_periodo on public.siat_registro_ventas_iva(periodo);

create table if not exists public.siat_cierres_fiscales (
  id uuid primary key default gen_random_uuid(),
  periodo varchar(7) not null unique,
  estado varchar(30) not null default 'ABIERTO' check (estado in ('ABIERTO','REVISADO','CERRADO','DECLARADO')),
  total_facturas int not null default 0,
  total_ventas_bs numeric(18,2) not null default 0,
  total_base_credito_fiscal_bs numeric(18,2) not null default 0,
  total_debito_fiscal_bs numeric(18,2) not null default 0,
  observaciones text,
  cerrado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 9) AUDITORÍA FISCAL INALTERABLE
-- =========================
create table if not exists public.siat_auditoria_fiscal (
  id uuid primary key default gen_random_uuid(),
  tabla varchar(100) not null,
  registro_id uuid,
  accion varchar(40) not null,
  antes jsonb,
  despues jsonb,
  usuario text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- =========================
-- 10) SECUENCIA FISCAL Y FUNCIONES
-- =========================
create sequence if not exists public.siat_numero_factura_seq start 1 increment 1;

create or replace function public.siat_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.siat_asignar_numero_factura()
returns trigger language plpgsql as $$
begin
  if new.numero_factura is null then
    new.numero_factura := nextval('public.siat_numero_factura_seq');
  end if;
  if new.monto_pagar_bs = 0 then
    new.monto_pagar_bs := greatest(new.total_bs - new.monto_gift_card_bs, 0);
  end if;
  if new.importe_base_credito_fiscal_bs = 0 then
    new.importe_base_credito_fiscal_bs := new.monto_pagar_bs;
  end if;
  if new.codigo_cliente is null then
    new.codigo_cliente := new.nit_ci_cliente;
  end if;
  return new;
end $$;

create or replace function public.siat_recalcular_totales_factura(p_factura uuid)
returns void language plpgsql as $$
declare
  v_subtotal numeric(18,2);
  v_descuento numeric(18,2);
  v_total numeric(18,2);
begin
  select
    coalesce(sum(subtotal_bs),0),
    coalesce(sum(descuento_bs),0)
  into v_subtotal, v_descuento
  from public.siat_factura_items
  where siat_factura_id = p_factura;

  v_total := greatest(v_subtotal - v_descuento, 0);

  update public.siat_facturas
  set subtotal_bs = v_subtotal,
      descuento_bs = v_descuento,
      total_bs = v_total,
      monto_pagar_bs = v_total,
      importe_base_credito_fiscal_bs = v_total,
      updated_at = now()
  where id = p_factura;
end $$;

create or replace function public.siat_item_recalcular_subtotal()
returns trigger language plpgsql as $$
begin
  new.subtotal_bs := round((coalesce(new.cantidad,0) * coalesce(new.precio_unitario_bs,0)) - coalesce(new.descuento_bs,0), 2);
  return new;
end $$;

create or replace function public.siat_item_after_change()
returns trigger language plpgsql as $$
begin
  perform public.siat_recalcular_totales_factura(coalesce(new.siat_factura_id, old.siat_factura_id));
  return coalesce(new, old);
end $$;

create or replace function public.siat_insert_registro_ventas()
returns trigger language plpgsql as $$
begin
  if new.estado in ('VALIDADA','ENVIADA') then
    insert into public.siat_registro_ventas_iva (
      periodo, siat_factura_id, fecha_factura, numero_factura, cuf,
      nit_ci_cliente, razon_social_cliente, total_venta_bs, subtotal_bs,
      descuentos_bs, importe_base_credito_fiscal_bs, estado
    ) values (
      new.periodo, new.id, new.fecha_emision::date, new.numero_factura, new.cuf,
      new.nit_ci_cliente, new.razon_social_cliente, new.total_bs, new.subtotal_bs,
      new.descuento_bs, new.importe_base_credito_fiscal_bs, new.estado
    )
    on conflict do nothing;
  end if;
  return new;
end $$;

-- Triggers seguros: borrar si ya existen y recrear

drop trigger if exists trg_siat_config_updated on public.siat_configuracion;
create trigger trg_siat_config_updated before update on public.siat_configuracion
for each row execute function public.siat_set_updated_at();

drop trigger if exists trg_siat_facturas_updated on public.siat_facturas;
create trigger trg_siat_facturas_updated before update on public.siat_facturas
for each row execute function public.siat_set_updated_at();

drop trigger if exists trg_siat_facturas_numero on public.siat_facturas;
create trigger trg_siat_facturas_numero before insert on public.siat_facturas
for each row execute function public.siat_asignar_numero_factura();

drop trigger if exists trg_siat_item_subtotal on public.siat_factura_items;
create trigger trg_siat_item_subtotal before insert or update on public.siat_factura_items
for each row execute function public.siat_item_recalcular_subtotal();

drop trigger if exists trg_siat_item_after_insert on public.siat_factura_items;
create trigger trg_siat_item_after_insert after insert or update or delete on public.siat_factura_items
for each row execute function public.siat_item_after_change();

drop trigger if exists trg_siat_registro_ventas on public.siat_facturas;
create trigger trg_siat_registro_ventas after insert or update of estado on public.siat_facturas
for each row execute function public.siat_insert_registro_ventas();

-- =========================
-- 11) VISTAS DE CONTROL SIAT
-- =========================
create or replace view public.v_siat_facturas_control as
select
  f.id,
  f.periodo,
  f.fecha_emision,
  f.numero_factura,
  f.estado,
  f.nit_ci_cliente,
  f.razon_social_cliente,
  f.total_bs,
  f.importe_base_credito_fiscal_bs,
  round(f.importe_base_credito_fiscal_bs * 0.13, 2) as debito_fiscal_estimado_bs,
  f.cuf,
  f.codigo_recepcion,
  f.pedido_id,
  f.pago_id,
  f.created_at
from public.siat_facturas f;

create or replace view public.v_siat_cierre_periodo as
select
  periodo,
  count(*) filter (where estado <> 'ANULADA') as total_facturas_validas,
  count(*) filter (where estado = 'ANULADA') as total_facturas_anuladas,
  coalesce(sum(total_bs) filter (where estado <> 'ANULADA'),0) as total_ventas_bs,
  coalesce(sum(importe_base_credito_fiscal_bs) filter (where estado <> 'ANULADA'),0) as total_base_credito_fiscal_bs,
  round(coalesce(sum(importe_base_credito_fiscal_bs) filter (where estado <> 'ANULADA'),0) * 0.13, 2) as debito_fiscal_bs
from public.siat_facturas
group by periodo;

-- =========================
-- 12) SEGURIDAD RLS
-- =========================
alter table public.siat_configuracion enable row level security;
alter table public.siat_catalogos enable row level security;
alter table public.siat_clientes_fiscales enable row level security;
alter table public.siat_facturas enable row level security;
alter table public.siat_factura_items enable row level security;
alter table public.siat_facturacion_masiva_lotes enable row level security;
alter table public.siat_facturacion_masiva_lote_items enable row level security;
alter table public.siat_eventos_significativos enable row level security;
alter table public.siat_contingencias enable row level security;
alter table public.siat_registro_ventas_iva enable row level security;
alter table public.siat_cierres_fiscales enable row level security;
alter table public.siat_auditoria_fiscal enable row level security;

-- Nota: por seguridad no se crean policies públicas.
-- El backend debe operar con SERVICE_ROLE. Luego se agregan policies para admin autenticado.

-- =========================
-- 13) TABLAS EXISTENTES: ENLACES SEGUROS
-- =========================
-- Se agregan columnas fiscales a tablas nexo existentes SOLO si existen.
do $$
begin
  if to_regclass('public.pedidos') is not null then
    alter table public.pedidos add column if not exists siat_factura_id uuid;
    alter table public.pedidos add column if not exists siat_estado varchar(30) default 'PENDIENTE';
    alter table public.pedidos add column if not exists siat_observacion text;
  end if;

  if to_regclass('public.pagos') is not null then
    alter table public.pagos add column if not exists siat_factura_id uuid;
    alter table public.pagos add column if not exists requiere_factura_siat boolean default true;
    alter table public.pagos add column if not exists siat_estado varchar(30) default 'PENDIENTE';
  end if;

  if to_regclass('public.facturas') is not null then
    alter table public.facturas add column if not exists siat_factura_id uuid;
    alter table public.facturas add column if not exists cuf text;
    alter table public.facturas add column if not exists cufd text;
    alter table public.facturas add column if not exists xml_firmado text;
    alter table public.facturas add column if not exists qr_data text;
    alter table public.facturas add column if not exists estado_siat varchar(30) default 'PENDIENTE';
  end if;
end $$;

-- =========================
-- FIN SCRIPT
-- =========================
