-- =============================================================================
-- 04_extension_vento_rbac.sql
-- Extensión NO DESTRUCTIVA sobre el esquema de Base de Datos Avanzadas (BD2)
-- Conecta el modelo relacional de 49 tablas, 23 triggers y 10 vistas con los
-- 4 perfiles RBAC, moderación previa estricta y operaciones Web de Vento.Api.
-- =============================================================================
-- Seguro de ejecutar sobre una base BD2 vacía o ya poblada con insertsll.txt.
-- =============================================================================

-- 1. Extensión RBAC de 4 Perfiles y Moderación de Cuentas sobre tabla `usuario` (BD2)
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS rol VARCHAR(30) DEFAULT 'Comprador',
    ADD COLUMN IF NOT EXISTS rol_solicitado VARCHAR(30),
    ADD COLUMN IF NOT EXISTS estado_cuenta VARCHAR(20) DEFAULT 'Activo',
    ADD COLUMN IF NOT EXISTS estado_aprobacion VARCHAR(20) DEFAULT 'NoAplica',
    ADD COLUMN IF NOT EXISTS motivo_rechazo_cuenta TEXT,
    ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS nombre_tienda VARCHAR(120),
    ADD COLUMN IF NOT EXISTS biografia_tienda TEXT,
    ADD COLUMN IF NOT EXISTS ciudad_base VARCHAR(100),
    ADD COLUMN IF NOT EXISTS especialidad VARCHAR(120),
    ADD COLUMN IF NOT EXISTS experiencia_anios INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS descuento_proxima NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS descuento_desde DATE;

-- Sincronización automática para registros previos de insertsll.txt (BD2)
UPDATE usuario
SET rol = CASE
        WHEN COALESCE(tipo_emprendedor, FALSE) = TRUE THEN 'VendedorProducto'
        ELSE 'Comprador'
    END,
    estado_aprobacion = CASE
        WHEN COALESCE(tipo_emprendedor, FALSE) = TRUE THEN 'Aprobado'
        ELSE 'NoAplica'
    END,
    estado_cuenta = COALESCE(estado_cuenta, 'Activo')
WHERE rol IS NULL OR (rol = 'Comprador' AND COALESCE(tipo_emprendedor, FALSE) = TRUE);

-- 2. Extensión de Libreta de Direcciones sobre tabla `direccion` (BD2)
ALTER TABLE direccion
    ADD COLUMN IF NOT EXISTS alias VARCHAR(60) DEFAULT 'Principal',
    ADD COLUMN IF NOT EXISTS complemento VARCHAR(120),
    ADD COLUMN IF NOT EXISTS region_codigo VARCHAR(10),
    ADD COLUMN IF NOT EXISTS comuna_nombre VARCHAR(80),
    ADD COLUMN IF NOT EXISTS es_predeterminada BOOLEAN DEFAULT FALSE;

-- 3. Extensión de Catálogo y Moderación Estricta sobre `producto` y `servicio` (BD2)
ALTER TABLE producto
    ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS ultima_actividad DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS owner_run VARCHAR(12) REFERENCES usuario(run) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS estado_moderacion VARCHAR(20) DEFAULT 'Aprobado',
    ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
    ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS categoria_nombre VARCHAR(60),
    ADD COLUMN IF NOT EXISTS genero VARCHAR(30) DEFAULT 'Unisex',
    ADD COLUMN IF NOT EXISTS precio_actual NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS precio_original NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS descuento_porcentaje INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS oferta_activa BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS stock_actual INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS imagen_principal TEXT,
    ADD COLUMN IF NOT EXISTS descripcion TEXT;

ALTER TABLE servicio
    ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS ultima_actividad DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS owner_run VARCHAR(12) REFERENCES usuario(run) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS estado_moderacion VARCHAR(20) DEFAULT 'Aprobado',
    ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
    ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS marca VARCHAR(80),
    ADD COLUMN IF NOT EXISTS categoria_nombre VARCHAR(60),
    ADD COLUMN IF NOT EXISTS modalidad VARCHAR(40) DEFAULT 'Presencial',
    ADD COLUMN IF NOT EXISTS cobertura VARCHAR(120),
    ADD COLUMN IF NOT EXISTS garantia VARCHAR(120),
    ADD COLUMN IF NOT EXISTS tiempo_estimado VARCHAR(60),
    ADD COLUMN IF NOT EXISTS permite_cotizacion BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS precio_actual NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS precio_original NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS descuento_porcentaje INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS oferta_activa BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS imagen_principal TEXT,
    ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Vincular owner_run y precio_actual/stock_actual para productos existentes de insertsll.txt
UPDATE producto p
SET owner_run = v.id_usuario,
    precio_actual = CASE WHEN p.precio_actual IS NULL OR p.precio_actual = 0 THEN v.precio::NUMERIC ELSE p.precio_actual END
FROM vende v
WHERE v.id_producto = p.sku AND p.owner_run IS NULL;

UPDATE producto p
SET stock_actual = s.cantidad
FROM contiene c
JOIN caracteristicas ca ON ca.id_caracteristicas = c.id_caracteristicas
JOIN stock s ON s.id_stock = ca.id_stock
WHERE c.sku_producto = p.sku;

UPDATE producto p
SET categoria_nombre = pe.nombre_categoria
FROM pertenece pe
WHERE pe.id_producto = p.sku AND p.categoria_nombre IS NULL;

UPDATE servicio s
SET categoria_nombre = vi.id_categoria
FROM vincula vi
WHERE vi.id_servicio = s.sku AND s.categoria_nombre IS NULL;

-- 4. Extensión sobre `venta`, `compra`, `despacho`, `detalle` y `solicita` (BD2)
ALTER TABLE venta
    ADD COLUMN IF NOT EXISTS total NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cupon_codigo VARCHAR(40),
    ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS costo_envio NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cotizacion_solicitud_id INTEGER;

ALTER TABLE compra
    ADD COLUMN IF NOT EXISTS descuento NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nota TEXT;

ALTER TABLE despacho
    ADD COLUMN IF NOT EXISTS ancho NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS alto NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS fondo NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS costo_envio_proyectado NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS courier_nombre VARCHAR(60),
    ADD COLUMN IF NOT EXISTS codigo_seguimiento VARCHAR(60),
    ADD COLUMN IF NOT EXISTS direccion_texto VARCHAR(255);

ALTER TABLE detalle
    ADD COLUMN IF NOT EXISTS precio_aplicado NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS descuento_aplicado NUMERIC(5,2) DEFAULT 0;

ALTER TABLE cotizacion
    ADD COLUMN IF NOT EXISTS fecha_limite DATE;

ALTER TABLE solicita
    ADD COLUMN IF NOT EXISTS precio_base INTEGER,
    ADD COLUMN IF NOT EXISTS semanas_reajuste INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sku_servicio VARCHAR(50) REFERENCES servicio(sku) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS proveedor_run VARCHAR(12) REFERENCES usuario(run) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(100),
    ADD COLUMN IF NOT EXISTS correo_contacto VARCHAR(255),
    ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(30),
    ADD COLUMN IF NOT EXISTS fecha_preferida VARCHAR(40),
    ADD COLUMN IF NOT EXISTS descripcion_requerimiento TEXT,
    ADD COLUMN IF NOT EXISTS plazo_propuesta VARCHAR(80),
    ADD COLUMN IF NOT EXISTS validez_dias INTEGER DEFAULT 15,
    ADD COLUMN IF NOT EXISTS detalle_propuesta TEXT,
    ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMP;

ALTER TABLE reseña
    ADD COLUMN IF NOT EXISTS fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS verificada BOOLEAN DEFAULT FALSE;

-- 5. Líneas de orden multi-ítem para soportar carritos mixtos y trazabilidad por vendedor
CREATE TABLE IF NOT EXISTS orden_item_web (
    id_item SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    tipo_item VARCHAR(20) NOT NULL, -- 'Producto' o 'Servicio'
    sku VARCHAR(50) NOT NULL,
    titulo VARCHAR(160) NOT NULL,
    owner_run VARCHAR(12) REFERENCES usuario(run) ON DELETE SET NULL ON UPDATE CASCADE,
    vendedor_nombre VARCHAR(120),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    estado_despacho_item VARCHAR(30) DEFAULT 'En Preparación'
);

-- 6. Tablas de Gobierno Administrativo Web (Cupones, Soporte y Configuración)
CREATE TABLE IF NOT EXISTS cupon (
    codigo VARCHAR(40) PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'fijo', 'envio')),
    valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
    minimo_compra NUMERIC(12,2) DEFAULT 0 CHECK (minimo_compra >= 0),
    activo BOOLEAN DEFAULT TRUE,
    descripcion VARCHAR(200),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_soporte (
    id_ticket SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    run_usuario VARCHAR(12) REFERENCES usuario(run) ON DELETE SET NULL ON UPDATE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    asunto VARCHAR(160) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'Abierto' CHECK (estado IN ('Abierto', 'Respondido', 'Cerrado')),
    respuesta_admin TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_plataforma (
    clave VARCHAR(60) PRIMARY KEY,
    valor_json TEXT NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerta_inventario (
    id_alerta BIGSERIAL PRIMARY KEY,
    id_stock INTEGER,
    sku_producto VARCHAR(50),
    cantidad INTEGER,
    mensaje TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_producto_moderacion ON producto (estado_moderacion);
CREATE INDEX IF NOT EXISTS idx_producto_owner ON producto (owner_run);
CREATE INDEX IF NOT EXISTS idx_servicio_moderacion ON servicio (estado_moderacion);
CREATE INDEX IF NOT EXISTS idx_servicio_owner ON servicio (owner_run);
CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuario (rol);
CREATE INDEX IF NOT EXISTS idx_orden_item_venta ON orden_item_web (id_venta);
CREATE INDEX IF NOT EXISTS idx_orden_item_owner ON orden_item_web (owner_run);
