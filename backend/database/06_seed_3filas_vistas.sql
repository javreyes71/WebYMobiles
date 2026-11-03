-- =============================================================================
-- 06_seed_3filas_vistas.sql
-- Puebla datos de demostración para activar AL MENOS 3 FILAS en cada una
-- de las 6 VISTAS SQL de Base de Datos Avanzadas (BD2).
-- =============================================================================

SET session_replication_role = 'replica';

-- 1. Jerarquía de Categorías (vista_categorias_jerarquia)
INSERT INTO categoria (nombre, tipo) VALUES
    ('Zapatillas Urbanas', 'Producto'),
    ('Calzado Deportivo', 'Producto'),
    ('Polerones y Chaquetas', 'Producto')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO subdivide (nombre_a_categoria, nombre_b_categoria) VALUES
    ('Zapatos', 'Zapatillas Urbanas'),
    ('Zapatos', 'Calzado Deportivo'),
    ('Ropa', 'Polerones y Chaquetas')
ON CONFLICT (nombre_a_categoria, nombre_b_categoria) DO NOTHING;

-- 2. Presencia Geográfica de Empresas (vista_geo_empresas)
INSERT INTO direccion (id_direccion, codigo_postal, calle, numero, run_empresa, id_comuna, alias, comuna_nombre, region_codigo) VALUES
    (5101, 7500000, 'Av. Providencia', 1234, '76543210-3', 5001, 'Matriz Vento Oficial', 'Providencia', 'RM'),
    (5102, 4030000, 'Barros Arana', 450, '76123456-0', 5002, 'Sucursal SneakerDrop', 'Concepción', 'VIII'),
    (5103, 4780000, 'Av. Alemania', 800, '76987654-5', 5003, 'Hub Starken Sur', 'Temuco', 'IX')
ON CONFLICT (id_direccion) DO NOTHING;

INSERT INTO comercializa (id_empresa, id_producto, id_caracteristicas, precio) VALUES
    ('76987654-5', 'VT-ROP-007', 5007, 39990)
ON CONFLICT (id_empresa, id_producto) DO NOTHING;

-- 3. Historiales de compra para despacho
INSERT INTO historial_compra (id_historial, fecha_inicio, fecha_fin) VALUES
    (5001, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '15 days'),
    (5002, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days'),
    (5003, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days'),
    (5004, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days'),
    (5005, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (id_historial) DO NOTHING;

-- 4. Despachos logísticos
INSERT INTO despacho (id_despacho, precio, fecha, estado, id_historial_compra, ancho, alto, fondo, costo_envio_proyectado, courier_nombre, codigo_seguimiento, direccion_texto) VALUES
    (5001, 3990, CURRENT_DATE - INTERVAL '15 days', 'Entregado', 5001, 30, 20, 15, 3990, 'Starken Express', 'STK-5001-CL', 'Av. Alemania 420, Depto 602, Temuco'),
    (5002, 4990, CURRENT_DATE - INTERVAL '10 days', 'Entregado', 5002, 32, 22, 16, 4990, 'Starken Express', 'STK-5002-CL', 'Av. Providencia 1945, Of. 304, Santiago'),
    (5003, 0, CURRENT_DATE - INTERVAL '5 days', 'Entregado', 5003, 35, 25, 18, 0, 'Chilexpress Prioritario', 'CHX-5003-CL', 'Av. Los Carrera 850, Concepción'),
    (5004, 3990, CURRENT_DATE - INTERVAL '2 days', 'Entregado', 5004, 25, 20, 10, 3990, 'Starken Express', 'STK-5004-CL', 'Av. Alemania 420, Temuco'),
    (5005, 3990, CURRENT_DATE - INTERVAL '1 day', 'Entregado', 5005, 25, 20, 10, 3990, 'Starken Express', 'STK-5005-CL', 'Barros Arana 450, Concepción')
ON CONFLICT (id_despacho) DO NOTHING;

-- 5. Ventas consolidadas (respetando chk_venta_iva_valido: total_iva = precio_sin_iva * 0.19)
INSERT INTO venta (id_venta, cantidad, precio_sin_iva, total_iva, total, fecha) VALUES
    (5001, 1, 50000.00, 9500.00, 59500.00, CURRENT_TIMESTAMP - INTERVAL '15 days'),
    (5002, 1, 60000.00, 11400.00, 71400.00, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (5003, 1, 120000.00, 22800.00, 142800.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (5004, 1, 40000.00, 7600.00, 47600.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (5005, 1, 50000.00, 9500.00, 59500.00, CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id_venta) DO NOTHING;

-- 6. Compras de usuarios
INSERT INTO compra (run_usuario, id_venta, descuento) VALUES
    ('15555555-6', 5001, 0),
    ('15555555-6', 5002, 0),
    ('18888888-7', 5003, 0),
    ('15555555-6', 5004, 0),
    ('15555555-6', 5005, 0)
ON CONFLICT (run_usuario, id_venta) DO NOTHING;

-- 7. Medios de pago
INSERT INTO medio_pago (codigo_transferencia, medio_pago, fecha, id_venta, cantidad, precio_sin_iva, total_iva, precio_total) VALUES
    ('TRX-5001-WP', 'Tarjeta de Debito', CURRENT_DATE - INTERVAL '15 days', 5001, 1, 50000, 9500, 59500),
    ('TRX-5002-WP', 'WebPay Plus', CURRENT_DATE - INTERVAL '10 days', 5002, 1, 60000, 11400, 71400),
    ('TRX-5003-TC', 'Tarjeta de Credito', CURRENT_DATE - INTERVAL '5 days', 5003, 1, 120000, 22800, 142800),
    ('TRX-5004-TB', 'Transferencia Bancaria', CURRENT_DATE - INTERVAL '2 days', 5004, 1, 40000, 7600, 47600),
    ('TRX-5005-TB', 'Transferencia Bancaria', CURRENT_DATE - INTERVAL '1 day', 5005, 1, 50000, 9500, 59500)
ON CONFLICT (codigo_transferencia) DO NOTHING;

-- 8. Considera (relaciona venta + direccion + medio_pago + despacho)
INSERT INTO considera (id_venta, codigo_postal, codigo_transferencia, id_despacho, numero_seguimiento) VALUES
    (5001, 5001, 'TRX-5001-WP', 5001, 'STK-5001-CL'),
    (5002, 5002, 'TRX-5002-WP', 5002, 'STK-5002-CL'),
    (5003, 5001, 'TRX-5003-TC', 5003, 'CHX-5003-CL'),
    (5004, 5001, 'TRX-5004-TB', 5004, 'STK-5004-CL'),
    (5005, 5001, 'TRX-5005-TB', 5005, 'STK-5005-CL')
ON CONFLICT (id_venta, codigo_postal, codigo_transferencia) DO NOTHING;

-- 9. Detalles de venta (productos vendidos)
INSERT INTO detalle (id_producto, id_empresa, id_venta, precio_aplicado, descuento_aplicado) VALUES
    ('NK-UPT96-001', '76543210-3', 5001, 59500, 0),
    ('NK-URB-002', '76123456-0', 5002, 71400, 0),
    ('JD-AJ4-005', '76123456-0', 5003, 142800, 0),
    ('VT-ROP-007', '76543210-3', 5004, 47600, 0),
    ('VT-ROP-008', '76123456-0', 5005, 59500, 0)
ON CONFLICT (id_producto, id_empresa, id_venta) DO NOTHING;

SET session_replication_role = 'origin';
