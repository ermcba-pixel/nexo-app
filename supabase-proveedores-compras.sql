-- nexo - ampliación proveedores / compras proveedor / productos proveedor
-- Ejecutar en Supabase SQL Editor si necesitas recrear o verificar estas tablas.

CREATE TABLE IF NOT EXISTS proveedores (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50),
    marketplace BOOLEAN DEFAULT TRUE,
    api_disponible BOOLEAN DEFAULT FALSE,
    api_url TEXT,
    api_key TEXT,
    api_secret TEXT,
    sitio_web TEXT,
    pais VARCHAR(100),
    moneda VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

INSERT INTO proveedores
(nombre,codigo,tipo,marketplace,api_disponible,sitio_web,pais,moneda)
VALUES
('Amazon','amazon','marketplace',TRUE,TRUE,'https://amazon.com','USA','USD'),
('CJ Dropshipping','cj','dropshipping',TRUE,TRUE,'https://cjdropshipping.com','China','USD'),
('Alibaba','alibaba','marketplace',TRUE,FALSE,'https://alibaba.com','China','USD'),
('AliExpress','aliexpress','marketplace',TRUE,FALSE,'https://aliexpress.com','China','USD'),
('Temu','temu','marketplace',TRUE,FALSE,'https://temu.com','China','USD'),
('eBay','ebay','marketplace',TRUE,FALSE,'https://ebay.com','USA','USD'),
('Walmart','walmart','marketplace',TRUE,FALSE,'https://walmart.com','USA','USD'),
('Etsy','etsy','marketplace',TRUE,FALSE,'https://etsy.com','USA','USD'),
('Shopify','shopify','marketplace',TRUE,FALSE,'https://shopify.com','Canada','USD'),
('Mercado Libre','mercadolibre','marketplace',TRUE,FALSE,'https://mercadolibre.com','Latam','USD'),
('Lazada','lazada','marketplace',TRUE,FALSE,'https://lazada.com','Singapur','USD')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS compras_proveedor (
    id BIGSERIAL PRIMARY KEY,
    pedido_id UUID,
    proveedor_id BIGINT,
    marketplace VARCHAR(100),
    proveedor_nombre VARCHAR(255),
    producto_nombre TEXT,
    sku_proveedor VARCHAR(255),
    url_producto TEXT,
    cantidad INTEGER DEFAULT 1,
    precio_unitario NUMERIC(12,2),
    costo_producto NUMERIC(12,2),
    costo_envio NUMERIC(12,2),
    costo_total NUMERIC(12,2),
    moneda VARCHAR(20) DEFAULT 'USD',
    metodo_pago VARCHAR(50),
    cuenta_pago VARCHAR(255),
    referencia_pago TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    tracking_proveedor TEXT,
    tracking_final TEXT,
    observaciones TEXT,
    fecha_compra TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedor_productos (
    id BIGSERIAL PRIMARY KEY,
    proveedor_id BIGINT,
    marketplace VARCHAR(100),
    sku_original VARCHAR(255),
    asin VARCHAR(255),
    nombre_original TEXT,
    descripcion_original TEXT,
    categoria TEXT,
    subcategoria TEXT,
    marca TEXT,
    precio_original NUMERIC(12,2),
    moneda VARCHAR(20),
    stock INTEGER,
    imagen_principal TEXT,
    imagenes JSONB,
    url_original TEXT,
    peso NUMERIC(12,2),
    dimensiones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_codigo ON proveedores(codigo);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor_pedido ON compras_proveedor(pedido_id);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor_proveedor ON compras_proveedor(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor_estado ON compras_proveedor(estado);
CREATE INDEX IF NOT EXISTS idx_proveedor_productos_sku ON proveedor_productos(sku_original);
CREATE INDEX IF NOT EXISTS idx_proveedor_productos_asin ON proveedor_productos(asin);
CREATE INDEX IF NOT EXISTS idx_proveedor_productos_proveedor ON proveedor_productos(proveedor_id);
