-- =============================================================================
-- 05_seed_vento_demo.sql
-- Semilla SQL opcional para poblar directamente en pgAdmin / psql los cupones
-- y configuración base (las 5 cuentas RBAC con hash BCrypt y el catálogo curado
-- también son sembrados automáticamente de forma idempotente por DbSeeder.cs al
-- iniciar Vento.Api).
-- =============================================================================

INSERT INTO region (id_region, nombre, superficie) VALUES
    (5001, 'Región Metropolitana de Santiago', 15403),
    (5002, 'Región del Biobío', 23890),
    (5003, 'Región de La Araucanía', 31842),
    (5004, 'Región de Los Lagos', 48583)
ON CONFLICT (id_region) DO NOTHING;

INSERT INTO provincia (id_provincia, nombre, superficie, id_region) VALUES
    (5001, 'Santiago', 2030, 5001),
    (5002, 'Concepción', 3439, 5002),
    (5003, 'Cautín', 18409, 5003),
    (5004, 'Osorno', 9224, 5004)
ON CONFLICT (id_provincia) DO NOTHING;

INSERT INTO comuna (id_comuna, nombre, superficie, id_provincia) VALUES
    (5001, 'Providencia', 14, 5001),
    (5002, 'Concepción', 222, 5002),
    (5003, 'Temuco', 464, 5003),
    (5004, 'Osorno', 951, 5004)
ON CONFLICT (id_comuna) DO NOTHING;

INSERT INTO categoria (nombre, tipo) VALUES
    ('Zapatos', 'Producto'),
    ('Ropa', 'Producto'),
    ('Accesorios', 'Producto'),
    ('Instrumentos', 'Producto'),
    ('Mantención y Limpieza', 'Servicio'),
    ('Personalización y Diseño', 'Servicio'),
    ('Luthería y Audio', 'Servicio'),
    ('Asesoría y Autenticación', 'Servicio')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cupon (codigo, tipo, valor, minimo_compra, activo, descripcion) VALUES
    ('VENTO10', 'porcentaje', 10, 20000, TRUE, '10% de descuento sobre el subtotal en compras desde $20.000 CLP'),
    ('BIENVENIDA', 'fijo', 5000, 25000, TRUE, '$5.000 CLP de descuento directo en tu primera compra'),
    ('ENVIOGRATIS', 'envio', 100, 15000, TRUE, 'Despacho gratuito nacional en productos seleccionados')
ON CONFLICT (codigo) DO NOTHING;

-- Asegurar permisos completos para el rol de mínimo privilegio vento_app sobre todas las tablas y vistas creadas
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'vento_app') THEN
        GRANT USAGE ON SCHEMA public TO vento_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vento_app;
        GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO vento_app;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO vento_app;
    END IF;
END
$$;
