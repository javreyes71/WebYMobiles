DROP TABLE IF EXISTS definir CASCADE;
DROP TABLE IF EXISTS conforma CASCADE;
DROP TABLE IF EXISTS posee CASCADE;
DROP TABLE IF EXISTS evalua CASCADE;
DROP TABLE IF EXISTS asocia CASCADE;
DROP TABLE IF EXISTS considera CASCADE;
DROP TABLE IF EXISTS crear CASCADE;
DROP TABLE IF EXISTS correo CASCADE;
DROP TABLE IF EXISTS ejerce CASCADE;
DROP TABLE IF EXISTS devolucion CASCADE;
DROP TABLE IF EXISTS consultar CASCADE;
DROP TABLE IF EXISTS añadir CASCADE;
DROP TABLE IF EXISTS compra CASCADE;
DROP TABLE IF EXISTS promociona CASCADE;
DROP TABLE IF EXISTS genera CASCADE;
DROP TABLE IF EXISTS solicita CASCADE;
DROP TABLE IF EXISTS indaga CASCADE;
DROP TABLE IF EXISTS preguntar CASCADE;
DROP TABLE IF EXISTS telefono CASCADE;
DROP TABLE IF EXISTS critica CASCADE;
DROP TABLE IF EXISTS reseñar CASCADE;
DROP TABLE IF EXISTS detalle CASCADE;
DROP TABLE IF EXISTS contiene CASCADE;
DROP TABLE IF EXISTS vincula CASCADE;
DROP TABLE IF EXISTS pertenece CASCADE;
DROP TABLE IF EXISTS comercializa CASCADE;
DROP TABLE IF EXISTS vende CASCADE;
DROP TABLE IF EXISTS incluye CASCADE;
DROP TABLE IF EXISTS subdivide CASCADE;
DROP TABLE IF EXISTS administra CASCADE;
DROP TABLE IF EXISTS promueve CASCADE;
DROP TABLE IF EXISTS contacto CASCADE;
DROP TABLE IF EXISTS paga CASCADE;
DROP TABLE IF EXISTS empresa_transporte_despacho CASCADE;
DROP TABLE IF EXISTS direccion CASCADE;
DROP TABLE IF EXISTS despacho CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS servicio CASCADE;
DROP TABLE IF EXISTS comuna CASCADE;
DROP TABLE IF EXISTS Medio_Pago CASCADE;
DROP TABLE IF EXISTS caracteristicas CASCADE;
DROP TABLE IF EXISTS provincia CASCADE;
DROP TABLE IF EXISTS cotizacion CASCADE;
DROP TABLE IF EXISTS mensajeria CASCADE;
DROP TABLE IF EXISTS reseña CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS venta CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS region CASCADE;
DROP TABLE IF EXISTS historial_compra CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS empresa CASCADE;
DROP TABLE IF EXISTS oferta CASCADE;
DROP TABLE IF EXISTS lista_deseos_wishlist CASCADE;

CREATE TABLE lista_deseos_wishlist (
    nombre VARCHAR(50) PRIMARY KEY
);

CREATE TABLE oferta (
    id_oferta INTEGER PRIMARY KEY,
    descuento DECIMAL(5,2)
);

CREATE TABLE empresa (
    run_empresa VARCHAR(12) PRIMARY KEY,
    nombre VARCHAR(100),
    pagina_web VARCHAR(255)
);

CREATE TABLE stock (
    id_stock INTEGER PRIMARY KEY,
    cantidad INT
);

CREATE TABLE historial_compra (
    id_historial INTEGER PRIMARY KEY,
    fecha_inicio DATE,
    fecha_fin DATE
);

CREATE TABLE region (
    id_region INTEGER PRIMARY KEY,
    nombre VARCHAR(100),
    superficie INT NOT NULL
);

CREATE TABLE categoria (
    nombre VARCHAR(50) PRIMARY KEY,
    tipo VARCHAR(30)
);

CREATE TABLE venta (
    id_venta INTEGER PRIMARY KEY,
    cantidad INT,
    precio_sin_iva DECIMAL(10,2),
    total_iva DECIMAL(10,2)
);

CREATE TABLE usuario (
    run VARCHAR(12) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    clave_acceso VARCHAR(255),
    fecha_nacimiento DATE,
    fecha_registro DATE,
    tipo_cliente BOOLEAN,
    tipo_emprendedor BOOLEAN,
    run_empresa VARCHAR(12),
    CONSTRAINT fk_usuario_empresa FOREIGN KEY (run_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reseña (
    numero_reseña INTEGER PRIMARY KEY,
    puntaje INT,
    comentario TEXT,
    run_usuario VARCHAR(12),
    CONSTRAINT fk_reseña_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE mensajeria (
    id_mensajeria INTEGER PRIMARY KEY,
    comentario TEXT,
    fecha DATE,
    run_empresa VARCHAR(12),
    CONSTRAINT fk_mensajeria_empresa FOREIGN KEY (run_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE cotizacion (
    id_cotizacion INTEGER PRIMARY KEY,
    fecha DATE,
    run_empresa VARCHAR(12),
    CONSTRAINT fk_cotizacion_empresa FOREIGN KEY (run_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE provincia (
    id_provincia INTEGER PRIMARY KEY,
    nombre VARCHAR(50),
    superficie INT NOT NULL,
    id_region INTEGER,
    CONSTRAINT fk_provincia_region FOREIGN KEY (id_region) REFERENCES region(id_region) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE caracteristicas (
    id_caracteristicas INTEGER PRIMARY KEY,
    atributos JSON,
    id_stock INTEGER,
    CONSTRAINT fk_caracteristicas_stock FOREIGN KEY (id_stock) REFERENCES stock(id_stock) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Medio_Pago (
    Codigo_Transferencia VARCHAR(50) PRIMARY KEY,
    Medio_Pago VARCHAR(30),
    Fecha DATE,
    Ultimos_4_Digitos_Tarjeta VARCHAR(4),
    ID_Venta INTEGER,
    Cantidad INT,
    Total_IVA INT,
    Precio_sin_IVA INT,
    Precio_Total INT,
    CONSTRAINT fk_mediopago_venta FOREIGN KEY (ID_Venta) REFERENCES Venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE comuna (
    id_comuna INT PRIMARY KEY,
    nombre VARCHAR(50),
    superficie INT NOT NULL,
    id_provincia INT,
    CONSTRAINT fk_comuna_provincia FOREIGN KEY (id_provincia) REFERENCES provincia(id_provincia) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE servicio (
    sku VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100),
    restriccion_edad BOOLEAN,
    atributos JSON,
    tiempo INTEGER,
    id_cotizacion INTEGER,
    CONSTRAINT fk_servicio_cotizacion FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE producto (
    sku VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100),
    restriccion_edad BOOLEAN,
    atributos JSON,
    marca VARCHAR(50),
    id_cotizacion INTEGER,
    CONSTRAINT fk_producto_cotizacion FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE despacho (
    id_despacho INTEGER PRIMARY KEY,
    precio INT,
    fecha DATE,
    estado VARCHAR(20),
    id_historial_compra INTEGER,
    CONSTRAINT fk_despacho_historial FOREIGN KEY (id_historial_compra) REFERENCES historial_compra(id_historial) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE direccion (
    id_direccion INTEGER PRIMARY KEY,
    codigo_postal INTEGER,
    calle VARCHAR(100),
    numero INT,
    run_usuario VARCHAR(12),
    run_empresa VARCHAR(12),
    id_comuna INTEGER,
    CONSTRAINT fk_direccion_comuna FOREIGN KEY (id_comuna) REFERENCES comuna(id_comuna) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_direccion_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_direccion_empresa FOREIGN KEY (run_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE empresa_transporte_despacho (
    numero_seguimiento VARCHAR(50) PRIMARY KEY,
    id_despacho INTEGER,
    run_empresa VARCHAR(12),
    CONSTRAINT fk_transporte_empresa FOREIGN KEY (run_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_transporte_despacho FOREIGN KEY (id_despacho) REFERENCES despacho(id_despacho) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE paga (
    id_venta INTEGER PRIMARY KEY,
    medio_pago VARCHAR(50),
    CONSTRAINT fk_paga_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_paga_medio FOREIGN KEY (medio_pago) REFERENCES Medio_Pago(Codigo_Transferencia) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE subdivide (
    nombre_a_categoria VARCHAR(50),
    nombre_b_categoria VARCHAR(50),
    PRIMARY KEY (nombre_a_categoria, nombre_b_categoria),
    CONSTRAINT fk_subdivide_a FOREIGN KEY (nombre_a_categoria) REFERENCES categoria(nombre) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_subdivide_b FOREIGN KEY (nombre_b_categoria) REFERENCES categoria(nombre) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE incluye (
    id_venta INTEGER,
    sku_producto VARCHAR(50),
    sku_servicio VARCHAR(50),
    run_usuario VARCHAR(12),
    PRIMARY KEY (id_venta, sku_producto, sku_servicio),
    CONSTRAINT fk_incluye_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_incluye_producto FOREIGN KEY (sku_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_incluye_servicio FOREIGN KEY (sku_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_incluye_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE vende (
    id_usuario VARCHAR(12),
    id_producto VARCHAR(50),
    id_caracteristicas INTEGER,
    precio MONEY,
    PRIMARY KEY (id_usuario, id_producto),
    CONSTRAINT fk_vende_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vende_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vende_caract FOREIGN KEY (id_caracteristicas) REFERENCES caracteristicas(id_caracteristicas) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE comercializa (
    id_empresa VARCHAR(12),
    id_producto VARCHAR(50),
    id_caracteristicas INTEGER,
    precio MONEY,
    PRIMARY KEY (id_empresa, id_producto),
    CONSTRAINT fk_comercializa_empresa FOREIGN KEY (id_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comercializa_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comercializa_caract FOREIGN KEY (id_caracteristicas) REFERENCES caracteristicas(id_caracteristicas) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pertenece (
    nombre_categoria VARCHAR(50),
    id_producto VARCHAR(50),
    PRIMARY KEY (nombre_categoria, id_producto),
    CONSTRAINT fk_pertenece_categoria FOREIGN KEY (nombre_categoria) REFERENCES categoria(nombre) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pertenece_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE vincula (
    id_servicio VARCHAR(50),
    id_categoria VARCHAR(50),
    PRIMARY KEY (id_categoria, id_servicio),
    CONSTRAINT fk_vincula_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(nombre) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vincula_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE contiene (
    id_caracteristicas INTEGER,
    sku_producto VARCHAR(50),
    PRIMARY KEY (id_caracteristicas, sku_producto),
    CONSTRAINT fk_contiene_producto FOREIGN KEY (sku_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_contiene_caract FOREIGN KEY (id_caracteristicas) REFERENCES caracteristicas(id_caracteristicas) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE detalle (
    id_producto VARCHAR(50),
    id_empresa VARCHAR(12),
    id_venta INTEGER,
    PRIMARY KEY (id_producto, id_empresa, id_venta),
    CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_empresa FOREIGN KEY (id_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reseñar (
    id_reseña INTEGER,
    id_usuario VARCHAR(12),
    id_producto VARCHAR(50),
    PRIMARY KEY (id_reseña, id_usuario, id_producto),
    CONSTRAINT fk_reseñar_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reseñar_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reseñar_reseña FOREIGN KEY (id_reseña) REFERENCES reseña(numero_reseña) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE critica (
    id_reseña INTEGER,
    id_usuario VARCHAR(12),
    id_servicio VARCHAR(50),
    PRIMARY KEY (id_reseña, id_usuario, id_servicio),
    CONSTRAINT fk_critica_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_critica_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_critica_reseña FOREIGN KEY (id_reseña) REFERENCES reseña(numero_reseña) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE telefono (
    numero VARCHAR(15) PRIMARY KEY,
    prefijo INT,
    run_usuario VARCHAR(12),
    CONSTRAINT fk_telefono_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE preguntar (
    id_usuario VARCHAR(12),
    id_producto VARCHAR(50),
    id_mensajeria INTEGER,
    PRIMARY KEY (id_producto, id_usuario, id_mensajeria),
    CONSTRAINT fk_preguntar_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_preguntar_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_preguntar_mensaje FOREIGN KEY (id_mensajeria) REFERENCES mensajeria(id_mensajeria) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE indaga (
    run_usuario VARCHAR(12),
    id_servicio VARCHAR(50),
    id_mensajeria INTEGER,
    PRIMARY KEY (id_servicio, run_usuario, id_mensajeria),
    CONSTRAINT fk_indaga_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_indaga_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_indaga_mensaje FOREIGN KEY (id_mensajeria) REFERENCES mensajeria(id_mensajeria) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE solicita (
    id_solicitud INT PRIMARY KEY,
    id_cotizacion INTEGER,
    run_usuario VARCHAR(12),
    precio INT,
    estado VARCHAR(20),
    fecha_inicio DATE,
    fecha_fin DATE,
    CONSTRAINT fk_solicita_cotizacion FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_solicita_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE genera (
    id_medio_pago VARCHAR(50),
    id_historial_compra INTEGER,
    estado VARCHAR(20),
    PRIMARY KEY (id_medio_pago, id_historial_compra),
    CONSTRAINT fk_genera_medio FOREIGN KEY (id_medio_pago) REFERENCES Medio_Pago(Codigo_Transferencia) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_genera_historial FOREIGN KEY (id_historial_compra) REFERENCES historial_compra(id_historial) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE promociona (
    id_oferta INTEGER,
    sku_servicio VARCHAR(50),
    sku_producto VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    PRIMARY KEY (id_oferta, sku_servicio, sku_producto),
    CONSTRAINT fk_promociona_oferta FOREIGN KEY (id_oferta) REFERENCES oferta(id_oferta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promociona_servicio FOREIGN KEY (sku_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promociona_producto FOREIGN KEY (sku_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE compra (
    run_usuario VARCHAR(12),
    id_venta INTEGER,
    PRIMARY KEY (run_usuario, id_venta),
    CONSTRAINT fk_compra_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_compra_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE añadir (
    nombre_lista_deseos VARCHAR(50),
    sku_servicio VARCHAR(50),
    sku_producto VARCHAR(50),
    PRIMARY KEY (nombre_lista_deseos, sku_servicio, sku_producto),
    CONSTRAINT fk_añadir_lista FOREIGN KEY (nombre_lista_deseos) REFERENCES lista_deseos_wishlist(nombre) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_añadir_servicio FOREIGN KEY (sku_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_añadir_producto FOREIGN KEY (sku_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE consultar (
    run_usuario VARCHAR(12),
    id_mensajeria INTEGER,
    PRIMARY KEY (run_usuario, id_mensajeria),
    CONSTRAINT fk_consultar_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_consultar_mensaje FOREIGN KEY (id_mensajeria) REFERENCES mensajeria(id_mensajeria) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE devolucion (
    id_devolucion INTEGER PRIMARY KEY,
    motivo TEXT,
    fecha DATE,
    numero_seguimiento VARCHAR(50),
    id_despacho INTEGER,
    estado VARCHAR(20),
    CONSTRAINT fk_devolucion_transporte FOREIGN KEY (numero_seguimiento) REFERENCES empresa_transporte_despacho(numero_seguimiento) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_devolucion_despacho FOREIGN KEY (id_despacho) REFERENCES despacho(id_despacho) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ejerce (
    id_devolucion INTEGER PRIMARY KEY,
    run_usuario VARCHAR(12),
    id_venta INTEGER,
    estado VARCHAR(20),
    CONSTRAINT fk_ejerce_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ejerce_devolucion FOREIGN KEY (id_devolucion) REFERENCES devolucion(id_devolucion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ejerce_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE correo (
    direccion_correo VARCHAR(255) PRIMARY KEY,
    run_usuario VARCHAR(12),
    run_empresa VARCHAR(12),
    CONSTRAINT fk_correo_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_correo_empresa FOREIGN KEY (run_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE crear (
    run_usuario VARCHAR(12),
    nombre_lista_deseos VARCHAR(50),
    PRIMARY KEY (run_usuario, nombre_lista_deseos),
    CONSTRAINT fk_crear_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_crear_lista FOREIGN KEY (nombre_lista_deseos) REFERENCES lista_deseos_wishlist(nombre) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE considera (
    id_venta INTEGER,
    codigo_postal INTEGER,
    codigo_transferencia VARCHAR(50),
    id_despacho INTEGER,
    numero_seguimiento VARCHAR(50),
    PRIMARY KEY (id_venta, codigo_postal, codigo_transferencia),
    CONSTRAINT fk_considera_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_considera_direccion FOREIGN KEY (codigo_postal) REFERENCES direccion(id_direccion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_considera_despacho FOREIGN KEY (id_despacho) REFERENCES despacho(id_despacho) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_considera_transporte FOREIGN KEY (numero_seguimiento) REFERENCES empresa_transporte_despacho(numero_seguimiento) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_considera_medio FOREIGN KEY (codigo_transferencia) REFERENCES Medio_Pago(Codigo_Transferencia) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE asocia (
    id_servicio VARCHAR(50),
    id_empresa VARCHAR(12),
    id_venta INTEGER,
    PRIMARY KEY (id_venta, id_empresa, id_servicio),
    CONSTRAINT fk_asocia_empresa FOREIGN KEY (id_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_asocia_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_asocia_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE evalua (
    id_reseña INT PRIMARY KEY,
    run_usuario VARCHAR(12),
    CONSTRAINT fk_evalua_reseña FOREIGN KEY (id_reseña) REFERENCES reseña(numero_reseña) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_evalua_usuario FOREIGN KEY (run_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE posee (
    id_lista_deseos_wishlist VARCHAR(50),
    id_servicio VARCHAR(50),
    PRIMARY KEY (id_lista_deseos_wishlist, id_servicio),
    CONSTRAINT fk_posee_lista FOREIGN KEY (id_lista_deseos_wishlist) REFERENCES lista_deseos_wishlist(nombre) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_posee_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE administra (
    id_usuario VARCHAR(12),
    id_empresa VARCHAR(12),
    PRIMARY KEY (id_empresa, id_usuario),
    CONSTRAINT fk_administra_empresa FOREIGN KEY (id_empresa) REFERENCES empresa(run_empresa) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_administra_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE conforma (
    id_venta INTEGER,
    id_servicio VARCHAR(50),
    id_usuario VARCHAR(12),
    PRIMARY KEY (id_venta, id_servicio, id_usuario),
    CONSTRAINT fk_conforma_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_conforma_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_conforma_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE definir (
    id_direccion INTEGER,
    id_producto VARCHAR(50),
    id_despacho INTEGER,
    PRIMARY KEY (id_direccion, id_producto, id_despacho),
    CONSTRAINT fk_definir_direccion FOREIGN KEY (id_direccion) REFERENCES direccion(id_direccion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_definir_despacho FOREIGN KEY (id_despacho) REFERENCES despacho(id_despacho) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_definir_producto FOREIGN KEY (id_producto) REFERENCES producto(sku) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE promueve (
    id_oferta INT ,
    id_servicio VARCHAR(12),
    fecha_inicio date,
	fecha_fin date,
	primary key(id_oferta,id_servicio),
    CONSTRAINT fk_promueve_servicio FOREIGN KEY (id_servicio) REFERENCES servicio(sku) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promueve_oferta FOREIGN KEY (id_oferta) REFERENCES oferta(id_oferta) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE contacto (
    id_telefono INT PRIMARY KEY,
    id_usuario VARCHAR(12),
    CONSTRAINT fk_contacto_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(run) ON DELETE CASCADE ON UPDATE CASCADE
    
);
-- 1. Restricción de cantidad no negativa en el inventario




ALTER TABLE stock 
ADD CONSTRAINT chk_stock_cantidad_valida CHECK (cantidad >= 0);

-- 2. Restricción de precio base no negativo en ventas
ALTER TABLE venta 
ADD CONSTRAINT chk_venta_precio_valido CHECK (precio_sin_iva >= 0);

-- 3. Validación de consistencia del IVA (19%) en ventas
ALTER TABLE venta 
ADD CONSTRAINT chk_venta_iva_valido CHECK (total_iva = precio_sin_iva * 0.19);

-- 4. Restricción de fecha mínima de inicio en historial de compras
ALTER TABLE historial_compra 
ADD CONSTRAINT chk_historial_fecha_valida CHECK (fecha_inicio >= '1995-01-01');

-- 5. Restricción de fecha de nacimiento mínima para usuarios
ALTER TABLE usuario 
ADD CONSTRAINT chk_usuario_fechanac_valida CHECK (fecha_nacimiento >= '1940-01-01');

-- 6. Coherencia cronológica de fechas en solicitudes
ALTER TABLE solicita 
ADD CONSTRAINT chk_solicita_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

-- 7. Validación de longitud mínima (8 dígitos) para teléfonos
ALTER TABLE telefono 
ADD CONSTRAINT chk_telefono_longitud CHECK (LENGTH(numero) >= 8);

-- 8. Restricción de dominio para estados de despacho
ALTER TABLE despacho 
ADD CONSTRAINT chk_despacho_estado_valido CHECK (
    estado IN ('En Preparación', 'Despachado', 'En reparto', 'Entregado')
);

-- 9. Restricción para impedir fechas futuras en cotizaciones
ALTER TABLE cotizacion 
ADD CONSTRAINT chk_cotizacion_fecha_actual CHECK (fecha <= CURRENT_DATE);




CREATE INDEX IF NOT EXISTS idx_usuario_empresa ON usuario (run_empresa);
CREATE INDEX IF NOT EXISTS idx_usuario_nombre ON usuario (nombre);
CREATE INDEX IF NOT EXISTS idx_reseña_usuario ON reseña (run_usuario);
CREATE INDEX IF NOT EXISTS idx_mensajeria_empresa ON mensajeria (run_empresa);
CREATE INDEX IF NOT EXISTS idx_cotizacion_empresa ON cotizacion (run_empresa);
CREATE INDEX IF NOT EXISTS idx_cotizacion_fecha ON cotizacion (fecha);
CREATE INDEX IF NOT EXISTS idx_provincia_region ON provincia (id_region);
CREATE INDEX IF NOT EXISTS idx_comuna_provincia ON comuna (id_provincia);
CREATE INDEX IF NOT EXISTS idx_caracteristicas_stock ON caracteristicas (id_stock);
CREATE INDEX IF NOT EXISTS idx_mediopago_venta ON Medio_Pago (ID_Venta);
CREATE INDEX IF NOT EXISTS idx_servicio_cotizacion ON servicio (id_cotizacion);
CREATE INDEX IF NOT EXISTS idx_producto_cotizacion ON producto (id_cotizacion);
CREATE INDEX IF NOT EXISTS idx_producto_nombre ON producto (nombre);
CREATE INDEX IF NOT EXISTS idx_despacho_historial ON despacho (id_historial_compra);
CREATE INDEX IF NOT EXISTS idx_despacho_estado ON despacho (estado);
CREATE INDEX IF NOT EXISTS idx_direccion_usuario ON direccion (run_usuario);
CREATE INDEX IF NOT EXISTS idx_direccion_empresa ON direccion (run_empresa);
CREATE INDEX IF NOT EXISTS idx_direccion_comuna ON direccion (id_comuna);
CREATE INDEX IF NOT EXISTS idx_transporte_despacho ON empresa_transporte_despacho (id_despacho);
CREATE INDEX IF NOT EXISTS idx_incluye_usuario ON incluye (run_usuario);
CREATE INDEX IF NOT EXISTS idx_vende_caract ON vende (id_caracteristicas);
CREATE INDEX IF NOT EXISTS idx_comercializa_caract ON comercializa (id_caracteristicas);
CREATE INDEX IF NOT EXISTS idx_solicita_usuario ON solicita (run_usuario);
CREATE INDEX IF NOT EXISTS idx_correo_usuario ON correo (run_usuario);
CREATE INDEX IF NOT EXISTS idx_telefono_usuario ON telefono (run_usuario);
