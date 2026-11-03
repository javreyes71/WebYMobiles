-- =============================================================================
-- 00_setup_usuario_bd.sql
-- Configuración de base de datos y usuario dedicado de mínimo privilegio
-- Alineado con "Contenido backend-1.pdf" (Diap. 20: nunca usar superusuario postgres)
-- y con el modelo relacional de Base de Datos Avanzadas (BD2).
-- =============================================================================
-- Ejecutar como administrador inicial (postgres) en pgAdmin o psql:
--   psql -U postgres -f 00_setup_usuario_bd.sql
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'vento_app') THEN
        -- Reemplazar 'CAMBIAR_PASSWORD_SEGURO' en entorno local / Raspberry Pi
        CREATE ROLE vento_app WITH LOGIN PASSWORD 'CAMBIAR_PASSWORD_SEGURO';
    END IF;
END
$$;

-- Si aún no existe la base de datos BD2 / vento_bd2, descomentar en psql:
-- CREATE DATABASE vento_bd2 OWNER vento_app ENCODING 'UTF8';

-- Ejecutar conectado a la base de datos del proyecto (\c BD2 o \c vento_bd2):
DO $$
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO vento_app', current_database());
END
$$;
GRANT USAGE, CREATE ON SCHEMA public TO vento_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vento_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO vento_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO vento_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vento_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO vento_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO vento_app;
