-- Firmas de la version anterior
DROP FUNCTION IF EXISTS fn_atributo_json_producto(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_ciudades_por_item(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_clientes_frecuentes(INTEGER, NUMERIC);
DROP FUNCTION IF EXISTS fn_clientes_por_item(VARCHAR, VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_comunas_direccion_incompleta(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_consultas_sin_responder(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_del_anadir(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_del_resena(INTEGER);
DROP FUNCTION IF EXISTS fn_despachos_por_vendedor(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_emprendedores_sin_calificacion(INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS fn_ins_anadir(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_ins_resena(INTEGER, INTEGER, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS fn_productos_sobre_volumen(VARCHAR, NUMERIC);
DROP FUNCTION IF EXISTS fn_resumen_compras_mes(DATE, VARCHAR);
DROP FUNCTION IF EXISTS fn_tiempo_respuesta_promedio(VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS fn_top_item_por_vendedor(VARCHAR);
DROP FUNCTION IF EXISTS fn_transito_promedio_transporte(VARCHAR);
DROP FUNCTION IF EXISTS fn_upd_anadir(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_upd_correo(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_upd_direccion(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS fn_upd_incluye(INTEGER, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_upd_resena(INTEGER, INTEGER, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS fn_upd_telefono(VARCHAR, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS fn_upd_usuario(VARCHAR, VARCHAR, VARCHAR, DATE, DATE, BOOLEAN, BOOLEAN, VARCHAR);
DROP FUNCTION IF EXISTS fn_variantes_producto(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_ventas_mes_por_vendedor(DATE, VARCHAR);

-- ================================================================================
-- 1. CONSOLIDACIÓN TEMPORAL Y VOLUMETRÍA DE TRANSACCIONES
-- ================================================================================
-- 1.1. Realizar una consulta que permita determinar cuantos clientes han comprado un producto X en un periodo determinado (EJ: Leche entre 2012 y 2014).

DROP FUNCTION IF EXISTS fn_cantidad_clientes_producto(VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_cantidad_clientes_producto(
    p_sku         VARCHAR,
    p_anio_inicio INTEGER,
    p_anio_fin    INTEGER
)
RETURNS TABLE (
    periodo           TEXT,
    producto          VARCHAR,
    cantidad_clientes BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF p_anio_inicio > p_anio_fin THEN
        RAISE EXCEPTION 'El anio inicial (%) no puede ser mayor que el final (%)', p_anio_inicio, p_anio_fin;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM producto WHERE sku = p_sku) THEN
        RAISE EXCEPTION 'El producto % no existe', p_sku;
    END IF;

    RETURN QUERY
    SELECT COALESCE(EXTRACT(YEAR FROM mp.Fecha)::INTEGER::TEXT, 'Total periodo'),
           p.nombre::VARCHAR,
           COUNT(DISTINCT c.run_usuario)::BIGINT
    FROM compra c
    JOIN incluye i     ON i.id_venta = c.id_venta
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    JOIN producto p    ON p.sku = i.sku_producto
    WHERE p.sku = p_sku
      AND EXTRACT(YEAR FROM mp.Fecha) BETWEEN p_anio_inicio AND p_anio_fin
    GROUP BY p.nombre, ROLLUP (EXTRACT(YEAR FROM mp.Fecha))
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.1:
--------------------------------------------------------------------------------




-- 1.2. Realizar una consulta que permita determinar los clientes que han comprado un determinado producto X en un periodo determinado.

DROP FUNCTION IF EXISTS fn_clientes_producto(VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_clientes_producto(
    p_sku         VARCHAR,
    p_anio_inicio INTEGER,
    p_anio_fin    INTEGER
)
RETURNS TABLE (
    run          VARCHAR,
    cliente      VARCHAR,
    producto     VARCHAR,
    id_venta     INTEGER,
    fecha_compra DATE
) AS $$
#variable_conflict use_column
BEGIN
    IF p_anio_inicio > p_anio_fin THEN
        RAISE EXCEPTION 'El anio inicial (%) no puede ser mayor que el final (%)', p_anio_inicio, p_anio_fin;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM producto WHERE sku = p_sku) THEN
        RAISE EXCEPTION 'El producto % no existe', p_sku;
    END IF;

    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           p.nombre::VARCHAR,
           c.id_venta,
           mp.Fecha
    FROM usuario u
    JOIN compra c      ON c.run_usuario = u.run
    JOIN incluye i     ON i.id_venta = c.id_venta
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    JOIN producto p    ON p.sku = i.sku_producto
    WHERE p.sku = p_sku
      AND EXTRACT(YEAR FROM mp.Fecha) BETWEEN p_anio_inicio AND p_anio_fin
    ORDER BY mp.Fecha, u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.2:
--------------------------------------------------------------------------------




-- 1.3. Realizar una consulta que permita determinar cuantos clientes han comprado un servicio X en un periodo determinado.

DROP FUNCTION IF EXISTS fn_cantidad_clientes_servicio(VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_cantidad_clientes_servicio(
    p_sku         VARCHAR,
    p_anio_inicio INTEGER,
    p_anio_fin    INTEGER
)
RETURNS TABLE (
    periodo           TEXT,
    servicio          VARCHAR,
    cantidad_clientes BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF p_anio_inicio > p_anio_fin THEN
        RAISE EXCEPTION 'El anio inicial (%) no puede ser mayor que el final (%)', p_anio_inicio, p_anio_fin;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM servicio WHERE sku = p_sku) THEN
        RAISE EXCEPTION 'El servicio % no existe', p_sku;
    END IF;

    RETURN QUERY
    SELECT COALESCE(EXTRACT(YEAR FROM mp.Fecha)::INTEGER::TEXT, 'Total periodo'),
           s.nombre::VARCHAR,
           COUNT(DISTINCT c.run_usuario)::BIGINT
    FROM compra c
    JOIN incluye i     ON i.id_venta = c.id_venta
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    JOIN servicio s    ON s.sku = i.sku_servicio
    WHERE s.sku = p_sku
      AND EXTRACT(YEAR FROM mp.Fecha) BETWEEN p_anio_inicio AND p_anio_fin
    GROUP BY s.nombre, ROLLUP (EXTRACT(YEAR FROM mp.Fecha))
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.3:
--------------------------------------------------------------------------------




-- 1.4. Realizar una consulta que permita determinar los clientes que han comprado un determinado servicio X en un periodo determinado.

DROP FUNCTION IF EXISTS fn_clientes_servicio(VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_clientes_servicio(
    p_sku         VARCHAR,
    p_anio_inicio INTEGER,
    p_anio_fin    INTEGER
)
RETURNS TABLE (
    run          VARCHAR,
    cliente      VARCHAR,
    servicio     VARCHAR,
    id_venta     INTEGER,
    fecha_compra DATE
) AS $$
#variable_conflict use_column
BEGIN
    IF p_anio_inicio > p_anio_fin THEN
        RAISE EXCEPTION 'El anio inicial (%) no puede ser mayor que el final (%)', p_anio_inicio, p_anio_fin;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM servicio WHERE sku = p_sku) THEN
        RAISE EXCEPTION 'El servicio % no existe', p_sku;
    END IF;

    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           s.nombre::VARCHAR,
           c.id_venta,
           mp.Fecha
    FROM usuario u
    JOIN compra c      ON c.run_usuario = u.run
    JOIN incluye i     ON i.id_venta = c.id_venta
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    JOIN servicio s    ON s.sku = i.sku_servicio
    WHERE s.sku = p_sku
      AND EXTRACT(YEAR FROM mp.Fecha) BETWEEN p_anio_inicio AND p_anio_fin
    ORDER BY mp.Fecha, u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.4:
--------------------------------------------------------------------------------




-- 1.5. Mostrar el total de compras y total pagado del mes actual por cliente X, e indique los clientes que han comprado mas de 5 veces para asignarles un descuento.

DROP FUNCTION IF EXISTS fn_compras_mes_cliente(VARCHAR, DATE);
CREATE OR REPLACE FUNCTION fn_compras_mes_cliente(
    p_run       VARCHAR,
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    detalle       TEXT,
    fecha_pago    DATE,
    total_compras BIGINT,
    total_pagado  BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE run = p_run AND tipo_cliente = TRUE) THEN
        RAISE EXCEPTION 'El cliente % no existe', p_run;
    END IF;

    RETURN QUERY
    SELECT CASE WHEN GROUPING(c.id_venta) = 1
                THEN 'Total ' || to_char(p_fecha_ref, 'MM-YYYY')
                ELSE 'Venta ' || c.id_venta END,
           CASE WHEN GROUPING(c.id_venta) = 1 THEN NULL ELSE MAX(mp.Fecha) END,
           COUNT(c.id_venta)::BIGINT,
           COALESCE(SUM(mp.Precio_Total), 0)::BIGINT
    FROM compra c
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    WHERE c.run_usuario = p_run
      AND date_trunc('month', mp.Fecha) = date_trunc('month', p_fecha_ref)
    GROUP BY ROLLUP (c.id_venta)
    ORDER BY GROUPING(c.id_venta), 2;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_clientes_descuento(INTEGER, NUMERIC);
CREATE OR REPLACE FUNCTION fn_clientes_descuento(
    p_min_compras INTEGER DEFAULT 5,
    p_descuento   NUMERIC DEFAULT 10
)
RETURNS TABLE (
    run                VARCHAR,
    cliente            VARCHAR,
    veces_compra       BIGINT,
    total_pagado       BIGINT,
    descuento_asignado NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           COUNT(c.id_venta)::BIGINT,
           COALESCE(SUM(mp.Precio_Total), 0)::BIGINT,
           p_descuento
    FROM usuario u
    JOIN compra c      ON c.run_usuario = u.run
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    WHERE u.tipo_cliente = TRUE
    GROUP BY u.run, u.nombre
    HAVING COUNT(c.id_venta) > p_min_compras
    ORDER BY 3 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.5:
--------------------------------------------------------------------------------




-- 1.6. Total de ventas del mes por articulo y por vendedor. Totalizando al vendedor.

DROP FUNCTION IF EXISTS fn_ventas_mes_vendedor(DATE);
CREATE OR REPLACE FUNCTION fn_ventas_mes_vendedor(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    vendedor        VARCHAR,
    nombre_vendedor VARCHAR,
    sku             VARCHAR,
    articulo        VARCHAR,
    unidades        BIGINT,
    monto_total     BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           COALESCE(p.sku, 'TOTAL')::VARCHAR,
           COALESCE(p.nombre, 'Total vendedor')::VARCHAR,
           SUM(v.cantidad)::BIGINT,
           SUM(mp.Precio_Total)::BIGINT
    FROM vende ve
    JOIN usuario u     ON u.run = ve.id_usuario
    JOIN producto p    ON p.sku = ve.id_producto
    JOIN detalle d     ON d.id_producto = p.sku
    JOIN venta v       ON v.id_venta = d.id_venta
    JOIN Medio_Pago mp ON mp.ID_Venta = v.id_venta
    WHERE date_trunc('month', mp.Fecha) = date_trunc('month', p_fecha_ref)
    GROUP BY GROUPING SETS ((u.run, u.nombre, p.sku, p.nombre), (u.run, u.nombre))
    ORDER BY u.run, GROUPING(p.sku), 6 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.6:
--------------------------------------------------------------------------------




-- 1.7. Estructurar una consulta que consolide el volumen de ventas generadas durante los fines de semana frente a la demanda de los dias habiles.

DROP FUNCTION IF EXISTS fn_ventas_finde_vs_habil(DATE, DATE);
CREATE OR REPLACE FUNCTION fn_ventas_finde_vs_habil(
    p_fecha_inicio DATE,
    p_fecha_fin    DATE
)
RETURNS TABLE (
    tipo_dia        VARCHAR,
    cantidad_ventas BIGINT,
    volumen_ventas  BIGINT,
    ticket_promedio NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    IF p_fecha_inicio > p_fecha_fin THEN
        RAISE EXCEPTION 'La fecha inicial % no puede ser posterior a la final %', p_fecha_inicio, p_fecha_fin;
    END IF;

    RETURN QUERY
    SELECT (CASE WHEN EXTRACT(DOW FROM mp.Fecha) IN (0, 6)
                 THEN 'Fin de semana' ELSE 'Dia habil' END)::VARCHAR,
           COUNT(v.id_venta)::BIGINT,
           COALESCE(SUM(mp.Precio_Total), 0)::BIGINT,
           ROUND(COALESCE(AVG(mp.Precio_Total), 0), 2)::NUMERIC
    FROM venta v
    JOIN Medio_Pago mp ON mp.ID_Venta = v.id_venta
    WHERE mp.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY 1
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.7:
--------------------------------------------------------------------------------




-- 1.8. Calcular la variacion porcentual de los ingresos totales generados en la plataforma entre el mes en curso y el mes inmediatamente anterior.

DROP FUNCTION IF EXISTS fn_variacion_ingresos(DATE);
CREATE OR REPLACE FUNCTION fn_variacion_ingresos(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    periodo              TEXT,
    ingresos             NUMERIC,
    variacion_porcentual NUMERIC
) AS $$
DECLARE
    v_ini_actual   DATE    := date_trunc('month', p_fecha_ref)::DATE;
    v_ini_anterior DATE    := (date_trunc('month', p_fecha_ref) - INTERVAL '1 month')::DATE;
    v_actual       NUMERIC := 0;
    v_anterior     NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(mp.Precio_Total), 0) INTO v_actual
    FROM Medio_Pago mp
    WHERE mp.Fecha >= v_ini_actual
      AND mp.Fecha <  v_ini_actual + INTERVAL '1 month';

    SELECT COALESCE(SUM(mp.Precio_Total), 0) INTO v_anterior
    FROM Medio_Pago mp
    WHERE mp.Fecha >= v_ini_anterior
      AND mp.Fecha <  v_ini_actual;

    IF v_anterior = 0 THEN
        RAISE NOTICE 'El periodo % no registra ingresos, la variacion no es calculable',
                     to_char(v_ini_anterior, 'MM-YYYY');
    END IF;

    RETURN QUERY
    SELECT 'Mes anterior ' || to_char(v_ini_anterior, 'MM-YYYY'), v_anterior, NULL::NUMERIC
    UNION ALL
    SELECT 'Mes en curso ' || to_char(v_ini_actual, 'MM-YYYY'), v_actual,
           CASE WHEN v_anterior = 0 THEN NULL
                ELSE ROUND((v_actual - v_anterior) * 100.0 / v_anterior, 2) END;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.8:
--------------------------------------------------------------------------------




-- 1.9. Seleccionar las ventas procesadas durante el ultimo trimestre que incluyeron la aplicacion de algun descuento sobre el valor bruto total.

DROP FUNCTION IF EXISTS fn_ventas_con_descuento(DATE, INTEGER);
CREATE OR REPLACE FUNCTION fn_ventas_con_descuento(
    p_fecha_ref DATE DEFAULT CURRENT_DATE,
    p_meses     INTEGER DEFAULT 3
)
RETURNS TABLE (
    id_venta         INTEGER,
    fecha_pago       DATE,
    producto         VARCHAR,
    valor_bruto      INTEGER,
    descuento        NUMERIC,
    monto_descontado NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT mp.ID_Venta,
           mp.Fecha,
           p.nombre::VARCHAR,
           mp.Precio_Total,
           o.descuento::NUMERIC,
           ROUND(mp.Precio_Total * o.descuento / 100, 0)
    FROM Medio_Pago mp
    JOIN incluye i     ON i.id_venta = mp.ID_Venta
    JOIN producto p    ON p.sku = i.sku_producto
    JOIN promociona pr ON pr.sku_producto = p.sku
    JOIN oferta o      ON o.id_oferta = pr.id_oferta
    WHERE mp.Fecha >  p_fecha_ref - make_interval(months => p_meses)
      AND mp.Fecha <= p_fecha_ref
      AND mp.Fecha BETWEEN pr.fecha_inicio AND pr.fecha_fin
      AND o.descuento > 0
    ORDER BY mp.Fecha DESC, mp.ID_Venta;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 1.9:
--------------------------------------------------------------------------------




-- ================================================================================
-- 2. GEORREFERENCIACIÓN Y COMPORTAMIENTO LOGÍSTICO
-- ================================================================================
-- 2.1. Realizar una consulta que permita listar las ciudades donde se ha realizado un determinado servicio X.

DROP FUNCTION IF EXISTS fn_ciudades_servicio(VARCHAR);
CREATE OR REPLACE FUNCTION fn_ciudades_servicio(
    p_sku VARCHAR
)
RETURNS TABLE (
    ciudad    VARCHAR,
    provincia VARCHAR,
    servicio  VARCHAR,
    veces     BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF NOT EXISTS (SELECT 1 FROM servicio WHERE sku = p_sku) THEN
        RAISE EXCEPTION 'El servicio % no existe', p_sku;
    END IF;

    RETURN QUERY
    SELECT co.nombre::VARCHAR,
           pr.nombre::VARCHAR,
           s.nombre::VARCHAR,
           COUNT(*)::BIGINT
    FROM servicio s
    JOIN incluye i    ON i.sku_servicio = s.sku
    JOIN considera c  ON c.id_venta = i.id_venta
    JOIN direccion d  ON d.id_direccion = c.codigo_postal
    JOIN comuna co    ON co.id_comuna = d.id_comuna
    JOIN provincia pr ON pr.id_provincia = co.id_provincia
    WHERE s.sku = p_sku
    GROUP BY co.nombre, pr.nombre, s.nombre
    ORDER BY 4 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 2.1:
--------------------------------------------------------------------------------




-- 2.2. Realizar una consulta que permita listar las ciudades donde se ha despachado un determinado producto X.

DROP FUNCTION IF EXISTS fn_ciudades_producto(VARCHAR);
CREATE OR REPLACE FUNCTION fn_ciudades_producto(
    p_sku VARCHAR
)
RETURNS TABLE (
    ciudad    VARCHAR,
    provincia VARCHAR,
    producto  VARCHAR,
    despachos BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF NOT EXISTS (SELECT 1 FROM producto WHERE sku = p_sku) THEN
        RAISE EXCEPTION 'El producto % no existe', p_sku;
    END IF;

    RETURN QUERY
    SELECT co.nombre::VARCHAR,
           pr.nombre::VARCHAR,
           p.nombre::VARCHAR,
           COUNT(DISTINCT des.id_despacho)::BIGINT
    FROM producto p
    JOIN detalle det  ON det.id_producto = p.sku
    JOIN considera c  ON c.id_venta = det.id_venta
    JOIN despacho des ON des.id_despacho = c.id_despacho
    JOIN direccion d  ON d.id_direccion = c.codigo_postal
    JOIN comuna co    ON co.id_comuna = d.id_comuna
    JOIN provincia pr ON pr.id_provincia = co.id_provincia
    WHERE p.sku = p_sku
    GROUP BY co.nombre, pr.nombre, p.nombre
    ORDER BY 4 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 2.2:
--------------------------------------------------------------------------------




-- 2.3. Listar los productos por cada vendedor que tienen despacho pendiente.

DROP FUNCTION IF EXISTS fn_productos_despacho_pendiente(DATE, VARCHAR);
CREATE OR REPLACE FUNCTION fn_productos_despacho_pendiente(
    p_fecha_corte  DATE DEFAULT CURRENT_DATE,
    p_estado_final VARCHAR DEFAULT 'Entregado'
)
RETURNS TABLE (
    vendedor        VARCHAR,
    nombre_vendedor VARCHAR,
    sku             VARCHAR,
    producto        VARCHAR,
    id_despacho     INTEGER,
    estado          VARCHAR,
    fecha_despacho  DATE
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           p.sku::VARCHAR,
           p.nombre::VARCHAR,
           des.id_despacho,
           des.estado::VARCHAR,
           des.fecha
    FROM vende ve
    JOIN usuario u    ON u.run = ve.id_usuario
    JOIN producto p   ON p.sku = ve.id_producto
    JOIN detalle d    ON d.id_producto = p.sku
    JOIN considera c  ON c.id_venta = d.id_venta
    JOIN despacho des ON des.id_despacho = c.id_despacho
    WHERE des.estado <> p_estado_final
      AND des.fecha <= p_fecha_corte
    ORDER BY u.run, p.sku, des.fecha;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 2.3:
--------------------------------------------------------------------------------




-- 2.4. Determinar el tiempo promedio de transito logistico, restando la fecha de llegada real frente a la fecha de salida, agrupado por empresa de transporte.

DROP FUNCTION IF EXISTS fn_transito_promedio_transporte(DATE, DATE);
CREATE OR REPLACE FUNCTION fn_transito_promedio_transporte(
    p_fecha_inicio DATE,
    p_fecha_fin    DATE
)
RETURNS TABLE (
    run_empresa            VARCHAR,
    empresa_transporte     VARCHAR,
    envios                 BIGINT,
    dias_promedio_transito NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    IF p_fecha_inicio > p_fecha_fin THEN
        RAISE EXCEPTION 'La fecha inicial % no puede ser posterior a la final %', p_fecha_inicio, p_fecha_fin;
    END IF;

    RETURN QUERY
    SELECT e.run_empresa::VARCHAR,
           e.nombre::VARCHAR,
           COUNT(*)::BIGINT,
           ROUND(AVG(hc.fecha_fin - hc.fecha_inicio)::NUMERIC, 2)
    FROM empresa_transporte_despacho etd
    JOIN empresa e           ON e.run_empresa = etd.run_empresa
    JOIN despacho des        ON des.id_despacho = etd.id_despacho
    JOIN historial_compra hc ON hc.id_historial = des.id_historial_compra
    WHERE des.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
      AND hc.fecha_fin IS NOT NULL
    GROUP BY e.run_empresa, e.nombre
    ORDER BY 4 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 2.4:
--------------------------------------------------------------------------------




-- 2.5. Identificar las regiones geograficas que concentran el mayor volumen de envios cuyo peso transaccional sea superior a los 10 kilogramos.

DROP FUNCTION IF EXISTS fn_regiones_envios_pesados(NUMERIC);
CREATE OR REPLACE FUNCTION fn_regiones_envios_pesados(
    p_peso_min NUMERIC DEFAULT 10
)
RETURNS TABLE (
    region          VARCHAR,
    cantidad_envios BIGINT,
    peso_total      NUMERIC,
    peso_maximo     NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT r.nombre::VARCHAR,
           COUNT(DISTINCT des.id_despacho)::BIGINT,
           SUM((car.atributos->>'peso')::NUMERIC),
           MAX((car.atributos->>'peso')::NUMERIC)
    FROM region r
    JOIN provincia pr        ON pr.id_region = r.id_region
    JOIN comuna co           ON co.id_provincia = pr.id_provincia
    JOIN direccion d         ON d.id_comuna = co.id_comuna
    JOIN considera c         ON c.codigo_postal = d.id_direccion
    JOIN despacho des        ON des.id_despacho = c.id_despacho
    JOIN detalle det         ON det.id_venta = c.id_venta
    JOIN contiene cont       ON cont.sku_producto = det.id_producto
    JOIN caracteristicas car ON car.id_caracteristicas = cont.id_caracteristicas
    WHERE (car.atributos->>'peso')::NUMERIC > p_peso_min
    GROUP BY r.nombre
    ORDER BY 2 DESC, 3 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 2.5:
--------------------------------------------------------------------------------




-- 2.6. Calcular dinamicamente el costo de envio proyectado basandose en el volumen tridimensional (ancho, alto, fondo) extraido de los datos de despacho.
-- Por indicación del enunciado se implementa como trigger (triggers.txt, trigger 2).




-- 2.7. Listar las comunas donde residen clientes que solicitaron despacho, pero cuya direccion carece de un registro formal de pasaje o sector habitacional.

DROP FUNCTION IF EXISTS fn_comunas_direccion_incompleta(VARIADIC TEXT[]);
CREATE OR REPLACE FUNCTION fn_comunas_direccion_incompleta(
    VARIADIC p_terminos TEXT[]
)
RETURNS TABLE (
    comuna  VARCHAR,
    calle   VARCHAR,
    numero  INTEGER,
    cliente VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    IF array_length(p_terminos, 1) IS NULL THEN
        RAISE EXCEPTION 'Debe indicar al menos un termino de direccion';
    END IF;

    RETURN QUERY
    SELECT DISTINCT co.nombre::VARCHAR,
                    d.calle::VARCHAR,
                    d.numero,
                    u.nombre::VARCHAR
    FROM comuna co
    JOIN direccion d ON d.id_comuna = co.id_comuna
    JOIN usuario u   ON u.run = d.run_usuario
    JOIN considera c ON c.codigo_postal = d.id_direccion
    WHERE u.tipo_cliente = TRUE
      AND NOT EXISTS (
          SELECT 1
          FROM unnest(p_terminos) AS t
          WHERE d.calle LIKE '%' || t || '%'
      )
    ORDER BY 1, 2;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 2.7:
--------------------------------------------------------------------------------




-- ================================================================================
-- 3. FIDELIZACIÓN, VALORACIONES Y DESEMPEÑO COMERCIAL
-- ================================================================================
-- 3.1. Determinar cual es el producto que mas se vende por cada vendedor.

DROP FUNCTION IF EXISTS fn_producto_mas_vendido_vendedor(DATE, DATE);
CREATE OR REPLACE FUNCTION fn_producto_mas_vendido_vendedor(
    p_fecha_inicio DATE,
    p_fecha_fin    DATE
)
RETURNS TABLE (
    vendedor        VARCHAR,
    nombre_vendedor VARCHAR,
    sku             VARCHAR,
    producto        VARCHAR,
    unidades        BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF p_fecha_inicio > p_fecha_fin THEN
        RAISE EXCEPTION 'La fecha inicial % no puede ser posterior a la final %', p_fecha_inicio, p_fecha_fin;
    END IF;

    RETURN QUERY
    SELECT t.run, t.nombre, t.sku, t.producto, t.unidades
    FROM (
        SELECT u.run::VARCHAR                AS run,
               u.nombre::VARCHAR             AS nombre,
               p.sku::VARCHAR                AS sku,
               p.nombre::VARCHAR             AS producto,
               SUM(v.cantidad)::BIGINT       AS unidades,
               RANK() OVER (PARTITION BY u.run ORDER BY SUM(v.cantidad) DESC) AS posicion
        FROM vende ve
        JOIN usuario u     ON u.run = ve.id_usuario
        JOIN producto p    ON p.sku = ve.id_producto
        JOIN detalle d     ON d.id_producto = p.sku
        JOIN venta v       ON v.id_venta = d.id_venta
        JOIN Medio_Pago mp ON mp.ID_Venta = v.id_venta
        WHERE mp.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY u.run, u.nombre, p.sku, p.nombre
    ) t
    WHERE t.posicion = 1
    ORDER BY t.run, t.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.1:
--------------------------------------------------------------------------------




-- 3.2. Determinar cual es el servicio que mas se contrata por cada vendedor.

DROP FUNCTION IF EXISTS fn_servicio_mas_contratado_vendedor(DATE, DATE);
CREATE OR REPLACE FUNCTION fn_servicio_mas_contratado_vendedor(
    p_fecha_inicio DATE,
    p_fecha_fin    DATE
)
RETURNS TABLE (
    vendedor     VARCHAR,
    empresa      VARCHAR,
    sku          VARCHAR,
    servicio     VARCHAR,
    contratos    BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF p_fecha_inicio > p_fecha_fin THEN
        RAISE EXCEPTION 'La fecha inicial % no puede ser posterior a la final %', p_fecha_inicio, p_fecha_fin;
    END IF;

    RETURN QUERY
    SELECT t.run_empresa, t.nombre, t.sku, t.servicio, t.contratos
    FROM (
        SELECT e.run_empresa::VARCHAR        AS run_empresa,
               e.nombre::VARCHAR             AS nombre,
               s.sku::VARCHAR                AS sku,
               s.nombre::VARCHAR             AS servicio,
               COUNT(a.id_venta)::BIGINT     AS contratos,
               RANK() OVER (PARTITION BY e.run_empresa ORDER BY COUNT(a.id_venta) DESC) AS posicion
        FROM asocia a
        JOIN empresa e     ON e.run_empresa = a.id_empresa
        JOIN servicio s    ON s.sku = a.id_servicio
        JOIN Medio_Pago mp ON mp.ID_Venta = a.id_venta
        WHERE mp.Fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY e.run_empresa, e.nombre, s.sku, s.nombre
    ) t
    WHERE t.posicion = 1
    ORDER BY t.run_empresa, t.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.2:
--------------------------------------------------------------------------------




-- 3.3. Calcular la cantidad de consultas sin responder de un producto.

DROP FUNCTION IF EXISTS fn_consultas_sin_responder(VARCHAR, VARIADIC TEXT[]);
CREATE OR REPLACE FUNCTION fn_consultas_sin_responder(
    p_patron_respuesta VARCHAR,
    VARIADIC p_skus    TEXT[]
)
RETURNS TABLE (
    sku                     VARCHAR,
    producto                VARCHAR,
    consultas               BIGINT,
    consultas_sin_responder BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           COUNT(m.id_mensajeria)::BIGINT,
           COUNT(m.id_mensajeria) FILTER (
               WHERE NOT EXISTS (
                   SELECT 1
                   FROM preguntar pr2
                   JOIN mensajeria r ON r.id_mensajeria = pr2.id_mensajeria
                   WHERE pr2.id_producto = p.sku
                     AND r.comentario LIKE p_patron_respuesta
                     AND r.fecha >= m.fecha
                     AND r.id_mensajeria <> m.id_mensajeria
               )
           )::BIGINT
    FROM producto p
    JOIN preguntar pr ON pr.id_producto = p.sku
    JOIN mensajeria m ON m.id_mensajeria = pr.id_mensajeria
    WHERE p.sku = ANY (p_skus)
      AND m.comentario NOT LIKE p_patron_respuesta
    GROUP BY p.sku, p.nombre
    ORDER BY 4 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.3:
--------------------------------------------------------------------------------




-- 3.4. Listar los productos de un vendedor X que tienen calificacion de 4 o mas.

DROP FUNCTION IF EXISTS fn_productos_por_calificacion(VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_productos_por_calificacion(
    p_run_vendedor VARCHAR,
    p_puntaje_min  INTEGER DEFAULT 4
)
RETURNS TABLE (
    sku        VARCHAR,
    producto   VARCHAR,
    puntaje    INTEGER,
    comentario TEXT
) AS $$
#variable_conflict use_column
BEGIN
    IF p_puntaje_min < 1 OR p_puntaje_min > 5 THEN
        RAISE EXCEPTION 'El puntaje minimo debe estar entre 1 y 5, se recibio %', p_puntaje_min;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM usuario WHERE run = p_run_vendedor AND tipo_emprendedor = TRUE) THEN
        RAISE EXCEPTION 'El vendedor % no existe', p_run_vendedor;
    END IF;

    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           r.puntaje,
           r.comentario::TEXT
    FROM vende ve
    JOIN producto p ON p.sku = ve.id_producto
    JOIN reseñar re ON re.id_producto = p.sku
    JOIN reseña r   ON r.numero_reseña = re.id_reseña
    WHERE ve.id_usuario = p_run_vendedor
      AND r.puntaje >= p_puntaje_min
    ORDER BY r.puntaje DESC, p.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.4:
--------------------------------------------------------------------------------




-- 3.5. Listar los emprendedores que posean calificaciones en promedio menores a 3.

DROP FUNCTION IF EXISTS fn_emprendedores_bajo_promedio(NUMERIC);
CREATE OR REPLACE FUNCTION fn_emprendedores_bajo_promedio(
    p_promedio_max NUMERIC DEFAULT 3
)
RETURNS TABLE (
    run                   VARCHAR,
    nombre                VARCHAR,
    resenas               BIGINT,
    promedio_calificacion NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           COUNT(r.numero_reseña)::BIGINT,
           ROUND(AVG(r.puntaje)::NUMERIC, 2)
    FROM usuario u
    JOIN vende ve   ON ve.id_usuario = u.run
    JOIN reseñar re ON re.id_producto = ve.id_producto
    JOIN reseña r   ON r.numero_reseña = re.id_reseña
    WHERE u.tipo_emprendedor = TRUE
    GROUP BY u.run, u.nombre
    HAVING AVG(r.puntaje) < p_promedio_max
    ORDER BY 4, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.5:
--------------------------------------------------------------------------------




-- 3.6. Identificar a los emprendedores que no han recibido ninguna calificacion en sus servicios durante el ultimo semestre, utilizando operadores de validacion nula.

DROP FUNCTION IF EXISTS fn_emprendedores_sin_calificacion(DATE, INTEGER);
CREATE OR REPLACE FUNCTION fn_emprendedores_sin_calificacion(
    p_fecha_ref DATE DEFAULT CURRENT_DATE,
    p_meses     INTEGER DEFAULT 6
)
RETURNS TABLE (
    run                 VARCHAR,
    nombre              VARCHAR,
    empresa             VARCHAR,
    servicios_vendidos  BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           e.nombre::VARCHAR,
           COUNT(DISTINCT a.id_servicio)::BIGINT
    FROM usuario u
    JOIN empresa e     ON e.run_empresa = u.run_empresa
    JOIN asocia a      ON a.id_empresa = e.run_empresa
    JOIN Medio_Pago mp ON mp.ID_Venta = a.id_venta
    WHERE u.tipo_emprendedor = TRUE
      AND mp.Fecha >  p_fecha_ref - make_interval(months => p_meses)
      AND mp.Fecha <= p_fecha_ref
      AND NOT EXISTS (
          SELECT 1
          FROM critica cr
          WHERE cr.id_servicio = a.id_servicio
      )
    GROUP BY u.run, u.nombre, e.nombre
    ORDER BY 4 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.6:
--------------------------------------------------------------------------------




-- 3.7. Extraer las resenas textuales de productos que contengan palabras clave asociadas a calidad como excelente, recomendado o deficiente, usando el operador LIKE.

DROP FUNCTION IF EXISTS fn_resenas_por_palabra(VARIADIC TEXT[]);
CREATE OR REPLACE FUNCTION fn_resenas_por_palabra(
    VARIADIC p_palabras TEXT[]
)
RETURNS TABLE (
    numero_resena INTEGER,
    producto      VARCHAR,
    puntaje       INTEGER,
    comentario    TEXT
) AS $$
#variable_conflict use_column
BEGIN
    IF array_length(p_palabras, 1) IS NULL THEN
        RAISE EXCEPTION 'Debe indicar al menos una palabra clave';
    END IF;

    RETURN QUERY
    SELECT r.numero_reseña,
           p.nombre::VARCHAR,
           r.puntaje,
           r.comentario::TEXT
    FROM reseña r
    JOIN reseñar re ON re.id_reseña = r.numero_reseña
    JOIN producto p ON p.sku = re.id_producto
    WHERE EXISTS (
        SELECT 1
        FROM unnest(p_palabras) AS palabra
        WHERE lower(r.comentario) LIKE '%' || lower(palabra) || '%'
    )
    ORDER BY r.puntaje DESC, r.numero_reseña;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.7:
--------------------------------------------------------------------------------




-- 3.8. Determinar que clientes han emitido mas de diez calificaciones historicas en la plataforma, ordenando su participacion de manera descendente.

DROP FUNCTION IF EXISTS fn_clientes_top_calificaciones(INTEGER);
CREATE OR REPLACE FUNCTION fn_clientes_top_calificaciones(
    p_minimo INTEGER DEFAULT 10
)
RETURNS TABLE (
    run                  VARCHAR,
    nombre               VARCHAR,
    total_calificaciones BIGINT,
    puntaje_promedio     NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           COUNT(r.numero_reseña)::BIGINT,
           ROUND(AVG(r.puntaje)::NUMERIC, 2)
    FROM usuario u
    JOIN reseña r ON r.run_usuario = u.run
    WHERE u.tipo_cliente = TRUE
    GROUP BY u.run, u.nombre
    HAVING COUNT(r.numero_reseña) > p_minimo
    ORDER BY 3 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.8:
--------------------------------------------------------------------------------




-- 3.9. Calcular el tiempo de respuesta promedio que toma un emprendedor en contestar las preguntas publicas formuladas por los potenciales demandantes.

DROP FUNCTION IF EXISTS fn_tiempo_respuesta_promedio(VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_tiempo_respuesta_promedio(
    p_patron_respuesta VARCHAR,
    p_fecha_inicio     DATE,
    p_fecha_fin        DATE
)
RETURNS TABLE (
    run_empresa             VARCHAR,
    empresa                 VARCHAR,
    preguntas               BIGINT,
    respondidas             BIGINT,
    dias_promedio_respuesta NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    IF p_fecha_inicio > p_fecha_fin THEN
        RAISE EXCEPTION 'La fecha inicial % no puede ser posterior a la final %', p_fecha_inicio, p_fecha_fin;
    END IF;

    RETURN QUERY
    SELECT e.run_empresa::VARCHAR,
           e.nombre::VARCHAR,
           COUNT(*)::BIGINT,
           COUNT(resp.fecha)::BIGINT,
           ROUND(AVG(resp.fecha - q.fecha)::NUMERIC, 2)
    FROM preguntar pr
    JOIN mensajeria q ON q.id_mensajeria = pr.id_mensajeria
    JOIN empresa e    ON e.run_empresa = q.run_empresa
    LEFT JOIN LATERAL (
        SELECT r.fecha
        FROM preguntar pr2
        JOIN mensajeria r ON r.id_mensajeria = pr2.id_mensajeria
        WHERE pr2.id_producto = pr.id_producto
          AND r.run_empresa = q.run_empresa
          AND r.comentario LIKE p_patron_respuesta
          AND r.fecha >= q.fecha
        ORDER BY r.fecha
        LIMIT 1
    ) AS resp ON TRUE
    WHERE q.comentario NOT LIKE p_patron_respuesta
      AND q.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY e.run_empresa, e.nombre
    ORDER BY 5 NULLS LAST, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.9:
--------------------------------------------------------------------------------




-- 3.10. Listar las interacciones de mensajeria interna entre cliente y vendedor que superen el umbral de las 48 horas sin una replica registrada.

DROP FUNCTION IF EXISTS fn_mensajeria_sin_replica(DATE, INTEGER);
CREATE OR REPLACE FUNCTION fn_mensajeria_sin_replica(
    p_fecha_ref DATE DEFAULT CURRENT_DATE,
    p_horas     INTEGER DEFAULT 48
)
RETURNS TABLE (
    id_mensajeria      INTEGER,
    fecha              DATE,
    dias_sin_respuesta INTEGER,
    cliente            VARCHAR,
    vendedor           VARCHAR,
    comentario         TEXT
) AS $$
#variable_conflict use_column
DECLARE
    v_dias INTEGER := GREATEST(p_horas / 24, 1);
BEGIN
    RETURN QUERY
    SELECT m.id_mensajeria,
           m.fecha,
           (p_fecha_ref - m.fecha)::INTEGER,
           u.nombre::VARCHAR,
           e.nombre::VARCHAR,
           m.comentario::TEXT
    FROM mensajeria m
    JOIN consultar c ON c.id_mensajeria = m.id_mensajeria
    JOIN usuario u   ON u.run = c.run_usuario
    JOIN empresa e   ON e.run_empresa = m.run_empresa
    WHERE (p_fecha_ref - m.fecha) > v_dias
      AND NOT EXISTS (
          SELECT 1
          FROM mensajeria m2
          WHERE m2.run_empresa = m.run_empresa
            AND m2.fecha > m.fecha
            AND (m2.fecha - m.fecha) <= v_dias
      )
    ORDER BY 3 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 3.10:
--------------------------------------------------------------------------------
-- ================================================================================
-- 4. MANIPULACIÓN ESTRUCTURAL DE ATRIBUTOS JSON
-- ================================================================================
-- 4.1. Extraer el valor especifico del Material principal desde el atributo JSON de caracteristicas para todos los productos pertenecientes a la categoria de vestuario.

DROP FUNCTION IF EXISTS fn_material_producto_categoria(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_material_producto_categoria(
    p_atributo  VARCHAR DEFAULT 'material',
    p_categoria VARCHAR DEFAULT 'Cat_0001'
)
RETURNS TABLE (
    sku                VARCHAR,
    producto           VARCHAR,
    material_principal TEXT,
    categoria          VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           (car.atributos->>p_atributo)::TEXT,
           cat.nombre::VARCHAR
    FROM producto p
    JOIN pertenece pe        ON pe.id_producto = p.sku
    JOIN categoria cat       ON cat.nombre = pe.nombre_categoria
    JOIN contiene c          ON c.sku_producto = p.sku
    JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
    WHERE cat.nombre = p_categoria
      AND (car.atributos->>p_atributo) IS NOT NULL
    ORDER BY p.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 4.1:
--------------------------------------------------------------------------------




-- 4.2. Filtrar los servicios profesionales cuyo campo JSON estructurado contenga una restriccion explicita de Modalidad: Remoto.

DROP FUNCTION IF EXISTS fn_servicios_por_atributo_json(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_servicios_por_atributo_json(
    p_clave VARCHAR DEFAULT 'modalidad',
    p_valor VARCHAR DEFAULT 'Remoto'
)
RETURNS TABLE (
    sku      VARCHAR,
    servicio VARCHAR,
    valor    TEXT,
    tiempo   INTEGER
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT s.sku::VARCHAR,
           s.nombre::VARCHAR,
           (s.atributos->>p_clave)::TEXT,
           s.tiempo
    FROM servicio s
    WHERE (s.atributos->>p_clave) = p_valor
    ORDER BY s.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 4.2:
--------------------------------------------------------------------------------




-- 4.3. Calcular el peso promedio de los productos disponibles en inventario, accediendo y operando directamente el nodo numerico correspondiente dentro de su estructura JSON.

DROP FUNCTION IF EXISTS fn_peso_inventario(INTEGER);
CREATE OR REPLACE FUNCTION fn_peso_inventario(
    p_stock_min INTEGER DEFAULT 1
)
RETURNS TABLE (
    sku                  VARCHAR,
    producto             VARCHAR,
    peso                 NUMERIC,
    stock                INTEGER,
    peso_promedio_global NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           (car.atributos->>'peso')::NUMERIC,
           st.cantidad,
           ROUND(AVG((car.atributos->>'peso')::NUMERIC) OVER (), 3)
    FROM producto p
    JOIN contiene c          ON c.sku_producto = p.sku
    JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
    JOIN stock st            ON st.id_stock = car.id_stock
    WHERE st.cantidad >= p_stock_min
      AND (car.atributos->>'peso') IS NOT NULL
    ORDER BY 3 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 4.3:
--------------------------------------------------------------------------------




-- 4.4. Identificar aquellos productos tecnologicos donde el arreglo JSON de caracteristicas carezca por completo de la llave algoritmica correspondiente a Garantia.

DROP FUNCTION IF EXISTS fn_productos_sin_llave_json(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_productos_sin_llave_json(
    p_llave     VARCHAR DEFAULT 'garantia',
    p_categoria VARCHAR DEFAULT 'Cat_0001'
)
RETURNS TABLE (
    sku              VARCHAR,
    producto         VARCHAR,
    marca            VARCHAR,
    llaves_presentes TEXT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           p.marca::VARCHAR,
           (SELECT string_agg(k, ', ' ORDER BY k)
            FROM jsonb_object_keys(car.atributos::JSONB) AS k)::TEXT
    FROM producto p
    JOIN contiene c          ON c.sku_producto = p.sku
    JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
    JOIN pertenece pe        ON pe.id_producto = p.sku
    WHERE pe.nombre_categoria = p_categoria
      AND NOT jsonb_exists(car.atributos::JSONB, p_llave)
    ORDER BY p.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 4.4:
--------------------------------------------------------------------------------




-- 4.5. Elaborar una vista que desnormalice las variantes de color y tamano alojadas en el JSON, transformandolas en columnas relacionales independientes de facil lectura.

DROP FUNCTION IF EXISTS fn_variantes_producto(VARCHAR);
CREATE OR REPLACE FUNCTION fn_variantes_producto(
    p_color VARCHAR DEFAULT 'Rojo'
)
RETURNS TABLE (
    sku      VARCHAR,
    producto VARCHAR,
    color    TEXT,
    talla    TEXT,
    material TEXT,
    peso     NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           (car.atributos->>'color')::TEXT,
           (car.atributos->>'talla')::TEXT,
           (car.atributos->>'material')::TEXT,
           (car.atributos->>'peso')::NUMERIC
    FROM producto p
    JOIN contiene c          ON c.sku_producto = p.sku
    JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
    WHERE car.atributos->>'color' = p_color
    ORDER BY p.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 4.5:
--------------------------------------------------------------------------------




-- 4.6. Listar los productos cuyas dimensiones fisicas declaradas en el atributo JSON superen los estandares maximos volumetricos permitidos por las empresas logisticas.

DROP FUNCTION IF EXISTS fn_productos_sobre_volumen(NUMERIC);
CREATE OR REPLACE FUNCTION fn_productos_sobre_volumen(
    p_peso_max NUMERIC DEFAULT 10
)
RETURNS TABLE (
    sku            VARCHAR,
    producto       VARCHAR,
    talla          TEXT,
    peso           NUMERIC,
    costo_despacho INTEGER
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT DISTINCT
           p.sku::VARCHAR,
           p.nombre::VARCHAR,
           (car.atributos->>'talla')::TEXT,
           (car.atributos->>'peso')::NUMERIC,
           des.precio
    FROM producto p
    JOIN contiene c          ON c.sku_producto = p.sku
    JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
    JOIN detalle d           ON d.id_producto = p.sku
    JOIN considera co        ON co.id_venta = d.id_venta
    JOIN despacho des        ON des.id_despacho = co.id_despacho
    WHERE (car.atributos->>'peso')::NUMERIC > p_peso_max
    ORDER BY 4 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 4.6:
--------------------------------------------------------------------------------




-- ================================================================================
-- 5. EXCLUSIÓN, CONJUNTOS Y CONSULTAS CORRELACIONADAS
-- ================================================================================
-- 5.1. Liste los servicios que no se han contratado en el mes X.

DROP FUNCTION IF EXISTS fn_servicios_no_contratados(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_servicios_no_contratados(
    p_anio INTEGER,
    p_mes  INTEGER
)
RETURNS TABLE (
    sku      VARCHAR,
    servicio VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    IF p_mes < 1 OR p_mes > 12 THEN
        RAISE EXCEPTION 'El mes % no es valido', p_mes;
    END IF;

    RETURN QUERY
    SELECT s.sku::VARCHAR,
           s.nombre::VARCHAR
    FROM servicio s
    WHERE s.sku NOT IN (
        SELECT i.sku_servicio
        FROM incluye i
        WHERE i.sku_servicio IS NOT NULL
          AND i.id_venta IN (
              SELECT mp.ID_Venta
              FROM Medio_Pago mp
              WHERE EXTRACT(YEAR FROM mp.Fecha) = p_anio
                AND EXTRACT(MONTH FROM mp.Fecha) = p_mes
          )
    )
    ORDER BY s.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.1:
--------------------------------------------------------------------------------




-- 5.2. Total de los pedidos por vendedor X y a su vez por categorias Y de articulos.

DROP FUNCTION IF EXISTS fn_pedidos_vendedor_categoria(VARCHAR);
CREATE OR REPLACE FUNCTION fn_pedidos_vendedor_categoria(
    p_run_vendedor VARCHAR
)
RETURNS TABLE (
    vendedor      VARCHAR,
    nombre        VARCHAR,
    categoria     VARCHAR,
    total_pedidos BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE run = p_run_vendedor AND tipo_emprendedor = TRUE) THEN
        RAISE EXCEPTION 'El vendedor % no existe', p_run_vendedor;
    END IF;

    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           cat.nombre::VARCHAR,
           COUNT(det.id_venta)::BIGINT
    FROM vende ve
    JOIN usuario u     ON u.run = ve.id_usuario
    JOIN producto p    ON p.sku = ve.id_producto
    JOIN pertenece pe  ON pe.id_producto = p.sku
    JOIN categoria cat ON cat.nombre = pe.nombre_categoria
    JOIN detalle det   ON det.id_producto = p.sku
    WHERE u.run = p_run_vendedor
    GROUP BY u.run, u.nombre, cat.nombre
    ORDER BY 4 DESC, 3;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.2:
--------------------------------------------------------------------------------




-- 5.3. Listado de clientes a los que un vendedor X ha realizado un negocio.

DROP FUNCTION IF EXISTS fn_clientes_de_vendedor(VARCHAR);
CREATE OR REPLACE FUNCTION fn_clientes_de_vendedor(
    p_run_vendedor VARCHAR
)
RETURNS TABLE (
    run     VARCHAR,
    cliente VARCHAR,
    ventas  BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE run = p_run_vendedor) THEN
        RAISE EXCEPTION 'El vendedor % no existe', p_run_vendedor;
    END IF;

    RETURN QUERY
    SELECT cli.run::VARCHAR,
           cli.nombre::VARCHAR,
           COUNT(DISTINCT c.id_venta)::BIGINT
    FROM vende ve
    JOIN detalle det ON det.id_producto = ve.id_producto
    JOIN compra c    ON c.id_venta = det.id_venta
    JOIN usuario cli ON cli.run = c.run_usuario
    WHERE ve.id_usuario = p_run_vendedor
    GROUP BY cli.run, cli.nombre
    ORDER BY 3 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.3:
--------------------------------------------------------------------------------




-- 5.4. Identificar a los usuarios registrados que cumplen el rol dual de clientes y emprendedores simultaneamente, validando su existencia cruzada mediante subconsultas anidadas.

DROP FUNCTION IF EXISTS fn_usuarios_rol_dual();
CREATE OR REPLACE FUNCTION fn_usuarios_rol_dual()
RETURNS TABLE (
    run    VARCHAR,
    nombre VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR
    FROM usuario u
    WHERE u.tipo_cliente = TRUE
      AND u.tipo_emprendedor = TRUE
      AND u.run IN (SELECT c.run_usuario FROM compra c)
      AND u.run IN (SELECT ve.id_usuario FROM vende ve)
    ORDER BY u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.4:
--------------------------------------------------------------------------------




-- 5.5. Extraer mediante la clausula NOT IN a los clientes activos que poseen productos en su lista de deseos pero que nunca han concretado una operacion de compra.

DROP FUNCTION IF EXISTS fn_clientes_wishlist_sin_compra();
CREATE OR REPLACE FUNCTION fn_clientes_wishlist_sin_compra()
RETURNS TABLE (
    run                 VARCHAR,
    nombre              VARCHAR,
    nombre_lista_deseos VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           (SELECT cr.nombre_lista_deseos
            FROM crear cr
            WHERE cr.run_usuario = u.run
            LIMIT 1)::VARCHAR
    FROM usuario u
    WHERE u.tipo_cliente = TRUE
      AND EXISTS (
          SELECT 1
          FROM crear cr, añadir a
          WHERE cr.run_usuario = u.run
            AND a.nombre_lista_deseos = cr.nombre_lista_deseos
      )
      AND u.run NOT IN (SELECT c.run_usuario FROM compra c)
    ORDER BY u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.5:
--------------------------------------------------------------------------------




-- 5.6. Determinar que categorias principales de la plataforma no poseen subcategorias asociadas ni productos vinculados, empleando la clausula NOT EXISTS.

DROP FUNCTION IF EXISTS fn_categorias_sin_vinculos();
CREATE OR REPLACE FUNCTION fn_categorias_sin_vinculos()
RETURNS TABLE (
    categoria VARCHAR,
    tipo      VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT cat.nombre::VARCHAR,
           cat.tipo::VARCHAR
    FROM categoria cat
    WHERE NOT EXISTS (
              SELECT 1
              FROM subdivide s
              WHERE s.nombre_a_categoria = cat.nombre
          )
      AND NOT EXISTS (
              SELECT 1
              FROM pertenece p
              WHERE p.nombre_categoria = cat.nombre
          )
    ORDER BY cat.nombre;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.6:
--------------------------------------------------------------------------------




-- 5.7. Formular una division relacional que identifique a los clientes que han adquirido al menos un producto de cada categoria principal disponible en el sistema.
CREATE OR REPLACE FUNCTION fn_clientes_todas_categorias(
    p_tipo VARCHAR DEFAULT 'Producto'
)
RETURNS TABLE (
    run    VARCHAR,
    nombre VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR
    FROM usuario u
    WHERE u.tipo_cliente = TRUE
      AND NOT EXISTS (
          SELECT cat.nombre
          FROM categoria cat
          WHERE cat.tipo = p_tipo
            AND cat.nombre IN ('Cat_0120')
            AND NOT EXISTS (
                SELECT 1
                FROM compra c
                JOIN incluye i ON i.id_venta = c.id_venta
                JOIN pertenece pe ON pe.id_producto = i.sku_producto
                WHERE c.run_usuario = u.run
                  AND pe.nombre_categoria = cat.nombre
            )
      )
    ORDER BY u.run;
END;
$$ LANGUAGE plpgsql;
--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.7:
--------------------------------------------------------------------------------




-- 5.8. Seleccionar los servicios profesionales que son ofrecidos en multiples regiones geograficas de manera simultanea, agrupando por identificador y filtrando con HAVING.

DROP FUNCTION IF EXISTS fn_servicios_multiples_regiones(INTEGER);
CREATE OR REPLACE FUNCTION fn_servicios_multiples_regiones(
    p_min_regiones INTEGER DEFAULT 1
)
RETURNS TABLE (
    sku               VARCHAR,
    servicio          VARCHAR,
    cantidad_regiones BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT s.sku::VARCHAR,
           s.nombre::VARCHAR,
           COUNT(DISTINCT r.id_region)::BIGINT
    FROM servicio s
    JOIN asocia a    ON a.id_servicio = s.sku
    JOIN empresa e   ON e.run_empresa = a.id_empresa
    JOIN direccion d ON d.run_empresa = e.run_empresa
    JOIN comuna co   ON co.id_comuna = d.id_comuna
    JOIN provincia pr ON pr.id_provincia = co.id_provincia
    JOIN region r    ON r.id_region = pr.id_region
    GROUP BY s.sku, s.nombre
    HAVING COUNT(DISTINCT r.id_region) >= p_min_regiones
    ORDER BY 3 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.8:
--------------------------------------------------------------------------------




-- 5.9. Identificar correlaciones transaccionales determinando que productos son frecuentemente adquiridos de manera conjunta en una misma orden de compra.

DROP FUNCTION IF EXISTS fn_productos_comprados_juntos();
CREATE OR REPLACE FUNCTION fn_productos_comprados_juntos()
RETURNS TABLE (
    producto_a    VARCHAR,
    producto_b    VARCHAR,
    veces_juntos  BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT i1.sku_producto::VARCHAR,
           i2.sku_producto::VARCHAR,
           COUNT(*)::BIGINT
    FROM incluye i1
    JOIN incluye i2 ON i2.id_venta = i1.id_venta
                   AND i2.sku_producto > i1.sku_producto
    GROUP BY i1.sku_producto, i2.sku_producto
    HAVING COUNT(*) > 1
    ORDER BY 3 DESC, 1, 2;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 5.9:
--------------------------------------------------------------------------------




-- ================================================================================
-- 6. INVENTARIO, COTIZACIONES Y RETORNOS FINANCIEROS
-- ================================================================================
-- 6.1. Listar los productos que han tenido devoluciones por cliente e indicar el motivo.

DROP FUNCTION IF EXISTS fn_devoluciones_por_cliente();
CREATE OR REPLACE FUNCTION fn_devoluciones_por_cliente()
RETURNS TABLE (
    run      VARCHAR,
    cliente  VARCHAR,
    sku      VARCHAR,
    producto VARCHAR,
    motivo   TEXT,
    fecha    DATE,
    estado   VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           p.sku::VARCHAR,
           p.nombre::VARCHAR,
           dev.motivo::TEXT,
           dev.fecha,
           dev.estado::VARCHAR
    FROM devolucion dev
    JOIN ejerce ej     ON ej.id_devolucion = dev.id_devolucion
    JOIN usuario u     ON u.run = ej.run_usuario
    JOIN considera c   ON c.id_despacho = dev.id_despacho
    JOIN detalle det   ON det.id_venta = c.id_venta
    JOIN producto p    ON p.sku = det.id_producto
    ORDER BY dev.fecha DESC, u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.1:
--------------------------------------------------------------------------------




-- 6.2. Listar los productos que poseen ofertas vigentes e indicar el precio original y el actual.

DROP FUNCTION IF EXISTS fn_productos_oferta_vigente(DATE);
CREATE OR REPLACE FUNCTION fn_productos_oferta_vigente(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    sku             VARCHAR,
    producto        VARCHAR,
    precio_original MONEY,
    descuento       NUMERIC,
    precio_actual   NUMERIC,
    fecha_inicio    DATE,
    fecha_fin       DATE
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           ve.precio,
           o.descuento,
           ROUND((ve.precio::NUMERIC * (1 - o.descuento / 100.0)), 2),
           pr.fecha_inicio,
           pr.fecha_fin
    FROM producto p
    JOIN promociona pr ON pr.sku_producto = p.sku
    JOIN oferta o      ON o.id_oferta = pr.id_oferta
    JOIN vende ve      ON ve.id_producto = p.sku
    WHERE pr.fecha_inicio <= p_fecha_ref
      AND pr.fecha_fin    >= p_fecha_ref
    ORDER BY p.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.2:
--------------------------------------------------------------------------------




-- 6.3. Cuantificar el volumen total de capital reintegrado a traves del sistema de devoluciones y reembolsos durante el anio fiscal en curso.

DROP FUNCTION IF EXISTS fn_capital_reintegrado(INTEGER);
CREATE OR REPLACE FUNCTION fn_capital_reintegrado(
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
    anio               INTEGER,
    run_empresa        VARCHAR,
    empresa            VARCHAR,
    capital_reintegrado BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT EXTRACT(YEAR FROM dev.fecha)::INTEGER,
           e.run_empresa::VARCHAR,
           e.nombre::VARCHAR,
           SUM(mp.Precio_Total)::BIGINT
    FROM devolucion dev
    JOIN ejerce ej     ON ej.id_devolucion = dev.id_devolucion
    JOIN Medio_Pago mp ON mp.ID_Venta = ej.id_venta
    JOIN detalle det   ON det.id_venta = ej.id_venta
    JOIN empresa e     ON e.run_empresa = det.id_empresa
    WHERE EXTRACT(YEAR FROM dev.fecha) = p_anio
      AND dev.estado = 'Aprobada'
    GROUP BY EXTRACT(YEAR FROM dev.fecha), e.run_empresa, e.nombre
    ORDER BY 4 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.3:
--------------------------------------------------------------------------------




-- 6.4. Listar los articulos alojados en listas de deseos de clientes cuya oferta temporal de descuento finaliza en las proximas 24 horas.

DROP FUNCTION IF EXISTS fn_wishlist_oferta_por_vencer(DATE);
CREATE OR REPLACE FUNCTION fn_wishlist_oferta_por_vencer(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    nombre_lista_deseos VARCHAR,
    sku                 VARCHAR,
    producto            VARCHAR,
    fecha_fin           DATE,
    descuento           NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT a.nombre_lista_deseos::VARCHAR,
           p.sku::VARCHAR,
           p.nombre::VARCHAR,
           pr.fecha_fin,
           o.descuento
    FROM añadir a
    JOIN producto p    ON p.sku = a.sku_producto
    JOIN promociona pr ON pr.sku_producto = p.sku
    JOIN oferta o      ON o.id_oferta = pr.id_oferta
    WHERE pr.fecha_fin >= p_fecha_ref
      AND pr.fecha_fin <= p_fecha_ref + INTERVAL '1 day'
    ORDER BY pr.fecha_fin, p.sku;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.4:
--------------------------------------------------------------------------------




-- 6.5. Calcular la tasa porcentual de devoluciones por cada emprendedor, contrastando sus transacciones exitosas contra las reversas formales aprobadas.

DROP FUNCTION IF EXISTS fn_tasa_devoluciones_emprendedor();
CREATE OR REPLACE FUNCTION fn_tasa_devoluciones_emprendedor()
RETURNS TABLE (
    run_empresa            VARCHAR,
    empresa                VARCHAR,
    ventas_totales         BIGINT,
    devoluciones_aprobadas BIGINT,
    tasa_devolucion        NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT e.run_empresa::VARCHAR,
           e.nombre::VARCHAR,
           (SELECT COUNT(DISTINCT det.id_venta)
            FROM detalle det
            WHERE det.id_empresa = e.run_empresa)::BIGINT,
           (SELECT COUNT(*)
            FROM ejerce ej, devolucion dev, detalle det2
            WHERE dev.id_devolucion = ej.id_devolucion
              AND det2.id_venta = ej.id_venta
              AND det2.id_empresa = e.run_empresa
              AND dev.estado = 'Aprobada')::BIGINT,
           ROUND((
               (SELECT COUNT(*)
                FROM ejerce ej, devolucion dev, detalle det2
                WHERE dev.id_devolucion = ej.id_devolucion
                  AND det2.id_venta = ej.id_venta
                  AND det2.id_empresa = e.run_empresa
                  AND dev.estado = 'Aprobada') * 100.0
               / NULLIF((SELECT COUNT(DISTINCT det.id_venta)
                         FROM detalle det
                         WHERE det.id_empresa = e.run_empresa), 0)
           ), 2)
    FROM empresa e
    WHERE EXISTS (SELECT 1 FROM detalle det WHERE det.id_empresa = e.run_empresa)
    ORDER BY 5 DESC NULLS LAST, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.5:
--------------------------------------------------------------------------------




-- 6.6. Determinar que productos del catalogo presentan mas de tres variantes de color y mantienen un inventario consolidado superior a las cincuenta unidades.

DROP FUNCTION IF EXISTS fn_productos_variantes_inventario(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_productos_variantes_inventario(
    p_min_colores INTEGER DEFAULT 1,
    p_stock_min   INTEGER DEFAULT 50
)
RETURNS TABLE (
    sku             VARCHAR,
    producto        VARCHAR,
    variantes_color BIGINT,
    inventario      BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           COUNT(DISTINCT (car.atributos->>'color'))::BIGINT,
           SUM(st.cantidad)::BIGINT
    FROM producto p
    JOIN contiene c          ON c.sku_producto = p.sku
    JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
    JOIN stock st            ON st.id_stock = car.id_stock
    GROUP BY p.sku, p.nombre
    HAVING COUNT(DISTINCT (car.atributos->>'color')) > p_min_colores
       AND SUM(st.cantidad) > p_stock_min
    ORDER BY 3 DESC, 4 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.6:
--------------------------------------------------------------------------------




-- 6.7. Identificar retrospectivamente las ventas canceladas donde el medio de pago original de la transaccion correspondia a una transferencia electronica.

DROP FUNCTION IF EXISTS fn_ventas_canceladas_transferencia(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ventas_canceladas_transferencia(
    p_medio  VARCHAR DEFAULT 'Transferencia',
    p_estado VARCHAR DEFAULT 'Pendiente'
)
RETURNS TABLE (
    id_venta        INTEGER,
    medio_pago      VARCHAR,
    fecha           DATE,
    estado_historial VARCHAR,
    estado_despacho VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT v.id_venta,
           mp.Medio_Pago::VARCHAR,
           mp.Fecha,
           g.estado::VARCHAR,
           des.estado::VARCHAR
    FROM venta v
    JOIN paga pg       ON pg.id_venta = v.id_venta
    JOIN Medio_Pago mp ON mp.Codigo_Transferencia = pg.medio_pago
    JOIN genera g      ON g.id_medio_pago = mp.Codigo_Transferencia
    JOIN considera c   ON c.id_venta = v.id_venta
    JOIN despacho des  ON des.id_despacho = c.id_despacho
    WHERE mp.Medio_Pago = p_medio
      AND g.estado = p_estado
    ORDER BY mp.Fecha, v.id_venta;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.7:
--------------------------------------------------------------------------------




-- 6.8. Disenar una vista de inteligencia que cruce los productos mas guardados en las listas de deseos frente a aquellos que experimentan la menor tasa de conversion real.

DROP FUNCTION IF EXISTS fn_wishlist_conversion();
CREATE OR REPLACE FUNCTION fn_wishlist_conversion()
RETURNS TABLE (
    sku                VARCHAR,
    producto           VARCHAR,
    veces_en_wishlist  BIGINT,
    veces_vendido      BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT p.sku::VARCHAR,
           p.nombre::VARCHAR,
           (SELECT COUNT(*) FROM añadir a WHERE a.sku_producto = p.sku)::BIGINT,
           (SELECT COUNT(*) FROM detalle d WHERE d.id_producto = p.sku)::BIGINT
    FROM producto p
    WHERE EXISTS (SELECT 1 FROM añadir a WHERE a.sku_producto = p.sku)
       OR EXISTS (SELECT 1 FROM detalle d WHERE d.id_producto = p.sku)
    ORDER BY 3 DESC, 4 ASC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 6.8:
--------------------------------------------------------------------------------




-- ================================================================================
-- 7. VALIDACIÓN DEMOGRÁFICA Y PATRONES ALFANUMÉRICOS
-- ================================================================================
-- 7.1. Calcular con precision la edad cronologica de cada cliente basandose en su fecha de nacimiento registrada e identificar al segmento de usuarios menores de edad.

DROP FUNCTION IF EXISTS fn_edad_clientes(DATE);
CREATE OR REPLACE FUNCTION fn_edad_clientes(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    run          VARCHAR,
    nombre       VARCHAR,
    fecha_nacimiento DATE,
    edad         INTEGER,
    es_menor     BOOLEAN
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           u.fecha_nacimiento,
           EXTRACT(YEAR FROM AGE(p_fecha_ref, u.fecha_nacimiento))::INTEGER,
           (EXTRACT(YEAR FROM AGE(p_fecha_ref, u.fecha_nacimiento)) < 18)
    FROM usuario u
    WHERE u.tipo_cliente = TRUE
    ORDER BY 4, u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 7.1:
--------------------------------------------------------------------------------




-- 7.2. Formular una restriccion logica que detecte los intentos de contratacion de servicios con barrera etaria por parte de perfiles que no cumplen la edad minima legal.
-- Por indicación del enunciado se implementa como trigger (triggers.txt, trigger 6).




-- 7.3. Segmentar estadisticamente la base de clientes activos en grupos etarios decenales para facilitar la construccion de una matriz de preferencias comerciales.

DROP FUNCTION IF EXISTS fn_segmentacion_etaria(DATE);
CREATE OR REPLACE FUNCTION fn_segmentacion_etaria(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    rango_edad_inicio INTEGER,
    rango_etiqueta    TEXT,
    cantidad_clientes BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT (FLOOR(EXTRACT(YEAR FROM AGE(p_fecha_ref, u.fecha_nacimiento)) / 10) * 10)::INTEGER,
           (FLOOR(EXTRACT(YEAR FROM AGE(p_fecha_ref, u.fecha_nacimiento)) / 10) * 10)::INTEGER::TEXT
               || '-'
               || (FLOOR(EXTRACT(YEAR FROM AGE(p_fecha_ref, u.fecha_nacimiento)) / 10) * 10 + 9)::INTEGER::TEXT,
           COUNT(*)::BIGINT
    FROM usuario u
    WHERE u.tipo_cliente = TRUE
    GROUP BY 1, 2
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 7.3:
--------------------------------------------------------------------------------




-- 7.4. Detectar direcciones de correo electronico registradas que presenten anomalias estructurales o dominios de red invalidos, utilizando expresiones regulares o LIKE.
-- Por indicación del enunciado se implementa como trigger (triggers.txt, trigger 7).




-- 7.5. Buscar todos los emprendedores del ecosistema cuya empresa comercial asociada carezca de una pagina web corporativa definida (condicion nula estricta).

DROP FUNCTION IF EXISTS fn_emprendedores_sin_web();
CREATE OR REPLACE FUNCTION fn_emprendedores_sin_web()
RETURNS TABLE (
    run        VARCHAR,
    nombre     VARCHAR,
    empresa    VARCHAR,
    pagina_web VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           (SELECT e.nombre FROM empresa e WHERE e.run_empresa = u.run_empresa)::VARCHAR,
           (SELECT e.pagina_web FROM empresa e WHERE e.run_empresa = u.run_empresa)::VARCHAR
    FROM usuario u
    WHERE u.tipo_emprendedor = TRUE
      AND u.run_empresa IS NOT NULL
      AND (SELECT e.pagina_web FROM empresa e WHERE e.run_empresa = u.run_empresa) IS NULL
    ORDER BY u.run;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 7.5:
--------------------------------------------------------------------------------




-- 7.6. Identificar las direcciones de despacho donde el identificador nominativo de la calle comience explicitamente con los terminos urbanos Avenida o Camino.

DROP FUNCTION IF EXISTS fn_direcciones_por_prefijo(VARIADIC TEXT[]);
CREATE OR REPLACE FUNCTION fn_direcciones_por_prefijo(
    VARIADIC p_prefijos TEXT[]
)
RETURNS TABLE (
    id_direccion INTEGER,
    calle        VARCHAR,
    numero       INTEGER,
    comuna       VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    IF array_length(p_prefijos, 1) IS NULL THEN
        RAISE EXCEPTION 'Debe indicar al menos un prefijo de calle';
    END IF;

    RETURN QUERY
    SELECT d.id_direccion,
           d.calle::VARCHAR,
           d.numero,
           (SELECT co.nombre FROM comuna co WHERE co.id_comuna = d.id_comuna)::VARCHAR
    FROM direccion d
    WHERE EXISTS (
        SELECT 1
        FROM unnest(p_prefijos) AS pref
        WHERE d.calle LIKE pref || '%'
    )
    ORDER BY d.calle, d.numero;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 7.6:
--------------------------------------------------------------------------------




-- 7.7. Listar a los emprendedores que superan los 60 anos de edad cronologica y que actualmente ofrecen servicios del tipo educativo presencial.

DROP FUNCTION IF EXISTS fn_emprendedores_edad_servicio(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_emprendedores_edad_servicio(
    p_edad_min  INTEGER DEFAULT 50,
    p_modalidad VARCHAR DEFAULT 'Presencial'
)
RETURNS TABLE (
    run      VARCHAR,
    nombre   VARCHAR,
    edad     INTEGER,
    sku      VARCHAR,
    servicio VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT DISTINCT
           u.run::VARCHAR,
           u.nombre::VARCHAR,
           EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fecha_nacimiento))::INTEGER,
           s.sku::VARCHAR,
           s.nombre::VARCHAR
    FROM usuario u
    JOIN empresa e ON e.run_empresa = u.run_empresa
    JOIN asocia a  ON a.id_empresa = e.run_empresa
    JOIN servicio s ON s.sku = a.id_servicio
    WHERE u.tipo_emprendedor = TRUE
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fecha_nacimiento)) > p_edad_min
      AND (s.atributos->>'modalidad') = p_modalidad
    ORDER BY 3 DESC, 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 7.7:
--------------------------------------------------------------------------------




-- 7.8. Extraer los medios de pago transaccionales que han sido registrados bajo marcas operativas especificas como Visa o MasterCard, empleando filtrado de cadenas.

DROP FUNCTION IF EXISTS fn_medios_pago_marca(VARIADIC TEXT[]);
CREATE OR REPLACE FUNCTION fn_medios_pago_marca(
    VARIADIC p_marcas TEXT[]
)
RETURNS TABLE (
    codigo_transferencia      VARCHAR,
    medio_pago                VARCHAR,
    fecha                     DATE,
    ultimos_4_digitos_tarjeta VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    IF array_length(p_marcas, 1) IS NULL THEN
        RAISE EXCEPTION 'Debe indicar al menos una marca de medio de pago';
    END IF;

    RETURN QUERY
    SELECT mp.Codigo_Transferencia::VARCHAR,
           mp.Medio_Pago::VARCHAR,
           mp.Fecha,
           mp.Ultimos_4_Digitos_Tarjeta::VARCHAR
    FROM Medio_Pago mp
    WHERE EXISTS (
        SELECT 1
        FROM unnest(p_marcas) AS marca
        WHERE mp.Medio_Pago LIKE '%' || marca || '%'
    )
    ORDER BY mp.Fecha, mp.Codigo_Transferencia;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 7.8:
--------------------------------------------------------------------------------




-- ================================================================================
-- 8. VISTAS LÓGICAS E INDICADORES DE NEGOCIO
-- ================================================================================
-- 8.1. Disenar una vista integral que consolide la factura fiscal del cliente, desglosando formalmente el valor neto, el impuesto IVA, los descuentos y el recargo por envio.

DROP FUNCTION IF EXISTS fn_factura_cliente(VARCHAR);
CREATE OR REPLACE FUNCTION fn_factura_cliente(
    p_run VARCHAR
)
RETURNS TABLE (
    run            VARCHAR,
    cliente        VARCHAR,
    id_venta       INTEGER,
    valor_neto     NUMERIC,
    impuesto_iva   NUMERIC,
    descuento      NUMERIC,
    recargo_envio  INTEGER,
    total_factura  NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE run = p_run) THEN
        RAISE EXCEPTION 'El cliente % no existe', p_run;
    END IF;

    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           v.id_venta,
           v.precio_sin_iva,
           v.total_iva,
           COALESCE((
               SELECT MAX(o.descuento)
               FROM incluye i
               JOIN promociona pr ON pr.sku_producto = i.sku_producto
               JOIN oferta o      ON o.id_oferta = pr.id_oferta
               WHERE i.id_venta = v.id_venta
           ), 0),
           des.precio,
           (v.precio_sin_iva + v.total_iva + des.precio)
    FROM usuario u
    JOIN compra c     ON c.run_usuario = u.run
    JOIN venta v      ON v.id_venta = c.id_venta
    JOIN considera co ON co.id_venta = v.id_venta
    JOIN despacho des ON des.id_despacho = co.id_despacho
    WHERE u.run = p_run
    ORDER BY v.id_venta;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.1:
--------------------------------------------------------------------------------




-- 8.2. Crear una vista de alerta que exponga el inventario critico, notificando sobre aquellos productos fisicos cuyo stock operativo descienda de las diez unidades.
-- Por indicación del enunciado se implementa como trigger (triggers.txt, trigger 8).




-- 8.3. Formular una vista de rendimiento metrico que categorice a los emprendedores en rangos consolidados segun su facturacion trimestral bruta acumulada.

DROP FUNCTION IF EXISTS fn_rendimiento_emprendedor(DATE, INTEGER);
CREATE OR REPLACE FUNCTION fn_rendimiento_emprendedor(
    p_fecha_ref DATE DEFAULT CURRENT_DATE,
    p_meses     INTEGER DEFAULT 3
)
RETURNS TABLE (
    run                     VARCHAR,
    nombre                  VARCHAR,
    facturacion_trimestral  BIGINT,
    rango                   VARCHAR
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           SUM(mp.Precio_Total)::BIGINT,
           (CASE
                WHEN SUM(mp.Precio_Total) < 100000 THEN 'Bajo'
                WHEN SUM(mp.Precio_Total) < 500000 THEN 'Medio'
                ELSE 'Alto'
            END)::VARCHAR
    FROM usuario u
    JOIN vende ve      ON ve.id_usuario = u.run
    JOIN detalle det   ON det.id_producto = ve.id_producto
    JOIN Medio_Pago mp ON mp.ID_Venta = det.id_venta
    WHERE u.tipo_emprendedor = TRUE
      AND mp.Fecha >  p_fecha_ref - make_interval(months => p_meses)
      AND mp.Fecha <= p_fecha_ref
    GROUP BY u.run, u.nombre
    ORDER BY 3 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.3:
--------------------------------------------------------------------------------




-- 8.4. Estructurar un modelo de consulta que reporte el valor historico consolidado (Life-Time Value) de cada cliente, integrando todo su volumen de transacciones en la plataforma.

DROP FUNCTION IF EXISTS fn_ltv_cliente();
CREATE OR REPLACE FUNCTION fn_ltv_cliente()
RETURNS TABLE (
    run              VARCHAR,
    nombre           VARCHAR,
    cantidad_compras BIGINT,
    life_time_value  BIGINT
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.run::VARCHAR,
           u.nombre::VARCHAR,
           COUNT(c.id_venta)::BIGINT,
           SUM(mp.Precio_Total)::BIGINT
    FROM usuario u
    JOIN compra c      ON c.run_usuario = u.run
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    WHERE u.tipo_cliente = TRUE
    GROUP BY u.run, u.nombre
    ORDER BY 4 DESC;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.4:
--------------------------------------------------------------------------------




-- 8.5. Crear una vista jerarquica unificada que mapee la estructura completa y dependencias de todas las categorias y subcategorias mediante logica recursiva.

DROP FUNCTION IF EXISTS fn_categorias_jerarquia();
CREATE OR REPLACE FUNCTION fn_categorias_jerarquia()
RETURNS TABLE (
    raiz        VARCHAR,
    padre       VARCHAR,
    hija        VARCHAR,
    nivel       INTEGER
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH RECURSIVE jerarquia AS (
        SELECT s.nombre_a_categoria::VARCHAR AS raiz,
               s.nombre_a_categoria::VARCHAR AS padre,
               s.nombre_b_categoria::VARCHAR AS hija,
               1 AS nivel,
               ARRAY[s.nombre_a_categoria]::VARCHAR[] AS camino
        FROM subdivide s
        UNION ALL
        SELECT j.raiz,
               s.nombre_a_categoria::VARCHAR,
               s.nombre_b_categoria::VARCHAR,
               j.nivel + 1,
               (j.camino || s.nombre_a_categoria)::VARCHAR[]
        FROM jerarquia j
        JOIN subdivide s ON s.nombre_a_categoria = j.hija
        WHERE NOT (s.nombre_a_categoria = ANY (j.camino))
          AND j.nivel < 8
    )
    SELECT j.raiz, j.padre, j.hija, j.nivel
    FROM jerarquia j
    ORDER BY j.raiz, j.nivel, j.hija;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.5:
--------------------------------------------------------------------------------




-- 8.6. Consolidar el total de utilidades operativas proyectadas para la plataforma, asumiendo un cargo por comision equivalente al 5 % sobre el valor bruto de cada venta.

DROP FUNCTION IF EXISTS fn_utilidades_proyectadas(NUMERIC);
CREATE OR REPLACE FUNCTION fn_utilidades_proyectadas(
    p_comision NUMERIC DEFAULT 0.05
)
RETURNS TABLE (
    anio                INTEGER,
    mes                 INTEGER,
    ventas_brutas       BIGINT,
    comision_plataforma NUMERIC,
    utilidad_proyectada NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT EXTRACT(YEAR FROM mp.Fecha)::INTEGER,
           EXTRACT(MONTH FROM mp.Fecha)::INTEGER,
           SUM(mp.Precio_Total)::BIGINT,
           ROUND(SUM(mp.Precio_Total) * p_comision, 2),
           ROUND(SUM(mp.Precio_Total) * p_comision, 2)
    FROM Medio_Pago mp
    GROUP BY EXTRACT(YEAR FROM mp.Fecha), EXTRACT(MONTH FROM mp.Fecha)
    ORDER BY 1, 2;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.6:
--------------------------------------------------------------------------------




-- 8.7. Generar una vista geoespacial que agrupe a las empresas registradas segun su giro comercial y totalice la superficie demografica de las comunas donde mantienen presencia.

DROP FUNCTION IF EXISTS fn_geo_empresas();
CREATE OR REPLACE FUNCTION fn_geo_empresas()
RETURNS TABLE (
    run_empresa              VARCHAR,
    empresa                  VARCHAR,
    giro                     VARCHAR,
    superficie_total_comunas NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT e.run_empresa::VARCHAR,
           e.nombre::VARCHAR,
           cat.tipo::VARCHAR,
           SUM(co.superficie)::NUMERIC
    FROM empresa e
    JOIN direccion d     ON d.run_empresa = e.run_empresa
    JOIN comuna co       ON co.id_comuna = d.id_comuna
    JOIN comercializa com ON com.id_empresa = e.run_empresa
    JOIN pertenece pe    ON pe.id_producto = com.id_producto
    JOIN categoria cat   ON cat.nombre = pe.nombre_categoria
    GROUP BY e.run_empresa, e.nombre, cat.tipo
    ORDER BY e.run_empresa;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.7:
--------------------------------------------------------------------------------




-- 8.8. Disenar un panel de monitoreo temporal que muestre el promedio aritmetico diario de nuevos registros de clientes en el sistema a lo largo del ultimo mes calendario.

DROP FUNCTION IF EXISTS fn_promedio_registros_mes(DATE);
CREATE OR REPLACE FUNCTION fn_promedio_registros_mes(
    p_fecha_ref DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    dia                      DATE,
    nuevos_clientes          BIGINT,
    promedio_diario_del_mes  NUMERIC
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT u.fecha_registro,
           COUNT(*)::BIGINT,
           ROUND(AVG(COUNT(*)) OVER (), 2)
    FROM usuario u
    WHERE u.tipo_cliente = TRUE
      AND date_trunc('month', u.fecha_registro) = date_trunc('month', p_fecha_ref)
    GROUP BY u.fecha_registro
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.8:
--------------------------------------------------------------------------------




-- 8.9. Estructurar una consulta de auditoria que verifique la consistencia numerica, confirmando que el importe total abonado coincide con la suma aritmetica de brutos e IVA, restando el descuento.
-- Por indicación del enunciado se implementa como trigger (triggers.txt, trigger 13).




-- 8.10. Formular una vista general de catalogo unificado que integre la disponibilidad de productos fisicos y la oferta de servicios profesionales en una matriz unica de busqueda indexada.

DROP FUNCTION IF EXISTS fn_catalogo_unificado(VARCHAR);
CREATE OR REPLACE FUNCTION fn_catalogo_unificado(
    p_texto VARCHAR DEFAULT 'Producto'
)
RETURNS TABLE (
    codigo           VARCHAR,
    nombre           VARCHAR,
    tipo             VARCHAR,
    detalle          VARCHAR,
    restriccion_edad BOOLEAN
) AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT x.codigo, x.nombre, x.tipo, x.detalle, x.restriccion_edad
    FROM (
        SELECT p.sku::VARCHAR AS codigo,
               p.nombre::VARCHAR AS nombre,
               'Producto'::VARCHAR AS tipo,
               p.marca::VARCHAR AS detalle,
               p.restriccion_edad
        FROM producto p
        UNION ALL
        SELECT s.sku::VARCHAR,
               s.nombre::VARCHAR,
               'Servicio'::VARCHAR,
               s.tiempo::VARCHAR,
               s.restriccion_edad
        FROM servicio s
    ) x
    WHERE x.nombre ILIKE '%' || p_texto || '%'
       OR x.tipo   ILIKE '%' || p_texto || '%'
       OR x.codigo ILIKE '%' || p_texto || '%'
    ORDER BY x.tipo, x.nombre;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- EJECUCIÓN PRUEBA 8.10:
--------------------------------------------------------------------------------

-- ================================================================================
-- FUNCIONES DE INSERCION, ACTUALIZACION Y ELIMINACION
-- ================================================================================
-- 10. Tabla region

DROP FUNCTION IF EXISTS fn_ins_region(INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_region(
    p_id_region INTEGER,
    p_nombre VARCHAR,
    p_superficie INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO region (id_region, nombre, superficie)
    VALUES (p_id_region, p_nombre, p_superficie);
    RETURN format('region: fila insertada (%s)', p_id_region);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'region: la clave primaria ya existe';
        RETURN 'region: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'region: alguna clave foranea referenciada no existe';
        RETURN 'region: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'region: la fila no cumple una restriccion CHECK';
        RETURN 'region: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'region: se recibio NULL en una columna obligatoria';
        RETURN 'region: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_region(INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_region(
    p_id_region INTEGER,
    p_nombre VARCHAR DEFAULT NULL,
    p_superficie INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_superficie IS NULL THEN
        RAISE NOTICE 'region: no se indico ningun valor a modificar';
        RETURN 'region: 0 filas actualizadas';
    END IF;
    UPDATE region SET
        nombre = COALESCE(p_nombre, region.nombre),
        superficie = COALESCE(p_superficie, region.superficie)
    WHERE id_region = p_id_region;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'region: no existe la fila (%)', p_id_region;
        RETURN 'region: 0 filas actualizadas';
    END IF;

    RETURN format('region: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'region: alguna clave foranea referenciada no existe';
        RETURN 'region: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'region: la fila resultante no cumple una restriccion CHECK';
        RETURN 'region: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'region: la clave resultante ya existe';
        RETURN 'region: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_region(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_region(
    p_id_region INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM region
    WHERE id_region = p_id_region;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'region: no existe la fila (%)', p_id_region;
        RETURN 'region: 0 filas eliminadas';
    END IF;

    RETURN format('region: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'region: existen filas dependientes que impiden el borrado';
        RETURN 'region: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_region(999, 'Region Prueba', 100);
-- SELECT fn_upd_region(999, 'Region Prueba Editada');
-- SELECT fn_del_region(999);


-- 11. Tabla provincia

DROP FUNCTION IF EXISTS fn_ins_provincia(INTEGER, VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_provincia(
    p_id_provincia INTEGER,
    p_nombre VARCHAR,
    p_superficie INTEGER,
    p_id_region INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO provincia (id_provincia, nombre, superficie, id_region)
    VALUES (p_id_provincia, p_nombre, p_superficie, p_id_region);
    RETURN format('provincia: fila insertada (%s)', p_id_provincia);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'provincia: la clave primaria ya existe';
        RETURN 'provincia: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'provincia: alguna clave foranea referenciada no existe';
        RETURN 'provincia: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'provincia: la fila no cumple una restriccion CHECK';
        RETURN 'provincia: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'provincia: se recibio NULL en una columna obligatoria';
        RETURN 'provincia: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_provincia(INTEGER, VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_provincia(
    p_id_provincia INTEGER,
    p_nombre VARCHAR DEFAULT NULL,
    p_superficie INTEGER DEFAULT NULL,
    p_id_region INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_superficie IS NULL AND
       p_id_region IS NULL THEN
        RAISE NOTICE 'provincia: no se indico ningun valor a modificar';
        RETURN 'provincia: 0 filas actualizadas';
    END IF;
    UPDATE provincia SET
        nombre = COALESCE(p_nombre, provincia.nombre),
        superficie = COALESCE(p_superficie, provincia.superficie),
        id_region = COALESCE(p_id_region, provincia.id_region)
    WHERE id_provincia = p_id_provincia;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'provincia: no existe la fila (%)', p_id_provincia;
        RETURN 'provincia: 0 filas actualizadas';
    END IF;

    RETURN format('provincia: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'provincia: alguna clave foranea referenciada no existe';
        RETURN 'provincia: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'provincia: la fila resultante no cumple una restriccion CHECK';
        RETURN 'provincia: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'provincia: la clave resultante ya existe';
        RETURN 'provincia: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_provincia(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_provincia(
    p_id_provincia INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM provincia
    WHERE id_provincia = p_id_provincia;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'provincia: no existe la fila (%)', p_id_provincia;
        RETURN 'provincia: 0 filas eliminadas';
    END IF;

    RETURN format('provincia: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'provincia: existen filas dependientes que impiden el borrado';
        RETURN 'provincia: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_provincia(9999, 'Provincia Prueba', 50, 1);
-- SELECT fn_upd_provincia(9999, 'Provincia Prueba Editada');
-- SELECT fn_del_provincia(9999);


-- 12. Tabla comuna

DROP FUNCTION IF EXISTS fn_ins_comuna(INTEGER, VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_comuna(
    p_id_comuna INTEGER,
    p_nombre VARCHAR,
    p_superficie INTEGER,
    p_id_provincia INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO comuna (id_comuna, nombre, superficie, id_provincia)
    VALUES (p_id_comuna, p_nombre, p_superficie, p_id_provincia);
    RETURN format('comuna: fila insertada (%s)', p_id_comuna);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'comuna: la clave primaria ya existe';
        RETURN 'comuna: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'comuna: alguna clave foranea referenciada no existe';
        RETURN 'comuna: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'comuna: la fila no cumple una restriccion CHECK';
        RETURN 'comuna: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'comuna: se recibio NULL en una columna obligatoria';
        RETURN 'comuna: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_comuna(INTEGER, VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_comuna(
    p_id_comuna INTEGER,
    p_nombre VARCHAR DEFAULT NULL,
    p_superficie INTEGER DEFAULT NULL,
    p_id_provincia INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_superficie IS NULL AND
       p_id_provincia IS NULL THEN
        RAISE NOTICE 'comuna: no se indico ningun valor a modificar';
        RETURN 'comuna: 0 filas actualizadas';
    END IF;
    UPDATE comuna SET
        nombre = COALESCE(p_nombre, comuna.nombre),
        superficie = COALESCE(p_superficie, comuna.superficie),
        id_provincia = COALESCE(p_id_provincia, comuna.id_provincia)
    WHERE id_comuna = p_id_comuna;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'comuna: no existe la fila (%)', p_id_comuna;
        RETURN 'comuna: 0 filas actualizadas';
    END IF;

    RETURN format('comuna: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'comuna: alguna clave foranea referenciada no existe';
        RETURN 'comuna: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'comuna: la fila resultante no cumple una restriccion CHECK';
        RETURN 'comuna: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'comuna: la clave resultante ya existe';
        RETURN 'comuna: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_comuna(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_comuna(
    p_id_comuna INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM comuna
    WHERE id_comuna = p_id_comuna;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'comuna: no existe la fila (%)', p_id_comuna;
        RETURN 'comuna: 0 filas eliminadas';
    END IF;

    RETURN format('comuna: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'comuna: existen filas dependientes que impiden el borrado';
        RETURN 'comuna: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_comuna(99999, 'Comuna Prueba', 10, 1);
-- SELECT fn_upd_comuna(99999, 'Comuna Prueba Editada');
-- SELECT fn_del_comuna(99999);


-- 13. Tabla empresa

DROP FUNCTION IF EXISTS fn_ins_empresa(VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_empresa(
    p_run_empresa VARCHAR,
    p_nombre VARCHAR,
    p_pagina_web VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO empresa (run_empresa, nombre, pagina_web)
    VALUES (p_run_empresa, p_nombre, p_pagina_web);
    RETURN format('empresa: fila insertada (%s)', p_run_empresa);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'empresa: la clave primaria ya existe';
        RETURN 'empresa: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'empresa: alguna clave foranea referenciada no existe';
        RETURN 'empresa: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'empresa: la fila no cumple una restriccion CHECK';
        RETURN 'empresa: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'empresa: se recibio NULL en una columna obligatoria';
        RETURN 'empresa: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_empresa(VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_empresa(
    p_run_empresa VARCHAR,
    p_nombre VARCHAR DEFAULT NULL,
    p_pagina_web VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_pagina_web IS NULL THEN
        RAISE NOTICE 'empresa: no se indico ningun valor a modificar';
        RETURN 'empresa: 0 filas actualizadas';
    END IF;
    UPDATE empresa SET
        nombre = COALESCE(p_nombre, empresa.nombre),
        pagina_web = COALESCE(p_pagina_web, empresa.pagina_web)
    WHERE run_empresa = p_run_empresa;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'empresa: no existe la fila (%)', p_run_empresa;
        RETURN 'empresa: 0 filas actualizadas';
    END IF;

    RETURN format('empresa: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'empresa: alguna clave foranea referenciada no existe';
        RETURN 'empresa: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'empresa: la fila resultante no cumple una restriccion CHECK';
        RETURN 'empresa: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'empresa: la clave resultante ya existe';
        RETURN 'empresa: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_empresa(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_empresa(
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM empresa
    WHERE run_empresa = p_run_empresa;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'empresa: no existe la fila (%)', p_run_empresa;
        RETURN 'empresa: 0 filas eliminadas';
    END IF;

    RETURN format('empresa: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'empresa: existen filas dependientes que impiden el borrado';
        RETURN 'empresa: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_empresa('99000000-9', 'Empresa Prueba', 'https://www.prueba.cl');
-- SELECT fn_upd_empresa('99000000-9', 'Empresa Prueba Editada');
-- SELECT fn_del_empresa('99000000-9');


-- 14. Tabla usuario

DROP FUNCTION IF EXISTS fn_ins_usuario(VARCHAR, VARCHAR, VARCHAR, DATE, DATE, BOOLEAN, BOOLEAN, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_usuario(
    p_run VARCHAR,
    p_nombre VARCHAR,
    p_clave_acceso VARCHAR,
    p_fecha_nacimiento DATE,
    p_fecha_registro DATE,
    p_tipo_cliente BOOLEAN,
    p_tipo_emprendedor BOOLEAN,
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
BEGIN

    IF p_nombre IS NULL OR btrim(p_nombre) = '' THEN
        RAISE NOTICE 'usuario: el nombre es obligatorio';
        RETURN 'usuario: no se inserto, nombre obligatorio';
    END IF;
    IF p_clave_acceso IS NULL OR btrim(p_clave_acceso) = '' THEN
        RAISE NOTICE 'usuario: la clave de acceso es obligatoria';
        RETURN 'usuario: no se inserto, clave obligatoria';
    END IF;
    IF p_fecha_nacimiento IS NULL THEN
        RAISE NOTICE 'usuario: la fecha de nacimiento es obligatoria';
        RETURN 'usuario: no se inserto, fecha de nacimiento obligatoria';
    END IF;
    INSERT INTO usuario (run, nombre, clave_acceso, fecha_nacimiento, fecha_registro, tipo_cliente, tipo_emprendedor, run_empresa)
    VALUES (p_run, p_nombre, p_clave_acceso, p_fecha_nacimiento, p_fecha_registro, p_tipo_cliente, p_tipo_emprendedor, p_run_empresa);
    RETURN format('usuario: fila insertada (%s)', p_run);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'usuario: la clave primaria ya existe';
        RETURN 'usuario: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'usuario: alguna clave foranea referenciada no existe';
        RETURN 'usuario: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'usuario: la fila no cumple una restriccion CHECK';
        RETURN 'usuario: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'usuario: se recibio NULL en una columna obligatoria';
        RETURN 'usuario: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_usuario(VARCHAR, VARCHAR, VARCHAR, DATE, DATE, BOOLEAN, BOOLEAN);
CREATE OR REPLACE FUNCTION fn_upd_usuario(
    p_run VARCHAR,
    p_nombre VARCHAR DEFAULT NULL,
    p_clave_acceso VARCHAR DEFAULT NULL,
    p_fecha_nacimiento DATE DEFAULT NULL,
    p_fecha_registro DATE DEFAULT NULL,
    p_tipo_cliente BOOLEAN DEFAULT NULL,
    p_tipo_emprendedor BOOLEAN DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_clave_acceso IS NULL AND
       p_fecha_nacimiento IS NULL AND
       p_fecha_registro IS NULL AND
       p_tipo_cliente IS NULL AND
       p_tipo_emprendedor IS NULL THEN
        RAISE NOTICE 'usuario: no se indico ningun valor a modificar';
        RETURN 'usuario: 0 filas actualizadas';
    END IF;
    UPDATE usuario SET
        nombre = COALESCE(p_nombre, usuario.nombre),
        clave_acceso = COALESCE(p_clave_acceso, usuario.clave_acceso),
        fecha_nacimiento = COALESCE(p_fecha_nacimiento, usuario.fecha_nacimiento),
        fecha_registro = COALESCE(p_fecha_registro, usuario.fecha_registro),
        tipo_cliente = COALESCE(p_tipo_cliente, usuario.tipo_cliente),
        tipo_emprendedor = COALESCE(p_tipo_emprendedor, usuario.tipo_emprendedor)
    WHERE run = p_run;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'usuario: no existe la fila (%)', p_run;
        RETURN 'usuario: 0 filas actualizadas';
    END IF;

    RETURN format('usuario: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'usuario: alguna clave foranea referenciada no existe';
        RETURN 'usuario: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'usuario: la fila resultante no cumple una restriccion CHECK';
        RETURN 'usuario: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'usuario: la clave resultante ya existe';
        RETURN 'usuario: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_usuario_empresa(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_usuario_empresa(
    p_run VARCHAR,
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE usuario SET
        run_empresa = p_run_empresa
    WHERE run = p_run;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'usuario: no existe la fila (%)', p_run;
        RETURN 'usuario: 0 filas actualizadas';
    END IF;

    RETURN format('usuario: empresa actualizada (%s)', p_run);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'usuario: alguna clave foranea referenciada no existe';
        RETURN 'usuario: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'usuario: la fila resultante no cumple una restriccion CHECK';
        RETURN 'usuario: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'usuario: la clave resultante ya existe';
        RETURN 'usuario: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_usuario(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_usuario(
    p_run VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM usuario
    WHERE run = p_run;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'usuario: no existe la fila (%)', p_run;
        RETURN 'usuario: 0 filas eliminadas';
    END IF;

    RETURN format('usuario: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'usuario: existen filas dependientes que impiden el borrado';
        RETURN 'usuario: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_usuario('99999999-9', 'Cliente Prueba', 'clave9999', DATE '1990-05-10', DATE '2024-01-10', TRUE, FALSE, NULL);
-- SELECT fn_upd_usuario('99999999-9', 'Cliente Prueba Editado');
-- SELECT fn_upd_usuario_empresa('99999999-9', '76000001-2');
-- SELECT fn_del_usuario('99999999-9');


-- 15. Tabla categoria

DROP FUNCTION IF EXISTS fn_ins_categoria(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_categoria(
    p_nombre VARCHAR,
    p_tipo VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO categoria (nombre, tipo)
    VALUES (p_nombre, p_tipo);
    RETURN format('categoria: fila insertada (%s)', p_nombre);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'categoria: la clave primaria ya existe';
        RETURN 'categoria: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'categoria: alguna clave foranea referenciada no existe';
        RETURN 'categoria: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'categoria: la fila no cumple una restriccion CHECK';
        RETURN 'categoria: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'categoria: se recibio NULL en una columna obligatoria';
        RETURN 'categoria: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_categoria(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_categoria(
    p_nombre VARCHAR,
    p_tipo VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_tipo IS NULL THEN
        RAISE NOTICE 'categoria: no se indico ningun valor a modificar';
        RETURN 'categoria: 0 filas actualizadas';
    END IF;
    UPDATE categoria SET
        tipo = COALESCE(p_tipo, categoria.tipo)
    WHERE nombre = p_nombre;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'categoria: no existe la fila (%)', p_nombre;
        RETURN 'categoria: 0 filas actualizadas';
    END IF;

    RETURN format('categoria: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'categoria: alguna clave foranea referenciada no existe';
        RETURN 'categoria: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'categoria: la fila resultante no cumple una restriccion CHECK';
        RETURN 'categoria: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'categoria: la clave resultante ya existe';
        RETURN 'categoria: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_categoria(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_categoria(
    p_nombre VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM categoria
    WHERE nombre = p_nombre;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'categoria: no existe la fila (%)', p_nombre;
        RETURN 'categoria: 0 filas eliminadas';
    END IF;

    RETURN format('categoria: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'categoria: existen filas dependientes que impiden el borrado';
        RETURN 'categoria: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_categoria('Cat_PRUEBA', 'Producto');
-- SELECT fn_upd_categoria('Cat_PRUEBA', 'Servicio');
-- SELECT fn_del_categoria('Cat_PRUEBA');


-- 16. Tabla stock

DROP FUNCTION IF EXISTS fn_ins_stock(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_stock(
    p_id_stock INTEGER,
    p_cantidad INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO stock (id_stock, cantidad)
    VALUES (p_id_stock, p_cantidad);
    RETURN format('stock: fila insertada (%s)', p_id_stock);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'stock: la clave primaria ya existe';
        RETURN 'stock: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'stock: alguna clave foranea referenciada no existe';
        RETURN 'stock: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'stock: la fila no cumple una restriccion CHECK';
        RETURN 'stock: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'stock: se recibio NULL en una columna obligatoria';
        RETURN 'stock: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_stock(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_stock(
    p_id_stock INTEGER,
    p_cantidad INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_cantidad IS NULL THEN
        RAISE NOTICE 'stock: no se indico ningun valor a modificar';
        RETURN 'stock: 0 filas actualizadas';
    END IF;
    UPDATE stock SET
        cantidad = COALESCE(p_cantidad, stock.cantidad)
    WHERE id_stock = p_id_stock;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'stock: no existe la fila (%)', p_id_stock;
        RETURN 'stock: 0 filas actualizadas';
    END IF;

    RETURN format('stock: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'stock: alguna clave foranea referenciada no existe';
        RETURN 'stock: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'stock: la fila resultante no cumple una restriccion CHECK';
        RETURN 'stock: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'stock: la clave resultante ya existe';
        RETURN 'stock: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_stock(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_stock(
    p_id_stock INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM stock
    WHERE id_stock = p_id_stock;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'stock: no existe la fila (%)', p_id_stock;
        RETURN 'stock: 0 filas eliminadas';
    END IF;

    RETURN format('stock: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'stock: existen filas dependientes que impiden el borrado';
        RETURN 'stock: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_stock(999999, 20);
-- SELECT fn_upd_stock(999999, 35);
-- SELECT fn_del_stock(999999);


-- 17. Tabla caracteristicas

DROP FUNCTION IF EXISTS fn_ins_caracteristicas(INTEGER, JSON, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_caracteristicas(
    p_id_caracteristicas INTEGER,
    p_atributos JSON,
    p_id_stock INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO caracteristicas (id_caracteristicas, atributos, id_stock)
    VALUES (p_id_caracteristicas, p_atributos, p_id_stock);
    RETURN format('caracteristicas: fila insertada (%s)', p_id_caracteristicas);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'caracteristicas: la clave primaria ya existe';
        RETURN 'caracteristicas: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'caracteristicas: alguna clave foranea referenciada no existe';
        RETURN 'caracteristicas: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'caracteristicas: la fila no cumple una restriccion CHECK';
        RETURN 'caracteristicas: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'caracteristicas: se recibio NULL en una columna obligatoria';
        RETURN 'caracteristicas: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_caracteristicas(INTEGER, JSON, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_caracteristicas(
    p_id_caracteristicas INTEGER,
    p_atributos JSON DEFAULT NULL,
    p_id_stock INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_atributos IS NULL AND
       p_id_stock IS NULL THEN
        RAISE NOTICE 'caracteristicas: no se indico ningun valor a modificar';
        RETURN 'caracteristicas: 0 filas actualizadas';
    END IF;
    UPDATE caracteristicas SET
        atributos = COALESCE(p_atributos, caracteristicas.atributos),
        id_stock = COALESCE(p_id_stock, caracteristicas.id_stock)
    WHERE id_caracteristicas = p_id_caracteristicas;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'caracteristicas: no existe la fila (%)', p_id_caracteristicas;
        RETURN 'caracteristicas: 0 filas actualizadas';
    END IF;

    RETURN format('caracteristicas: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'caracteristicas: alguna clave foranea referenciada no existe';
        RETURN 'caracteristicas: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'caracteristicas: la fila resultante no cumple una restriccion CHECK';
        RETURN 'caracteristicas: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'caracteristicas: la clave resultante ya existe';
        RETURN 'caracteristicas: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_caracteristicas(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_caracteristicas(
    p_id_caracteristicas INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM caracteristicas
    WHERE id_caracteristicas = p_id_caracteristicas;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'caracteristicas: no existe la fila (%)', p_id_caracteristicas;
        RETURN 'caracteristicas: 0 filas eliminadas';
    END IF;

    RETURN format('caracteristicas: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'caracteristicas: existen filas dependientes que impiden el borrado';
        RETURN 'caracteristicas: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_caracteristicas(999999, '{"color":"rojo"}'::json, 1);
-- SELECT fn_upd_caracteristicas(999999, '{"color":"azul"}'::json);
-- SELECT fn_del_caracteristicas(999999);


-- 18. Tabla oferta

DROP FUNCTION IF EXISTS fn_ins_oferta(INTEGER, NUMERIC);
CREATE OR REPLACE FUNCTION fn_ins_oferta(
    p_id_oferta INTEGER,
    p_descuento NUMERIC
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO oferta (id_oferta, descuento)
    VALUES (p_id_oferta, p_descuento);
    RETURN format('oferta: fila insertada (%s)', p_id_oferta);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'oferta: la clave primaria ya existe';
        RETURN 'oferta: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'oferta: alguna clave foranea referenciada no existe';
        RETURN 'oferta: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'oferta: la fila no cumple una restriccion CHECK';
        RETURN 'oferta: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'oferta: se recibio NULL en una columna obligatoria';
        RETURN 'oferta: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_oferta(INTEGER, NUMERIC);
CREATE OR REPLACE FUNCTION fn_upd_oferta(
    p_id_oferta INTEGER,
    p_descuento NUMERIC DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_descuento IS NULL THEN
        RAISE NOTICE 'oferta: no se indico ningun valor a modificar';
        RETURN 'oferta: 0 filas actualizadas';
    END IF;
    UPDATE oferta SET
        descuento = COALESCE(p_descuento, oferta.descuento)
    WHERE id_oferta = p_id_oferta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'oferta: no existe la fila (%)', p_id_oferta;
        RETURN 'oferta: 0 filas actualizadas';
    END IF;

    RETURN format('oferta: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'oferta: alguna clave foranea referenciada no existe';
        RETURN 'oferta: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'oferta: la fila resultante no cumple una restriccion CHECK';
        RETURN 'oferta: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'oferta: la clave resultante ya existe';
        RETURN 'oferta: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_oferta(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_oferta(
    p_id_oferta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM oferta
    WHERE id_oferta = p_id_oferta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'oferta: no existe la fila (%)', p_id_oferta;
        RETURN 'oferta: 0 filas eliminadas';
    END IF;

    RETURN format('oferta: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'oferta: existen filas dependientes que impiden el borrado';
        RETURN 'oferta: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_oferta(999999, 15.5);
-- SELECT fn_upd_oferta(999999, 20);
-- SELECT fn_del_oferta(999999);


-- 19. Tabla cotizacion

DROP FUNCTION IF EXISTS fn_ins_cotizacion(INTEGER, DATE, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_cotizacion(
    p_id_cotizacion INTEGER,
    p_fecha DATE,
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO cotizacion (id_cotizacion, fecha, run_empresa)
    VALUES (p_id_cotizacion, p_fecha, p_run_empresa);
    RETURN format('cotizacion: fila insertada (%s)', p_id_cotizacion);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'cotizacion: la clave primaria ya existe';
        RETURN 'cotizacion: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'cotizacion: alguna clave foranea referenciada no existe';
        RETURN 'cotizacion: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'cotizacion: la fila no cumple una restriccion CHECK';
        RETURN 'cotizacion: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'cotizacion: se recibio NULL en una columna obligatoria';
        RETURN 'cotizacion: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_cotizacion(INTEGER, DATE, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_cotizacion(
    p_id_cotizacion INTEGER,
    p_fecha DATE DEFAULT NULL,
    p_run_empresa VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_fecha IS NULL AND
       p_run_empresa IS NULL THEN
        RAISE NOTICE 'cotizacion: no se indico ningun valor a modificar';
        RETURN 'cotizacion: 0 filas actualizadas';
    END IF;
    UPDATE cotizacion SET
        fecha = COALESCE(p_fecha, cotizacion.fecha),
        run_empresa = COALESCE(p_run_empresa, cotizacion.run_empresa)
    WHERE id_cotizacion = p_id_cotizacion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'cotizacion: no existe la fila (%)', p_id_cotizacion;
        RETURN 'cotizacion: 0 filas actualizadas';
    END IF;

    RETURN format('cotizacion: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'cotizacion: alguna clave foranea referenciada no existe';
        RETURN 'cotizacion: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'cotizacion: la fila resultante no cumple una restriccion CHECK';
        RETURN 'cotizacion: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'cotizacion: la clave resultante ya existe';
        RETURN 'cotizacion: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_cotizacion(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_cotizacion(
    p_id_cotizacion INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM cotizacion
    WHERE id_cotizacion = p_id_cotizacion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'cotizacion: no existe la fila (%)', p_id_cotizacion;
        RETURN 'cotizacion: 0 filas eliminadas';
    END IF;

    RETURN format('cotizacion: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'cotizacion: existen filas dependientes que impiden el borrado';
        RETURN 'cotizacion: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_cotizacion(999999, DATE '2024-03-15', '76000001-2');
-- SELECT fn_upd_cotizacion(999999, DATE '2024-03-10');
-- SELECT fn_del_cotizacion(999999);


-- 20. Tabla producto

DROP FUNCTION IF EXISTS fn_ins_producto(VARCHAR, VARCHAR, BOOLEAN, JSON, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_producto(
    p_sku VARCHAR,
    p_nombre VARCHAR,
    p_restriccion_edad BOOLEAN,
    p_atributos JSON,
    p_marca VARCHAR,
    p_id_cotizacion INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO producto (sku, nombre, restriccion_edad, atributos, marca, id_cotizacion)
    VALUES (p_sku, p_nombre, p_restriccion_edad, p_atributos, p_marca, p_id_cotizacion);
    RETURN format('producto: fila insertada (%s)', p_sku);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'producto: la clave primaria ya existe';
        RETURN 'producto: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'producto: alguna clave foranea referenciada no existe';
        RETURN 'producto: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'producto: la fila no cumple una restriccion CHECK';
        RETURN 'producto: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'producto: se recibio NULL en una columna obligatoria';
        RETURN 'producto: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_producto(VARCHAR, VARCHAR, BOOLEAN, JSON, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_producto(
    p_sku VARCHAR,
    p_nombre VARCHAR DEFAULT NULL,
    p_restriccion_edad BOOLEAN DEFAULT NULL,
    p_atributos JSON DEFAULT NULL,
    p_marca VARCHAR DEFAULT NULL,
    p_id_cotizacion INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_restriccion_edad IS NULL AND
       p_atributos IS NULL AND
       p_marca IS NULL AND
       p_id_cotizacion IS NULL THEN
        RAISE NOTICE 'producto: no se indico ningun valor a modificar';
        RETURN 'producto: 0 filas actualizadas';
    END IF;
    UPDATE producto SET
        nombre = COALESCE(p_nombre, producto.nombre),
        restriccion_edad = COALESCE(p_restriccion_edad, producto.restriccion_edad),
        atributos = COALESCE(p_atributos, producto.atributos),
        marca = COALESCE(p_marca, producto.marca),
        id_cotizacion = COALESCE(p_id_cotizacion, producto.id_cotizacion)
    WHERE sku = p_sku;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'producto: no existe la fila (%)', p_sku;
        RETURN 'producto: 0 filas actualizadas';
    END IF;

    RETURN format('producto: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'producto: alguna clave foranea referenciada no existe';
        RETURN 'producto: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'producto: la fila resultante no cumple una restriccion CHECK';
        RETURN 'producto: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'producto: la clave resultante ya existe';
        RETURN 'producto: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_producto(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_producto(
    p_sku VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM producto
    WHERE sku = p_sku;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'producto: no existe la fila (%)', p_sku;
        RETURN 'producto: 0 filas eliminadas';
    END IF;

    RETURN format('producto: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'producto: existen filas dependientes que impiden el borrado';
        RETURN 'producto: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_producto('P9999999', 'Producto Prueba', FALSE, '{"color":"rojo"}'::json, 'MarcaX', NULL);
-- SELECT fn_upd_producto('P9999999', 'Producto Prueba Editado');
-- SELECT fn_del_producto('P9999999');


-- 21. Tabla servicio

DROP FUNCTION IF EXISTS fn_ins_servicio(VARCHAR, VARCHAR, BOOLEAN, JSON, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_servicio(
    p_sku VARCHAR,
    p_nombre VARCHAR,
    p_restriccion_edad BOOLEAN,
    p_atributos JSON,
    p_tiempo INTEGER,
    p_id_cotizacion INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO servicio (sku, nombre, restriccion_edad, atributos, tiempo, id_cotizacion)
    VALUES (p_sku, p_nombre, p_restriccion_edad, p_atributos, p_tiempo, p_id_cotizacion);
    RETURN format('servicio: fila insertada (%s)', p_sku);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'servicio: la clave primaria ya existe';
        RETURN 'servicio: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'servicio: alguna clave foranea referenciada no existe';
        RETURN 'servicio: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'servicio: la fila no cumple una restriccion CHECK';
        RETURN 'servicio: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'servicio: se recibio NULL en una columna obligatoria';
        RETURN 'servicio: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_servicio(VARCHAR, VARCHAR, BOOLEAN, JSON, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_servicio(
    p_sku VARCHAR,
    p_nombre VARCHAR DEFAULT NULL,
    p_restriccion_edad BOOLEAN DEFAULT NULL,
    p_atributos JSON DEFAULT NULL,
    p_tiempo INTEGER DEFAULT NULL,
    p_id_cotizacion INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_nombre IS NULL AND
       p_restriccion_edad IS NULL AND
       p_atributos IS NULL AND
       p_tiempo IS NULL AND
       p_id_cotizacion IS NULL THEN
        RAISE NOTICE 'servicio: no se indico ningun valor a modificar';
        RETURN 'servicio: 0 filas actualizadas';
    END IF;
    UPDATE servicio SET
        nombre = COALESCE(p_nombre, servicio.nombre),
        restriccion_edad = COALESCE(p_restriccion_edad, servicio.restriccion_edad),
        atributos = COALESCE(p_atributos, servicio.atributos),
        tiempo = COALESCE(p_tiempo, servicio.tiempo),
        id_cotizacion = COALESCE(p_id_cotizacion, servicio.id_cotizacion)
    WHERE sku = p_sku;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'servicio: no existe la fila (%)', p_sku;
        RETURN 'servicio: 0 filas actualizadas';
    END IF;

    RETURN format('servicio: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'servicio: alguna clave foranea referenciada no existe';
        RETURN 'servicio: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'servicio: la fila resultante no cumple una restriccion CHECK';
        RETURN 'servicio: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'servicio: la clave resultante ya existe';
        RETURN 'servicio: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_servicio(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_servicio(
    p_sku VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM servicio
    WHERE sku = p_sku;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'servicio: no existe la fila (%)', p_sku;
        RETURN 'servicio: 0 filas eliminadas';
    END IF;

    RETURN format('servicio: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'servicio: existen filas dependientes que impiden el borrado';
        RETURN 'servicio: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_servicio('S9999999', 'Servicio Prueba', FALSE, '{"modalidad":"Remoto"}'::json, 60, NULL);
-- SELECT fn_upd_servicio('S9999999', 'Servicio Prueba Editado');
-- SELECT fn_del_servicio('S9999999');


-- 22. Tabla venta

DROP FUNCTION IF EXISTS fn_ins_venta(INTEGER, INTEGER, NUMERIC, NUMERIC);
CREATE OR REPLACE FUNCTION fn_ins_venta(
    p_id_venta INTEGER,
    p_cantidad INTEGER,
    p_precio_sin_iva NUMERIC,
    p_total_iva NUMERIC
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO venta (id_venta, cantidad, precio_sin_iva, total_iva)
    VALUES (p_id_venta, p_cantidad, p_precio_sin_iva, p_total_iva);
    RETURN format('venta: fila insertada (%s)', p_id_venta);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'venta: la clave primaria ya existe';
        RETURN 'venta: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'venta: alguna clave foranea referenciada no existe';
        RETURN 'venta: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'venta: la fila no cumple una restriccion CHECK';
        RETURN 'venta: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'venta: se recibio NULL en una columna obligatoria';
        RETURN 'venta: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_venta(INTEGER, INTEGER, NUMERIC, NUMERIC);
CREATE OR REPLACE FUNCTION fn_upd_venta(
    p_id_venta INTEGER,
    p_cantidad INTEGER DEFAULT NULL,
    p_precio_sin_iva NUMERIC DEFAULT NULL,
    p_total_iva NUMERIC DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_cantidad IS NULL AND
       p_precio_sin_iva IS NULL AND
       p_total_iva IS NULL THEN
        RAISE NOTICE 'venta: no se indico ningun valor a modificar';
        RETURN 'venta: 0 filas actualizadas';
    END IF;
    UPDATE venta SET
        cantidad = COALESCE(p_cantidad, venta.cantidad),
        precio_sin_iva = COALESCE(p_precio_sin_iva, venta.precio_sin_iva),
        total_iva = COALESCE(p_total_iva, venta.total_iva)
    WHERE id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'venta: no existe la fila (%)', p_id_venta;
        RETURN 'venta: 0 filas actualizadas';
    END IF;

    RETURN format('venta: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'venta: alguna clave foranea referenciada no existe';
        RETURN 'venta: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'venta: la fila resultante no cumple una restriccion CHECK';
        RETURN 'venta: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'venta: la clave resultante ya existe';
        RETURN 'venta: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_venta(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_venta(
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM venta
    WHERE id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'venta: no existe la fila (%)', p_id_venta;
        RETURN 'venta: 0 filas eliminadas';
    END IF;

    RETURN format('venta: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'venta: existen filas dependientes que impiden el borrado';
        RETURN 'venta: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_venta(999999, 2, 10000, 1900);
-- SELECT fn_upd_venta(999999, 3);
-- SELECT fn_del_venta(999999);


-- 23. Tabla medio_pago

DROP FUNCTION IF EXISTS fn_ins_medio_pago(VARCHAR, VARCHAR, DATE, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_medio_pago(
    p_codigo_transferencia VARCHAR,
    p_medio_pago VARCHAR,
    p_fecha DATE,
    p_ultimos_4_digitos_tarjeta VARCHAR,
    p_id_venta INTEGER,
    p_cantidad INTEGER,
    p_total_iva INTEGER,
    p_precio_sin_iva INTEGER,
    p_precio_total INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO medio_pago (codigo_transferencia, medio_pago, fecha, ultimos_4_digitos_tarjeta, id_venta, cantidad, total_iva, precio_sin_iva, precio_total)
    VALUES (p_codigo_transferencia, p_medio_pago, p_fecha, p_ultimos_4_digitos_tarjeta, p_id_venta, p_cantidad, p_total_iva, p_precio_sin_iva, p_precio_total);
    RETURN format('medio_pago: fila insertada (%s)', p_codigo_transferencia);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'medio_pago: la clave primaria ya existe';
        RETURN 'medio_pago: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'medio_pago: alguna clave foranea referenciada no existe';
        RETURN 'medio_pago: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'medio_pago: la fila no cumple una restriccion CHECK';
        RETURN 'medio_pago: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'medio_pago: se recibio NULL en una columna obligatoria';
        RETURN 'medio_pago: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_medio_pago(VARCHAR, VARCHAR, DATE, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_medio_pago(
    p_codigo_transferencia VARCHAR,
    p_medio_pago VARCHAR DEFAULT NULL,
    p_fecha DATE DEFAULT NULL,
    p_ultimos_4_digitos_tarjeta VARCHAR DEFAULT NULL,
    p_id_venta INTEGER DEFAULT NULL,
    p_cantidad INTEGER DEFAULT NULL,
    p_total_iva INTEGER DEFAULT NULL,
    p_precio_sin_iva INTEGER DEFAULT NULL,
    p_precio_total INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_medio_pago IS NULL AND
       p_fecha IS NULL AND
       p_ultimos_4_digitos_tarjeta IS NULL AND
       p_id_venta IS NULL AND
       p_cantidad IS NULL AND
       p_total_iva IS NULL AND
       p_precio_sin_iva IS NULL AND
       p_precio_total IS NULL THEN
        RAISE NOTICE 'medio_pago: no se indico ningun valor a modificar';
        RETURN 'medio_pago: 0 filas actualizadas';
    END IF;
    UPDATE medio_pago SET
        medio_pago = COALESCE(p_medio_pago, medio_pago.medio_pago),
        fecha = COALESCE(p_fecha, medio_pago.fecha),
        ultimos_4_digitos_tarjeta = COALESCE(p_ultimos_4_digitos_tarjeta, medio_pago.ultimos_4_digitos_tarjeta),
        id_venta = COALESCE(p_id_venta, medio_pago.id_venta),
        cantidad = COALESCE(p_cantidad, medio_pago.cantidad),
        total_iva = COALESCE(p_total_iva, medio_pago.total_iva),
        precio_sin_iva = COALESCE(p_precio_sin_iva, medio_pago.precio_sin_iva),
        precio_total = COALESCE(p_precio_total, medio_pago.precio_total)
    WHERE codigo_transferencia = p_codigo_transferencia;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'medio_pago: no existe la fila (%)', p_codigo_transferencia;
        RETURN 'medio_pago: 0 filas actualizadas';
    END IF;

    RETURN format('medio_pago: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'medio_pago: alguna clave foranea referenciada no existe';
        RETURN 'medio_pago: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'medio_pago: la fila resultante no cumple una restriccion CHECK';
        RETURN 'medio_pago: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'medio_pago: la clave resultante ya existe';
        RETURN 'medio_pago: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_medio_pago(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_medio_pago(
    p_codigo_transferencia VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM medio_pago
    WHERE codigo_transferencia = p_codigo_transferencia;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'medio_pago: no existe la fila (%)', p_codigo_transferencia;
        RETURN 'medio_pago: 0 filas eliminadas';
    END IF;

    RETURN format('medio_pago: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'medio_pago: existen filas dependientes que impiden el borrado';
        RETURN 'medio_pago: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_medio_pago('TRF9999999', 'Tarjeta', DATE '2024-03-15', '1234', 1, 1, 1900, 10000, 11900);
-- SELECT fn_upd_medio_pago('TRF9999999', 'Debito');
-- SELECT fn_del_medio_pago('TRF9999999');


-- 24. Tabla historial_compra

DROP FUNCTION IF EXISTS fn_ins_historial_compra(INTEGER, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_ins_historial_compra(
    p_id_historial INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO historial_compra (id_historial, fecha_inicio, fecha_fin)
    VALUES (p_id_historial, p_fecha_inicio, p_fecha_fin);
    RETURN format('historial_compra: fila insertada (%s)', p_id_historial);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'historial_compra: la clave primaria ya existe';
        RETURN 'historial_compra: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'historial_compra: alguna clave foranea referenciada no existe';
        RETURN 'historial_compra: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'historial_compra: la fila no cumple una restriccion CHECK';
        RETURN 'historial_compra: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'historial_compra: se recibio NULL en una columna obligatoria';
        RETURN 'historial_compra: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_historial_compra(INTEGER, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_upd_historial_compra(
    p_id_historial INTEGER,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_fecha_inicio IS NULL AND
       p_fecha_fin IS NULL THEN
        RAISE NOTICE 'historial_compra: no se indico ningun valor a modificar';
        RETURN 'historial_compra: 0 filas actualizadas';
    END IF;
    UPDATE historial_compra SET
        fecha_inicio = COALESCE(p_fecha_inicio, historial_compra.fecha_inicio),
        fecha_fin = COALESCE(p_fecha_fin, historial_compra.fecha_fin)
    WHERE id_historial = p_id_historial;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'historial_compra: no existe la fila (%)', p_id_historial;
        RETURN 'historial_compra: 0 filas actualizadas';
    END IF;

    RETURN format('historial_compra: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'historial_compra: alguna clave foranea referenciada no existe';
        RETURN 'historial_compra: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'historial_compra: la fila resultante no cumple una restriccion CHECK';
        RETURN 'historial_compra: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'historial_compra: la clave resultante ya existe';
        RETURN 'historial_compra: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_historial_compra(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_historial_compra(
    p_id_historial INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM historial_compra
    WHERE id_historial = p_id_historial;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'historial_compra: no existe la fila (%)', p_id_historial;
        RETURN 'historial_compra: 0 filas eliminadas';
    END IF;

    RETURN format('historial_compra: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'historial_compra: existen filas dependientes que impiden el borrado';
        RETURN 'historial_compra: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_historial_compra(999999, DATE '2018-02-01', DATE '2018-02-10');
-- SELECT fn_upd_historial_compra(999999, DATE '2018-02-02');
-- SELECT fn_del_historial_compra(999999);


-- 25. Tabla despacho

DROP FUNCTION IF EXISTS fn_ins_despacho(INTEGER, INTEGER, DATE, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_despacho(
    p_id_despacho INTEGER,
    p_precio INTEGER,
    p_fecha DATE,
    p_estado VARCHAR,
    p_id_historial_compra INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO despacho (id_despacho, precio, fecha, estado, id_historial_compra)
    VALUES (p_id_despacho, p_precio, p_fecha, p_estado, p_id_historial_compra);
    RETURN format('despacho: fila insertada (%s)', p_id_despacho);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'despacho: la clave primaria ya existe';
        RETURN 'despacho: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'despacho: alguna clave foranea referenciada no existe';
        RETURN 'despacho: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'despacho: la fila no cumple una restriccion CHECK';
        RETURN 'despacho: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'despacho: se recibio NULL en una columna obligatoria';
        RETURN 'despacho: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_despacho(INTEGER, INTEGER, DATE, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_despacho(
    p_id_despacho INTEGER,
    p_precio INTEGER DEFAULT NULL,
    p_fecha DATE DEFAULT NULL,
    p_estado VARCHAR DEFAULT NULL,
    p_id_historial_compra INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_precio IS NULL AND
       p_fecha IS NULL AND
       p_estado IS NULL AND
       p_id_historial_compra IS NULL THEN
        RAISE NOTICE 'despacho: no se indico ningun valor a modificar';
        RETURN 'despacho: 0 filas actualizadas';
    END IF;
    UPDATE despacho SET
        precio = COALESCE(p_precio, despacho.precio),
        fecha = COALESCE(p_fecha, despacho.fecha),
        estado = COALESCE(p_estado, despacho.estado),
        id_historial_compra = COALESCE(p_id_historial_compra, despacho.id_historial_compra)
    WHERE id_despacho = p_id_despacho;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'despacho: no existe la fila (%)', p_id_despacho;
        RETURN 'despacho: 0 filas actualizadas';
    END IF;

    RETURN format('despacho: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'despacho: alguna clave foranea referenciada no existe';
        RETURN 'despacho: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'despacho: la fila resultante no cumple una restriccion CHECK';
        RETURN 'despacho: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'despacho: la clave resultante ya existe';
        RETURN 'despacho: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_despacho(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_despacho(
    p_id_despacho INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM despacho
    WHERE id_despacho = p_id_despacho;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'despacho: no existe la fila (%)', p_id_despacho;
        RETURN 'despacho: 0 filas eliminadas';
    END IF;

    RETURN format('despacho: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'despacho: existen filas dependientes que impiden el borrado';
        RETURN 'despacho: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_despacho(999999, 3500, DATE '2024-03-15', 'En Preparación', 1);
-- SELECT fn_upd_despacho(999999, NULL, NULL, 'Entregado');
-- SELECT fn_del_despacho(999999);


-- 26. Tabla direccion

DROP FUNCTION IF EXISTS fn_ins_direccion(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_direccion(
    p_id_direccion INTEGER,
    p_codigo_postal INTEGER,
    p_calle VARCHAR,
    p_numero INTEGER,
    p_run_usuario VARCHAR,
    p_run_empresa VARCHAR,
    p_id_comuna INTEGER
)
RETURNS TEXT AS $$
BEGIN

    IF p_run_usuario IS NULL AND p_run_empresa IS NULL THEN
        RAISE NOTICE 'direccion: debe indicar un usuario o una empresa';
        RETURN 'direccion: no se inserto, titular ausente';
    END IF;    INSERT INTO direccion (id_direccion, codigo_postal, calle, numero, run_usuario, run_empresa, id_comuna)
    VALUES (p_id_direccion, p_codigo_postal, p_calle, p_numero, p_run_usuario, p_run_empresa, p_id_comuna);
    RETURN format('direccion: fila insertada (%s)', p_id_direccion);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'direccion: la clave primaria ya existe';
        RETURN 'direccion: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'direccion: alguna clave foranea referenciada no existe';
        RETURN 'direccion: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'direccion: la fila no cumple una restriccion CHECK';
        RETURN 'direccion: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'direccion: se recibio NULL en una columna obligatoria';
        RETURN 'direccion: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_direccion(INTEGER, INTEGER, VARCHAR, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_direccion(
    p_id_direccion INTEGER,
    p_codigo_postal INTEGER DEFAULT NULL,
    p_calle VARCHAR DEFAULT NULL,
    p_numero INTEGER DEFAULT NULL,
    p_id_comuna INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_codigo_postal IS NULL AND
       p_calle IS NULL AND
       p_numero IS NULL AND
       p_id_comuna IS NULL THEN
        RAISE NOTICE 'direccion: no se indico ningun valor a modificar';
        RETURN 'direccion: 0 filas actualizadas';
    END IF;
    UPDATE direccion SET
        codigo_postal = COALESCE(p_codigo_postal, direccion.codigo_postal),
        calle = COALESCE(p_calle, direccion.calle),
        numero = COALESCE(p_numero, direccion.numero),
        id_comuna = COALESCE(p_id_comuna, direccion.id_comuna)
    WHERE id_direccion = p_id_direccion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'direccion: no existe la fila (%)', p_id_direccion;
        RETURN 'direccion: 0 filas actualizadas';
    END IF;

    RETURN format('direccion: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'direccion: alguna clave foranea referenciada no existe';
        RETURN 'direccion: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'direccion: la fila resultante no cumple una restriccion CHECK';
        RETURN 'direccion: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'direccion: la clave resultante ya existe';
        RETURN 'direccion: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_direccion(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_direccion(
    p_id_direccion INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM direccion
    WHERE id_direccion = p_id_direccion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'direccion: no existe la fila (%)', p_id_direccion;
        RETURN 'direccion: 0 filas eliminadas';
    END IF;

    RETURN format('direccion: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'direccion: existen filas dependientes que impiden el borrado';
        RETURN 'direccion: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_direccion(999999, 5290000, 'Calle Prueba', 123, '11000001-2', NULL, 1);
-- SELECT fn_upd_direccion(999999, NULL, 'Pasaje Prueba');
-- SELECT fn_del_direccion(999999);


-- 27. Tabla empresa_transporte_despacho

DROP FUNCTION IF EXISTS fn_ins_empresa_transporte_despacho(VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_empresa_transporte_despacho(
    p_numero_seguimiento VARCHAR,
    p_id_despacho INTEGER,
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO empresa_transporte_despacho (numero_seguimiento, id_despacho, run_empresa)
    VALUES (p_numero_seguimiento, p_id_despacho, p_run_empresa);
    RETURN format('empresa_transporte_despacho: fila insertada (%s)', p_numero_seguimiento);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: la clave primaria ya existe';
        RETURN 'empresa_transporte_despacho: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: alguna clave foranea referenciada no existe';
        RETURN 'empresa_transporte_despacho: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: la fila no cumple una restriccion CHECK';
        RETURN 'empresa_transporte_despacho: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: se recibio NULL en una columna obligatoria';
        RETURN 'empresa_transporte_despacho: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_empresa_transporte_despacho(VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_empresa_transporte_despacho(
    p_numero_seguimiento VARCHAR,
    p_id_despacho INTEGER DEFAULT NULL,
    p_run_empresa VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_id_despacho IS NULL AND
       p_run_empresa IS NULL THEN
        RAISE NOTICE 'empresa_transporte_despacho: no se indico ningun valor a modificar';
        RETURN 'empresa_transporte_despacho: 0 filas actualizadas';
    END IF;
    UPDATE empresa_transporte_despacho SET
        id_despacho = COALESCE(p_id_despacho, empresa_transporte_despacho.id_despacho),
        run_empresa = COALESCE(p_run_empresa, empresa_transporte_despacho.run_empresa)
    WHERE numero_seguimiento = p_numero_seguimiento;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'empresa_transporte_despacho: no existe la fila (%)', p_numero_seguimiento;
        RETURN 'empresa_transporte_despacho: 0 filas actualizadas';
    END IF;

    RETURN format('empresa_transporte_despacho: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: alguna clave foranea referenciada no existe';
        RETURN 'empresa_transporte_despacho: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: la fila resultante no cumple una restriccion CHECK';
        RETURN 'empresa_transporte_despacho: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: la clave resultante ya existe';
        RETURN 'empresa_transporte_despacho: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_empresa_transporte_despacho(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_empresa_transporte_despacho(
    p_numero_seguimiento VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM empresa_transporte_despacho
    WHERE numero_seguimiento = p_numero_seguimiento;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'empresa_transporte_despacho: no existe la fila (%)', p_numero_seguimiento;
        RETURN 'empresa_transporte_despacho: 0 filas eliminadas';
    END IF;

    RETURN format('empresa_transporte_despacho: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'empresa_transporte_despacho: existen filas dependientes que impiden el borrado';
        RETURN 'empresa_transporte_despacho: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_empresa_transporte_despacho('SEG9999999', 1, '76000001-2');
-- SELECT fn_upd_empresa_transporte_despacho('SEG9999999', 2);
-- SELECT fn_del_empresa_transporte_despacho('SEG9999999');


-- 28. Tabla correo

DROP FUNCTION IF EXISTS fn_ins_correo(VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_correo(
    p_direccion_correo VARCHAR,
    p_run_usuario VARCHAR,
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
BEGIN

    IF p_run_usuario IS NULL AND p_run_empresa IS NULL THEN
        RAISE NOTICE 'correo: debe indicar un usuario o una empresa';
        RETURN 'correo: no se inserto, titular ausente';
    END IF;    INSERT INTO correo (direccion_correo, run_usuario, run_empresa)
    VALUES (p_direccion_correo, p_run_usuario, p_run_empresa);
    RETURN format('correo: fila insertada (%s)', p_direccion_correo);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'correo: la clave primaria ya existe';
        RETURN 'correo: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'correo: alguna clave foranea referenciada no existe';
        RETURN 'correo: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'correo: la fila no cumple una restriccion CHECK';
        RETURN 'correo: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'correo: se recibio NULL en una columna obligatoria';
        RETURN 'correo: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_correo(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_correo(
    p_direccion_correo VARCHAR,
    p_nueva_direccion_correo VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE correo SET
        direccion_correo = p_nueva_direccion_correo
    WHERE direccion_correo = p_direccion_correo;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'correo: no existe la fila (%)', p_direccion_correo;
        RETURN 'correo: 0 filas actualizadas';
    END IF;

    RETURN format('correo: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'correo: alguna clave foranea referenciada no existe';
        RETURN 'correo: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'correo: la fila resultante no cumple una restriccion CHECK';
        RETURN 'correo: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'correo: la clave resultante ya existe';
        RETURN 'correo: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_correo(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_correo(
    p_direccion_correo VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM correo
    WHERE direccion_correo = p_direccion_correo;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'correo: no existe la fila (%)', p_direccion_correo;
        RETURN 'correo: 0 filas eliminadas';
    END IF;

    RETURN format('correo: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'correo: existen filas dependientes que impiden el borrado';
        RETURN 'correo: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_correo('prueba@correo.cl', '11000001-2', NULL);
-- SELECT fn_upd_correo('prueba@correo.cl', 'prueba2@correo.cl');
-- SELECT fn_del_correo('prueba2@correo.cl');


-- 29. Tabla telefono

DROP FUNCTION IF EXISTS fn_ins_telefono(VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_telefono(
    p_numero VARCHAR,
    p_prefijo INTEGER,
    p_run_usuario VARCHAR
)
RETURNS TEXT AS $$
BEGIN

    IF p_run_usuario IS NULL THEN
        RAISE NOTICE 'telefono: el usuario titular es obligatorio';
        RETURN 'telefono: no se inserto, titular ausente';
    END IF;    INSERT INTO telefono (numero, prefijo, run_usuario)
    VALUES (p_numero, p_prefijo, p_run_usuario);
    RETURN format('telefono: fila insertada (%s)', p_numero);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'telefono: la clave primaria ya existe';
        RETURN 'telefono: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'telefono: alguna clave foranea referenciada no existe';
        RETURN 'telefono: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'telefono: la fila no cumple una restriccion CHECK';
        RETURN 'telefono: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'telefono: se recibio NULL en una columna obligatoria';
        RETURN 'telefono: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_telefono(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_telefono(
    p_numero VARCHAR,
    p_nuevo_numero VARCHAR,
    p_prefijo INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE telefono SET
        numero = p_nuevo_numero,
        prefijo = COALESCE(p_prefijo, telefono.prefijo)
    WHERE numero = p_numero;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'telefono: no existe la fila (%)', p_numero;
        RETURN 'telefono: 0 filas actualizadas';
    END IF;

    RETURN format('telefono: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'telefono: alguna clave foranea referenciada no existe';
        RETURN 'telefono: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'telefono: la fila resultante no cumple una restriccion CHECK';
        RETURN 'telefono: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'telefono: la clave resultante ya existe';
        RETURN 'telefono: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_telefono(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_telefono(
    p_numero VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM telefono
    WHERE numero = p_numero;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'telefono: no existe la fila (%)', p_numero;
        RETURN 'telefono: 0 filas eliminadas';
    END IF;

    RETURN format('telefono: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'telefono: existen filas dependientes que impiden el borrado';
        RETURN 'telefono: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_telefono('980099999', 56, '11000001-2');
-- SELECT fn_upd_telefono('980099999', '980088888', 56);
-- SELECT fn_del_telefono('980088888');


-- 30. Tabla mensajeria

DROP FUNCTION IF EXISTS fn_ins_mensajeria(INTEGER, TEXT, DATE, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_mensajeria(
    p_id_mensajeria INTEGER,
    p_comentario TEXT,
    p_fecha DATE,
    p_run_empresa VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO mensajeria (id_mensajeria, comentario, fecha, run_empresa)
    VALUES (p_id_mensajeria, p_comentario, p_fecha, p_run_empresa);
    RETURN format('mensajeria: fila insertada (%s)', p_id_mensajeria);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'mensajeria: la clave primaria ya existe';
        RETURN 'mensajeria: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'mensajeria: alguna clave foranea referenciada no existe';
        RETURN 'mensajeria: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'mensajeria: la fila no cumple una restriccion CHECK';
        RETURN 'mensajeria: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'mensajeria: se recibio NULL en una columna obligatoria';
        RETURN 'mensajeria: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_mensajeria(INTEGER, TEXT, DATE, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_mensajeria(
    p_id_mensajeria INTEGER,
    p_comentario TEXT DEFAULT NULL,
    p_fecha DATE DEFAULT NULL,
    p_run_empresa VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_comentario IS NULL AND
       p_fecha IS NULL AND
       p_run_empresa IS NULL THEN
        RAISE NOTICE 'mensajeria: no se indico ningun valor a modificar';
        RETURN 'mensajeria: 0 filas actualizadas';
    END IF;
    UPDATE mensajeria SET
        comentario = COALESCE(p_comentario, mensajeria.comentario),
        fecha = COALESCE(p_fecha, mensajeria.fecha),
        run_empresa = COALESCE(p_run_empresa, mensajeria.run_empresa)
    WHERE id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'mensajeria: no existe la fila (%)', p_id_mensajeria;
        RETURN 'mensajeria: 0 filas actualizadas';
    END IF;

    RETURN format('mensajeria: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'mensajeria: alguna clave foranea referenciada no existe';
        RETURN 'mensajeria: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'mensajeria: la fila resultante no cumple una restriccion CHECK';
        RETURN 'mensajeria: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'mensajeria: la clave resultante ya existe';
        RETURN 'mensajeria: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_mensajeria(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_mensajeria(
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM mensajeria
    WHERE id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'mensajeria: no existe la fila (%)', p_id_mensajeria;
        RETURN 'mensajeria: 0 filas eliminadas';
    END IF;

    RETURN format('mensajeria: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'mensajeria: existen filas dependientes que impiden el borrado';
        RETURN 'mensajeria: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_mensajeria(999999, 'Consulta de prueba', DATE '2024-03-15', '76000001-2');
-- SELECT fn_upd_mensajeria(999999, 'Consulta de prueba editada');
-- SELECT fn_del_mensajeria(999999);


-- 31. Tabla devolucion

DROP FUNCTION IF EXISTS fn_ins_devolucion(INTEGER, TEXT, DATE, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_devolucion(
    p_id_devolucion INTEGER,
    p_motivo TEXT,
    p_fecha DATE,
    p_numero_seguimiento VARCHAR,
    p_id_despacho INTEGER,
    p_estado VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO devolucion (id_devolucion, motivo, fecha, numero_seguimiento, id_despacho, estado)
    VALUES (p_id_devolucion, p_motivo, p_fecha, p_numero_seguimiento, p_id_despacho, p_estado);
    RETURN format('devolucion: fila insertada (%s)', p_id_devolucion);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'devolucion: la clave primaria ya existe';
        RETURN 'devolucion: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'devolucion: alguna clave foranea referenciada no existe';
        RETURN 'devolucion: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'devolucion: la fila no cumple una restriccion CHECK';
        RETURN 'devolucion: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'devolucion: se recibio NULL en una columna obligatoria';
        RETURN 'devolucion: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_devolucion(INTEGER, TEXT, DATE, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_devolucion(
    p_id_devolucion INTEGER,
    p_motivo TEXT DEFAULT NULL,
    p_fecha DATE DEFAULT NULL,
    p_numero_seguimiento VARCHAR DEFAULT NULL,
    p_id_despacho INTEGER DEFAULT NULL,
    p_estado VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_motivo IS NULL AND
       p_fecha IS NULL AND
       p_numero_seguimiento IS NULL AND
       p_id_despacho IS NULL AND
       p_estado IS NULL THEN
        RAISE NOTICE 'devolucion: no se indico ningun valor a modificar';
        RETURN 'devolucion: 0 filas actualizadas';
    END IF;
    UPDATE devolucion SET
        motivo = COALESCE(p_motivo, devolucion.motivo),
        fecha = COALESCE(p_fecha, devolucion.fecha),
        numero_seguimiento = COALESCE(p_numero_seguimiento, devolucion.numero_seguimiento),
        id_despacho = COALESCE(p_id_despacho, devolucion.id_despacho),
        estado = COALESCE(p_estado, devolucion.estado)
    WHERE id_devolucion = p_id_devolucion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'devolucion: no existe la fila (%)', p_id_devolucion;
        RETURN 'devolucion: 0 filas actualizadas';
    END IF;

    RETURN format('devolucion: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'devolucion: alguna clave foranea referenciada no existe';
        RETURN 'devolucion: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'devolucion: la fila resultante no cumple una restriccion CHECK';
        RETURN 'devolucion: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'devolucion: la clave resultante ya existe';
        RETURN 'devolucion: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_devolucion(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_devolucion(
    p_id_devolucion INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM devolucion
    WHERE id_devolucion = p_id_devolucion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'devolucion: no existe la fila (%)', p_id_devolucion;
        RETURN 'devolucion: 0 filas eliminadas';
    END IF;

    RETURN format('devolucion: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'devolucion: existen filas dependientes que impiden el borrado';
        RETURN 'devolucion: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_devolucion(999999, 'Producto danado', DATE '2024-03-15', NULL, 1, 'Pendiente');
-- SELECT fn_upd_devolucion(999999, NULL, NULL, NULL, NULL, 'Aprobada');
-- SELECT fn_del_devolucion(999999);


-- 32. Tabla lista_deseos_wishlist

DROP FUNCTION IF EXISTS fn_ins_lista_deseos_wishlist(VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_lista_deseos_wishlist(
    p_nombre VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO lista_deseos_wishlist (nombre)
    VALUES (p_nombre);
    RETURN format('lista_deseos_wishlist: fila insertada (%s)', p_nombre);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: la clave primaria ya existe';
        RETURN 'lista_deseos_wishlist: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: alguna clave foranea referenciada no existe';
        RETURN 'lista_deseos_wishlist: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: la fila no cumple una restriccion CHECK';
        RETURN 'lista_deseos_wishlist: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: se recibio NULL en una columna obligatoria';
        RETURN 'lista_deseos_wishlist: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_lista_deseos_wishlist(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_lista_deseos_wishlist(
    p_nombre VARCHAR,
    p_nuevo_nombre VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE lista_deseos_wishlist SET
        nombre = p_nuevo_nombre
    WHERE nombre = p_nombre;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'lista_deseos_wishlist: no existe la fila (%)', p_nombre;
        RETURN 'lista_deseos_wishlist: 0 filas actualizadas';
    END IF;

    RETURN format('lista_deseos_wishlist: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: alguna clave foranea referenciada no existe';
        RETURN 'lista_deseos_wishlist: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: la fila resultante no cumple una restriccion CHECK';
        RETURN 'lista_deseos_wishlist: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: la clave resultante ya existe';
        RETURN 'lista_deseos_wishlist: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_lista_deseos_wishlist(VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_lista_deseos_wishlist(
    p_nombre VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM lista_deseos_wishlist
    WHERE nombre = p_nombre;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'lista_deseos_wishlist: no existe la fila (%)', p_nombre;
        RETURN 'lista_deseos_wishlist: 0 filas eliminadas';
    END IF;

    RETURN format('lista_deseos_wishlist: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'lista_deseos_wishlist: existen filas dependientes que impiden el borrado';
        RETURN 'lista_deseos_wishlist: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_lista_deseos_wishlist('Lista_Prueba');
-- SELECT fn_upd_lista_deseos_wishlist('Lista_Prueba', 'Lista_Prueba2');
-- SELECT fn_del_lista_deseos_wishlist('Lista_Prueba2');


-- 33. Tabla solicita

DROP FUNCTION IF EXISTS fn_ins_solicita(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_ins_solicita(
    p_id_solicitud INTEGER,
    p_id_cotizacion INTEGER,
    p_run_usuario VARCHAR,
    p_precio INTEGER,
    p_estado VARCHAR,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO solicita (id_solicitud, id_cotizacion, run_usuario, precio, estado, fecha_inicio, fecha_fin)
    VALUES (p_id_solicitud, p_id_cotizacion, p_run_usuario, p_precio, p_estado, p_fecha_inicio, p_fecha_fin);
    RETURN format('solicita: fila insertada (%s)', p_id_solicitud);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'solicita: la clave primaria ya existe';
        RETURN 'solicita: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'solicita: alguna clave foranea referenciada no existe';
        RETURN 'solicita: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'solicita: la fila no cumple una restriccion CHECK';
        RETURN 'solicita: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'solicita: se recibio NULL en una columna obligatoria';
        RETURN 'solicita: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_solicita(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_upd_solicita(
    p_id_solicitud INTEGER,
    p_id_cotizacion INTEGER DEFAULT NULL,
    p_run_usuario VARCHAR DEFAULT NULL,
    p_precio INTEGER DEFAULT NULL,
    p_estado VARCHAR DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_id_cotizacion IS NULL AND
       p_run_usuario IS NULL AND
       p_precio IS NULL AND
       p_estado IS NULL AND
       p_fecha_inicio IS NULL AND
       p_fecha_fin IS NULL THEN
        RAISE NOTICE 'solicita: no se indico ningun valor a modificar';
        RETURN 'solicita: 0 filas actualizadas';
    END IF;
    UPDATE solicita SET
        id_cotizacion = COALESCE(p_id_cotizacion, solicita.id_cotizacion),
        run_usuario = COALESCE(p_run_usuario, solicita.run_usuario),
        precio = COALESCE(p_precio, solicita.precio),
        estado = COALESCE(p_estado, solicita.estado),
        fecha_inicio = COALESCE(p_fecha_inicio, solicita.fecha_inicio),
        fecha_fin = COALESCE(p_fecha_fin, solicita.fecha_fin)
    WHERE id_solicitud = p_id_solicitud;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'solicita: no existe la fila (%)', p_id_solicitud;
        RETURN 'solicita: 0 filas actualizadas';
    END IF;

    RETURN format('solicita: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'solicita: alguna clave foranea referenciada no existe';
        RETURN 'solicita: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'solicita: la fila resultante no cumple una restriccion CHECK';
        RETURN 'solicita: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'solicita: la clave resultante ya existe';
        RETURN 'solicita: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_solicita(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_solicita(
    p_id_solicitud INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM solicita
    WHERE id_solicitud = p_id_solicitud;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'solicita: no existe la fila (%)', p_id_solicitud;
        RETURN 'solicita: 0 filas eliminadas';
    END IF;

    RETURN format('solicita: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'solicita: existen filas dependientes que impiden el borrado';
        RETURN 'solicita: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_solicita(999999, 1, '11000001-2', 15000, 'Solicitada', DATE '2024-03-01', DATE '2024-03-15');
-- SELECT fn_upd_solicita(999999, NULL, NULL, NULL, 'Respondida');
-- SELECT fn_del_solicita(999999);


-- 34. Tabla contacto

DROP FUNCTION IF EXISTS fn_ins_contacto(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_contacto(
    p_id_telefono INTEGER,
    p_id_usuario VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO contacto (id_telefono, id_usuario)
    VALUES (p_id_telefono, p_id_usuario);
    RETURN format('contacto: fila insertada (%s)', p_id_telefono);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'contacto: la clave primaria ya existe';
        RETURN 'contacto: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'contacto: alguna clave foranea referenciada no existe';
        RETURN 'contacto: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'contacto: la fila no cumple una restriccion CHECK';
        RETURN 'contacto: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'contacto: se recibio NULL en una columna obligatoria';
        RETURN 'contacto: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_contacto(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_contacto(
    p_id_telefono INTEGER,
    p_id_usuario VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_id_usuario IS NULL THEN
        RAISE NOTICE 'contacto: no se indico ningun valor a modificar';
        RETURN 'contacto: 0 filas actualizadas';
    END IF;
    UPDATE contacto SET
        id_usuario = COALESCE(p_id_usuario, contacto.id_usuario)
    WHERE id_telefono = p_id_telefono;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'contacto: no existe la fila (%)', p_id_telefono;
        RETURN 'contacto: 0 filas actualizadas';
    END IF;

    RETURN format('contacto: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'contacto: alguna clave foranea referenciada no existe';
        RETURN 'contacto: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'contacto: la fila resultante no cumple una restriccion CHECK';
        RETURN 'contacto: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'contacto: la clave resultante ya existe';
        RETURN 'contacto: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_contacto(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_contacto(
    p_id_telefono INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM contacto
    WHERE id_telefono = p_id_telefono;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'contacto: no existe la fila (%)', p_id_telefono;
        RETURN 'contacto: 0 filas eliminadas';
    END IF;

    RETURN format('contacto: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'contacto: existen filas dependientes que impiden el borrado';
        RETURN 'contacto: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_contacto(999999, '11000001-2');
-- SELECT fn_upd_contacto(999999, '11000002-3');
-- SELECT fn_del_contacto(999999);


-- 35. Tabla paga

DROP FUNCTION IF EXISTS fn_ins_paga(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_paga(
    p_id_venta INTEGER,
    p_medio_pago VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO paga (id_venta, medio_pago)
    VALUES (p_id_venta, p_medio_pago);
    RETURN format('paga: fila insertada (%s)', p_id_venta);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'paga: la clave primaria ya existe';
        RETURN 'paga: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'paga: alguna clave foranea referenciada no existe';
        RETURN 'paga: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'paga: la fila no cumple una restriccion CHECK';
        RETURN 'paga: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'paga: se recibio NULL en una columna obligatoria';
        RETURN 'paga: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_paga(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_paga(
    p_id_venta INTEGER,
    p_medio_pago VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_medio_pago IS NULL THEN
        RAISE NOTICE 'paga: no se indico ningun valor a modificar';
        RETURN 'paga: 0 filas actualizadas';
    END IF;
    UPDATE paga SET
        medio_pago = COALESCE(p_medio_pago, paga.medio_pago)
    WHERE id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'paga: no existe la fila (%)', p_id_venta;
        RETURN 'paga: 0 filas actualizadas';
    END IF;

    RETURN format('paga: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'paga: alguna clave foranea referenciada no existe';
        RETURN 'paga: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'paga: la fila resultante no cumple una restriccion CHECK';
        RETURN 'paga: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'paga: la clave resultante ya existe';
        RETURN 'paga: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_paga(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_paga(
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM paga
    WHERE id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'paga: no existe la fila (%)', p_id_venta;
        RETURN 'paga: 0 filas eliminadas';
    END IF;

    RETURN format('paga: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'paga: existen filas dependientes que impiden el borrado';
        RETURN 'paga: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_paga(999, 'TRF0000001');
-- SELECT fn_upd_paga(999, 'TRF0000002');
-- SELECT fn_del_paga(999);


-- 36. Tabla genera

DROP FUNCTION IF EXISTS fn_ins_genera(VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_genera(
    p_id_medio_pago VARCHAR,
    p_id_historial_compra INTEGER,
    p_estado VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO genera (id_medio_pago, id_historial_compra, estado)
    VALUES (p_id_medio_pago, p_id_historial_compra, p_estado);
    RETURN format('genera: fila insertada (%s, %s)', p_id_medio_pago, p_id_historial_compra);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'genera: la clave primaria ya existe';
        RETURN 'genera: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'genera: alguna clave foranea referenciada no existe';
        RETURN 'genera: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'genera: la fila no cumple una restriccion CHECK';
        RETURN 'genera: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'genera: se recibio NULL en una columna obligatoria';
        RETURN 'genera: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_genera(VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_genera(
    p_id_medio_pago VARCHAR,
    p_id_historial_compra INTEGER,
    p_estado VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_estado IS NULL THEN
        RAISE NOTICE 'genera: no se indico ningun valor a modificar';
        RETURN 'genera: 0 filas actualizadas';
    END IF;
    UPDATE genera SET
        estado = COALESCE(p_estado, genera.estado)
    WHERE id_medio_pago = p_id_medio_pago
      AND id_historial_compra = p_id_historial_compra;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'genera: no existe la fila (%, %)', p_id_medio_pago, p_id_historial_compra;
        RETURN 'genera: 0 filas actualizadas';
    END IF;

    RETURN format('genera: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'genera: alguna clave foranea referenciada no existe';
        RETURN 'genera: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'genera: la fila resultante no cumple una restriccion CHECK';
        RETURN 'genera: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'genera: la clave resultante ya existe';
        RETURN 'genera: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_genera(VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_genera(
    p_id_medio_pago VARCHAR,
    p_id_historial_compra INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM genera
    WHERE id_medio_pago = p_id_medio_pago
      AND id_historial_compra = p_id_historial_compra;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'genera: no existe la fila (%, %)', p_id_medio_pago, p_id_historial_compra;
        RETURN 'genera: 0 filas eliminadas';
    END IF;

    RETURN format('genera: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'genera: existen filas dependientes que impiden el borrado';
        RETURN 'genera: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_genera('TRF0000002', 1, 'Pendiente');
-- SELECT fn_upd_genera('TRF0000002', 1, 'Completada');
-- SELECT fn_del_genera('TRF0000002', 1);


-- 37. Tabla subdivide

DROP FUNCTION IF EXISTS fn_ins_subdivide(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_subdivide(
    p_nombre_a_categoria VARCHAR,
    p_nombre_b_categoria VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO subdivide (nombre_a_categoria, nombre_b_categoria)
    VALUES (p_nombre_a_categoria, p_nombre_b_categoria);
    RETURN format('subdivide: fila insertada (%s, %s)', p_nombre_a_categoria, p_nombre_b_categoria);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'subdivide: la clave primaria ya existe';
        RETURN 'subdivide: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'subdivide: alguna clave foranea referenciada no existe';
        RETURN 'subdivide: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'subdivide: la fila no cumple una restriccion CHECK';
        RETURN 'subdivide: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'subdivide: se recibio NULL en una columna obligatoria';
        RETURN 'subdivide: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_subdivide(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_subdivide(
    p_nombre_a_categoria VARCHAR,
    p_nombre_b_categoria VARCHAR,
    p_nuevo_nombre_a_categoria VARCHAR,
    p_nuevo_nombre_b_categoria VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE subdivide SET
        nombre_a_categoria = p_nuevo_nombre_a_categoria,
        nombre_b_categoria = p_nuevo_nombre_b_categoria
    WHERE nombre_a_categoria = p_nombre_a_categoria
      AND nombre_b_categoria = p_nombre_b_categoria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'subdivide: no existe la fila (%, %)', p_nombre_a_categoria, p_nombre_b_categoria;
        RETURN 'subdivide: 0 filas actualizadas';
    END IF;

    RETURN format('subdivide: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'subdivide: alguna clave foranea referenciada no existe';
        RETURN 'subdivide: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'subdivide: la fila resultante no cumple una restriccion CHECK';
        RETURN 'subdivide: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'subdivide: la clave resultante ya existe';
        RETURN 'subdivide: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_subdivide(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_subdivide(
    p_nombre_a_categoria VARCHAR,
    p_nombre_b_categoria VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM subdivide
    WHERE nombre_a_categoria = p_nombre_a_categoria
      AND nombre_b_categoria = p_nombre_b_categoria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'subdivide: no existe la fila (%, %)', p_nombre_a_categoria, p_nombre_b_categoria;
        RETURN 'subdivide: 0 filas eliminadas';
    END IF;

    RETURN format('subdivide: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'subdivide: existen filas dependientes que impiden el borrado';
        RETURN 'subdivide: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_subdivide('Cat_0001', 'Cat_0003');
-- SELECT fn_upd_subdivide('Cat_0001', 'Cat_0003', 'Cat_0001', 'Cat_0004');
-- SELECT fn_del_subdivide('Cat_0001', 'Cat_0004');


-- 38. Tabla incluye

DROP FUNCTION IF EXISTS fn_ins_incluye(INTEGER, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_incluye(
    p_id_venta INTEGER,
    p_sku_producto VARCHAR,
    p_sku_servicio VARCHAR,
    p_run_usuario VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO incluye (id_venta, sku_producto, sku_servicio, run_usuario)
    VALUES (p_id_venta, p_sku_producto, p_sku_servicio, p_run_usuario);
    RETURN format('incluye: fila insertada (%s, %s, %s)', p_id_venta, p_sku_producto, p_sku_servicio);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'incluye: la clave primaria ya existe';
        RETURN 'incluye: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'incluye: alguna clave foranea referenciada no existe';
        RETURN 'incluye: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'incluye: la fila no cumple una restriccion CHECK';
        RETURN 'incluye: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'incluye: se recibio NULL en una columna obligatoria';
        RETURN 'incluye: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_incluye(INTEGER, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_incluye(
    p_id_venta INTEGER,
    p_sku_producto VARCHAR,
    p_sku_servicio VARCHAR,
    p_nuevo_id_venta INTEGER,
    p_nuevo_sku_producto VARCHAR,
    p_nuevo_sku_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE incluye SET
        id_venta = p_nuevo_id_venta,
        sku_producto = p_nuevo_sku_producto,
        sku_servicio = p_nuevo_sku_servicio
    WHERE id_venta = p_id_venta
      AND sku_producto = p_sku_producto
      AND sku_servicio = p_sku_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'incluye: no existe la fila (%, %, %)', p_id_venta, p_sku_producto, p_sku_servicio;
        RETURN 'incluye: 0 filas actualizadas';
    END IF;

    RETURN format('incluye: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'incluye: alguna clave foranea referenciada no existe';
        RETURN 'incluye: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'incluye: la fila resultante no cumple una restriccion CHECK';
        RETURN 'incluye: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'incluye: la clave resultante ya existe';
        RETURN 'incluye: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_incluye(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_incluye(
    p_id_venta INTEGER,
    p_sku_producto VARCHAR,
    p_sku_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM incluye
    WHERE id_venta = p_id_venta
      AND sku_producto = p_sku_producto
      AND sku_servicio = p_sku_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'incluye: no existe la fila (%, %, %)', p_id_venta, p_sku_producto, p_sku_servicio;
        RETURN 'incluye: 0 filas eliminadas';
    END IF;

    RETURN format('incluye: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'incluye: existen filas dependientes que impiden el borrado';
        RETURN 'incluye: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_incluye(2, 'P0000002', 'S0000002', '11000001-2');
-- SELECT fn_upd_incluye(2, 'P0000002', 'S0000002', 3, 'P0000003', 'S0000003');
-- SELECT fn_del_incluye(3, 'P0000003', 'S0000003');


-- 39. Tabla vende

DROP FUNCTION IF EXISTS fn_ins_vende(VARCHAR, VARCHAR, INTEGER, MONEY);
CREATE OR REPLACE FUNCTION fn_ins_vende(
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR,
    p_id_caracteristicas INTEGER,
    p_precio MONEY
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO vende (id_usuario, id_producto, id_caracteristicas, precio)
    VALUES (p_id_usuario, p_id_producto, p_id_caracteristicas, p_precio);
    RETURN format('vende: fila insertada (%s, %s)', p_id_usuario, p_id_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'vende: la clave primaria ya existe';
        RETURN 'vende: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'vende: alguna clave foranea referenciada no existe';
        RETURN 'vende: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'vende: la fila no cumple una restriccion CHECK';
        RETURN 'vende: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'vende: se recibio NULL en una columna obligatoria';
        RETURN 'vende: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_vende(VARCHAR, VARCHAR, INTEGER, MONEY);
CREATE OR REPLACE FUNCTION fn_upd_vende(
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR,
    p_id_caracteristicas INTEGER DEFAULT NULL,
    p_precio MONEY DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_id_caracteristicas IS NULL AND
       p_precio IS NULL THEN
        RAISE NOTICE 'vende: no se indico ningun valor a modificar';
        RETURN 'vende: 0 filas actualizadas';
    END IF;
    UPDATE vende SET
        id_caracteristicas = COALESCE(p_id_caracteristicas, vende.id_caracteristicas),
        precio = COALESCE(p_precio, vende.precio)
    WHERE id_usuario = p_id_usuario
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'vende: no existe la fila (%, %)', p_id_usuario, p_id_producto;
        RETURN 'vende: 0 filas actualizadas';
    END IF;

    RETURN format('vende: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'vende: alguna clave foranea referenciada no existe';
        RETURN 'vende: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'vende: la fila resultante no cumple una restriccion CHECK';
        RETURN 'vende: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'vende: la clave resultante ya existe';
        RETURN 'vende: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_vende(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_vende(
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM vende
    WHERE id_usuario = p_id_usuario
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'vende: no existe la fila (%, %)', p_id_usuario, p_id_producto;
        RETURN 'vende: 0 filas eliminadas';
    END IF;

    RETURN format('vende: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'vende: existen filas dependientes que impiden el borrado';
        RETURN 'vende: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_vende('11000001-2', 'P0000500', 1, 15000::money);
-- SELECT fn_upd_vende('11000001-2', 'P0000500', NULL, 16000::money);
-- SELECT fn_del_vende('11000001-2', 'P0000500');


-- 40. Tabla comercializa

DROP FUNCTION IF EXISTS fn_ins_comercializa(VARCHAR, VARCHAR, INTEGER, MONEY);
CREATE OR REPLACE FUNCTION fn_ins_comercializa(
    p_id_empresa VARCHAR,
    p_id_producto VARCHAR,
    p_id_caracteristicas INTEGER,
    p_precio MONEY
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO comercializa (id_empresa, id_producto, id_caracteristicas, precio)
    VALUES (p_id_empresa, p_id_producto, p_id_caracteristicas, p_precio);
    RETURN format('comercializa: fila insertada (%s, %s)', p_id_empresa, p_id_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'comercializa: la clave primaria ya existe';
        RETURN 'comercializa: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'comercializa: alguna clave foranea referenciada no existe';
        RETURN 'comercializa: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'comercializa: la fila no cumple una restriccion CHECK';
        RETURN 'comercializa: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'comercializa: se recibio NULL en una columna obligatoria';
        RETURN 'comercializa: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_comercializa(VARCHAR, VARCHAR, INTEGER, MONEY);
CREATE OR REPLACE FUNCTION fn_upd_comercializa(
    p_id_empresa VARCHAR,
    p_id_producto VARCHAR,
    p_id_caracteristicas INTEGER DEFAULT NULL,
    p_precio MONEY DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_id_caracteristicas IS NULL AND
       p_precio IS NULL THEN
        RAISE NOTICE 'comercializa: no se indico ningun valor a modificar';
        RETURN 'comercializa: 0 filas actualizadas';
    END IF;
    UPDATE comercializa SET
        id_caracteristicas = COALESCE(p_id_caracteristicas, comercializa.id_caracteristicas),
        precio = COALESCE(p_precio, comercializa.precio)
    WHERE id_empresa = p_id_empresa
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'comercializa: no existe la fila (%, %)', p_id_empresa, p_id_producto;
        RETURN 'comercializa: 0 filas actualizadas';
    END IF;

    RETURN format('comercializa: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'comercializa: alguna clave foranea referenciada no existe';
        RETURN 'comercializa: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'comercializa: la fila resultante no cumple una restriccion CHECK';
        RETURN 'comercializa: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'comercializa: la clave resultante ya existe';
        RETURN 'comercializa: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_comercializa(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_comercializa(
    p_id_empresa VARCHAR,
    p_id_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM comercializa
    WHERE id_empresa = p_id_empresa
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'comercializa: no existe la fila (%, %)', p_id_empresa, p_id_producto;
        RETURN 'comercializa: 0 filas eliminadas';
    END IF;

    RETURN format('comercializa: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'comercializa: existen filas dependientes que impiden el borrado';
        RETURN 'comercializa: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_comercializa('76000001-2', 'P0000500', 1, 12000::money);
-- SELECT fn_upd_comercializa('76000001-2', 'P0000500', NULL, 13000::money);
-- SELECT fn_del_comercializa('76000001-2', 'P0000500');


-- 41. Tabla pertenece

DROP FUNCTION IF EXISTS fn_ins_pertenece(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_pertenece(
    p_nombre_categoria VARCHAR,
    p_id_producto VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO pertenece (nombre_categoria, id_producto)
    VALUES (p_nombre_categoria, p_id_producto);
    RETURN format('pertenece: fila insertada (%s, %s)', p_nombre_categoria, p_id_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'pertenece: la clave primaria ya existe';
        RETURN 'pertenece: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'pertenece: alguna clave foranea referenciada no existe';
        RETURN 'pertenece: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'pertenece: la fila no cumple una restriccion CHECK';
        RETURN 'pertenece: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'pertenece: se recibio NULL en una columna obligatoria';
        RETURN 'pertenece: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_pertenece(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_pertenece(
    p_nombre_categoria VARCHAR,
    p_id_producto VARCHAR,
    p_nuevo_nombre_categoria VARCHAR,
    p_nuevo_id_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE pertenece SET
        nombre_categoria = p_nuevo_nombre_categoria,
        id_producto = p_nuevo_id_producto
    WHERE nombre_categoria = p_nombre_categoria
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'pertenece: no existe la fila (%, %)', p_nombre_categoria, p_id_producto;
        RETURN 'pertenece: 0 filas actualizadas';
    END IF;

    RETURN format('pertenece: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'pertenece: alguna clave foranea referenciada no existe';
        RETURN 'pertenece: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'pertenece: la fila resultante no cumple una restriccion CHECK';
        RETURN 'pertenece: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'pertenece: la clave resultante ya existe';
        RETURN 'pertenece: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_pertenece(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_pertenece(
    p_nombre_categoria VARCHAR,
    p_id_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM pertenece
    WHERE nombre_categoria = p_nombre_categoria
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'pertenece: no existe la fila (%, %)', p_nombre_categoria, p_id_producto;
        RETURN 'pertenece: 0 filas eliminadas';
    END IF;

    RETURN format('pertenece: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'pertenece: existen filas dependientes que impiden el borrado';
        RETURN 'pertenece: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_pertenece('Cat_0002', 'P0000001');
-- SELECT fn_upd_pertenece('Cat_0002', 'P0000001', 'Cat_0003', 'P0000001');
-- SELECT fn_del_pertenece('Cat_0003', 'P0000001');


-- 42. Tabla vincula

DROP FUNCTION IF EXISTS fn_ins_vincula(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_vincula(
    p_id_servicio VARCHAR,
    p_id_categoria VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO vincula (id_servicio, id_categoria)
    VALUES (p_id_servicio, p_id_categoria);
    RETURN format('vincula: fila insertada (%s, %s)', p_id_categoria, p_id_servicio);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'vincula: la clave primaria ya existe';
        RETURN 'vincula: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'vincula: alguna clave foranea referenciada no existe';
        RETURN 'vincula: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'vincula: la fila no cumple una restriccion CHECK';
        RETURN 'vincula: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'vincula: se recibio NULL en una columna obligatoria';
        RETURN 'vincula: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_vincula(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_vincula(
    p_id_servicio VARCHAR,
    p_id_categoria VARCHAR,
    p_nuevo_id_servicio VARCHAR,
    p_nuevo_id_categoria VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE vincula SET
        id_servicio = p_nuevo_id_servicio,
        id_categoria = p_nuevo_id_categoria
    WHERE id_servicio = p_id_servicio
      AND id_categoria = p_id_categoria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'vincula: no existe la fila (%, %)', p_id_categoria, p_id_servicio;
        RETURN 'vincula: 0 filas actualizadas';
    END IF;

    RETURN format('vincula: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'vincula: alguna clave foranea referenciada no existe';
        RETURN 'vincula: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'vincula: la fila resultante no cumple una restriccion CHECK';
        RETURN 'vincula: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'vincula: la clave resultante ya existe';
        RETURN 'vincula: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_vincula(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_vincula(
    p_id_servicio VARCHAR,
    p_id_categoria VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM vincula
    WHERE id_servicio = p_id_servicio
      AND id_categoria = p_id_categoria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'vincula: no existe la fila (%, %)', p_id_categoria, p_id_servicio;
        RETURN 'vincula: 0 filas eliminadas';
    END IF;

    RETURN format('vincula: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'vincula: existen filas dependientes que impiden el borrado';
        RETURN 'vincula: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_vincula('S0000001', 'Cat_0002');
-- SELECT fn_upd_vincula('S0000001', 'Cat_0002', 'S0000001', 'Cat_0003');
-- SELECT fn_del_vincula('S0000001', 'Cat_0003');


-- 43. Tabla contiene

DROP FUNCTION IF EXISTS fn_ins_contiene(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_contiene(
    p_id_caracteristicas INTEGER,
    p_sku_producto VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO contiene (id_caracteristicas, sku_producto)
    VALUES (p_id_caracteristicas, p_sku_producto);
    RETURN format('contiene: fila insertada (%s, %s)', p_id_caracteristicas, p_sku_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'contiene: la clave primaria ya existe';
        RETURN 'contiene: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'contiene: alguna clave foranea referenciada no existe';
        RETURN 'contiene: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'contiene: la fila no cumple una restriccion CHECK';
        RETURN 'contiene: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'contiene: se recibio NULL en una columna obligatoria';
        RETURN 'contiene: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_contiene(INTEGER, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_contiene(
    p_id_caracteristicas INTEGER,
    p_sku_producto VARCHAR,
    p_nuevo_id_caracteristicas INTEGER,
    p_nuevo_sku_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE contiene SET
        id_caracteristicas = p_nuevo_id_caracteristicas,
        sku_producto = p_nuevo_sku_producto
    WHERE id_caracteristicas = p_id_caracteristicas
      AND sku_producto = p_sku_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'contiene: no existe la fila (%, %)', p_id_caracteristicas, p_sku_producto;
        RETURN 'contiene: 0 filas actualizadas';
    END IF;

    RETURN format('contiene: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'contiene: alguna clave foranea referenciada no existe';
        RETURN 'contiene: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'contiene: la fila resultante no cumple una restriccion CHECK';
        RETURN 'contiene: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'contiene: la clave resultante ya existe';
        RETURN 'contiene: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_contiene(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_contiene(
    p_id_caracteristicas INTEGER,
    p_sku_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM contiene
    WHERE id_caracteristicas = p_id_caracteristicas
      AND sku_producto = p_sku_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'contiene: no existe la fila (%, %)', p_id_caracteristicas, p_sku_producto;
        RETURN 'contiene: 0 filas eliminadas';
    END IF;

    RETURN format('contiene: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'contiene: existen filas dependientes que impiden el borrado';
        RETURN 'contiene: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_contiene(2, 'P0000001');
-- SELECT fn_upd_contiene(2, 'P0000001', 3, 'P0000001');
-- SELECT fn_del_contiene(3, 'P0000001');


-- 44. Tabla detalle

DROP FUNCTION IF EXISTS fn_ins_detalle(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_detalle(
    p_id_producto VARCHAR,
    p_id_empresa VARCHAR,
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO detalle (id_producto, id_empresa, id_venta)
    VALUES (p_id_producto, p_id_empresa, p_id_venta);
    RETURN format('detalle: fila insertada (%s, %s, %s)', p_id_producto, p_id_empresa, p_id_venta);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'detalle: la clave primaria ya existe';
        RETURN 'detalle: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'detalle: alguna clave foranea referenciada no existe';
        RETURN 'detalle: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'detalle: la fila no cumple una restriccion CHECK';
        RETURN 'detalle: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'detalle: se recibio NULL en una columna obligatoria';
        RETURN 'detalle: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_detalle(VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_detalle(
    p_id_producto VARCHAR,
    p_id_empresa VARCHAR,
    p_id_venta INTEGER,
    p_nuevo_id_producto VARCHAR,
    p_nuevo_id_empresa VARCHAR,
    p_nuevo_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE detalle SET
        id_producto = p_nuevo_id_producto,
        id_empresa = p_nuevo_id_empresa,
        id_venta = p_nuevo_id_venta
    WHERE id_producto = p_id_producto
      AND id_empresa = p_id_empresa
      AND id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'detalle: no existe la fila (%, %, %)', p_id_producto, p_id_empresa, p_id_venta;
        RETURN 'detalle: 0 filas actualizadas';
    END IF;

    RETURN format('detalle: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'detalle: alguna clave foranea referenciada no existe';
        RETURN 'detalle: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'detalle: la fila resultante no cumple una restriccion CHECK';
        RETURN 'detalle: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'detalle: la clave resultante ya existe';
        RETURN 'detalle: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_detalle(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_detalle(
    p_id_producto VARCHAR,
    p_id_empresa VARCHAR,
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM detalle
    WHERE id_producto = p_id_producto
      AND id_empresa = p_id_empresa
      AND id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'detalle: no existe la fila (%, %, %)', p_id_producto, p_id_empresa, p_id_venta;
        RETURN 'detalle: 0 filas eliminadas';
    END IF;

    RETURN format('detalle: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'detalle: existen filas dependientes que impiden el borrado';
        RETURN 'detalle: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_detalle('P0000500', '76000001-2', 2);
-- SELECT fn_upd_detalle('P0000500', '76000001-2', 2, 'P0000501', '76000001-2', 3);
-- SELECT fn_del_detalle('P0000501', '76000001-2', 3);


-- 45. Tabla critica

DROP FUNCTION IF EXISTS fn_ins_critica(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_critica(
    p_id_reseña INTEGER,
    p_id_usuario VARCHAR,
    p_id_servicio VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO critica (id_reseña, id_usuario, id_servicio)
    VALUES (p_id_reseña, p_id_usuario, p_id_servicio);
    RETURN format('critica: fila insertada (%s, %s, %s)', p_id_reseña, p_id_usuario, p_id_servicio);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'critica: la clave primaria ya existe';
        RETURN 'critica: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'critica: alguna clave foranea referenciada no existe';
        RETURN 'critica: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'critica: la fila no cumple una restriccion CHECK';
        RETURN 'critica: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'critica: se recibio NULL en una columna obligatoria';
        RETURN 'critica: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_critica(INTEGER, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_critica(
    p_id_reseña INTEGER,
    p_id_usuario VARCHAR,
    p_id_servicio VARCHAR,
    p_nuevo_id_reseña INTEGER,
    p_nuevo_id_usuario VARCHAR,
    p_nuevo_id_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE critica SET
        id_reseña = p_nuevo_id_reseña,
        id_usuario = p_nuevo_id_usuario,
        id_servicio = p_nuevo_id_servicio
    WHERE id_reseña = p_id_reseña
      AND id_usuario = p_id_usuario
      AND id_servicio = p_id_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'critica: no existe la fila (%, %, %)', p_id_reseña, p_id_usuario, p_id_servicio;
        RETURN 'critica: 0 filas actualizadas';
    END IF;

    RETURN format('critica: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'critica: alguna clave foranea referenciada no existe';
        RETURN 'critica: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'critica: la fila resultante no cumple una restriccion CHECK';
        RETURN 'critica: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'critica: la clave resultante ya existe';
        RETURN 'critica: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_critica(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_critica(
    p_id_reseña INTEGER,
    p_id_usuario VARCHAR,
    p_id_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM critica
    WHERE id_reseña = p_id_reseña
      AND id_usuario = p_id_usuario
      AND id_servicio = p_id_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'critica: no existe la fila (%, %, %)', p_id_reseña, p_id_usuario, p_id_servicio;
        RETURN 'critica: 0 filas eliminadas';
    END IF;

    RETURN format('critica: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'critica: existen filas dependientes que impiden el borrado';
        RETURN 'critica: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_critica(1, '11000001-2', 'S0000002');
-- SELECT fn_upd_critica(1, '11000001-2', 'S0000002', 2, '11000001-2', 'S0000003');
-- SELECT fn_del_critica(2, '11000001-2', 'S0000003');


-- 46. Tabla preguntar

DROP FUNCTION IF EXISTS fn_ins_preguntar(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_preguntar(
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR,
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO preguntar (id_usuario, id_producto, id_mensajeria)
    VALUES (p_id_usuario, p_id_producto, p_id_mensajeria);
    RETURN format('preguntar: fila insertada (%s, %s, %s)', p_id_producto, p_id_usuario, p_id_mensajeria);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'preguntar: la clave primaria ya existe';
        RETURN 'preguntar: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'preguntar: alguna clave foranea referenciada no existe';
        RETURN 'preguntar: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'preguntar: la fila no cumple una restriccion CHECK';
        RETURN 'preguntar: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'preguntar: se recibio NULL en una columna obligatoria';
        RETURN 'preguntar: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_preguntar(VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_preguntar(
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR,
    p_id_mensajeria INTEGER,
    p_nuevo_id_usuario VARCHAR,
    p_nuevo_id_producto VARCHAR,
    p_nuevo_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE preguntar SET
        id_usuario = p_nuevo_id_usuario,
        id_producto = p_nuevo_id_producto,
        id_mensajeria = p_nuevo_id_mensajeria
    WHERE id_usuario = p_id_usuario
      AND id_producto = p_id_producto
      AND id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'preguntar: no existe la fila (%, %, %)', p_id_producto, p_id_usuario, p_id_mensajeria;
        RETURN 'preguntar: 0 filas actualizadas';
    END IF;

    RETURN format('preguntar: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'preguntar: alguna clave foranea referenciada no existe';
        RETURN 'preguntar: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'preguntar: la fila resultante no cumple una restriccion CHECK';
        RETURN 'preguntar: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'preguntar: la clave resultante ya existe';
        RETURN 'preguntar: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_preguntar(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_preguntar(
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR,
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM preguntar
    WHERE id_usuario = p_id_usuario
      AND id_producto = p_id_producto
      AND id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'preguntar: no existe la fila (%, %, %)', p_id_producto, p_id_usuario, p_id_mensajeria;
        RETURN 'preguntar: 0 filas eliminadas';
    END IF;

    RETURN format('preguntar: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'preguntar: existen filas dependientes que impiden el borrado';
        RETURN 'preguntar: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_preguntar('11000001-2', 'P0000002', 1);
-- SELECT fn_upd_preguntar('11000001-2', 'P0000002', 1, '11000001-2', 'P0000003', 2);
-- SELECT fn_del_preguntar('11000001-2', 'P0000003', 2);


-- 47. Tabla indaga

DROP FUNCTION IF EXISTS fn_ins_indaga(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_indaga(
    p_run_usuario VARCHAR,
    p_id_servicio VARCHAR,
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO indaga (run_usuario, id_servicio, id_mensajeria)
    VALUES (p_run_usuario, p_id_servicio, p_id_mensajeria);
    RETURN format('indaga: fila insertada (%s, %s, %s)', p_id_servicio, p_run_usuario, p_id_mensajeria);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'indaga: la clave primaria ya existe';
        RETURN 'indaga: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'indaga: alguna clave foranea referenciada no existe';
        RETURN 'indaga: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'indaga: la fila no cumple una restriccion CHECK';
        RETURN 'indaga: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'indaga: se recibio NULL en una columna obligatoria';
        RETURN 'indaga: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_indaga(VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_indaga(
    p_run_usuario VARCHAR,
    p_id_servicio VARCHAR,
    p_id_mensajeria INTEGER,
    p_nuevo_run_usuario VARCHAR,
    p_nuevo_id_servicio VARCHAR,
    p_nuevo_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE indaga SET
        run_usuario = p_nuevo_run_usuario,
        id_servicio = p_nuevo_id_servicio,
        id_mensajeria = p_nuevo_id_mensajeria
    WHERE run_usuario = p_run_usuario
      AND id_servicio = p_id_servicio
      AND id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'indaga: no existe la fila (%, %, %)', p_id_servicio, p_run_usuario, p_id_mensajeria;
        RETURN 'indaga: 0 filas actualizadas';
    END IF;

    RETURN format('indaga: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'indaga: alguna clave foranea referenciada no existe';
        RETURN 'indaga: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'indaga: la fila resultante no cumple una restriccion CHECK';
        RETURN 'indaga: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'indaga: la clave resultante ya existe';
        RETURN 'indaga: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_indaga(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_indaga(
    p_run_usuario VARCHAR,
    p_id_servicio VARCHAR,
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM indaga
    WHERE run_usuario = p_run_usuario
      AND id_servicio = p_id_servicio
      AND id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'indaga: no existe la fila (%, %, %)', p_id_servicio, p_run_usuario, p_id_mensajeria;
        RETURN 'indaga: 0 filas eliminadas';
    END IF;

    RETURN format('indaga: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'indaga: existen filas dependientes que impiden el borrado';
        RETURN 'indaga: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_indaga('11000001-2', 'S0000001', 2);
-- SELECT fn_upd_indaga('11000001-2', 'S0000001', 2, '11000001-2', 'S0000002', 3);
-- SELECT fn_del_indaga('11000001-2', 'S0000002', 3);


-- 48. Tabla promociona

DROP FUNCTION IF EXISTS fn_ins_promociona(INTEGER, VARCHAR, VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_ins_promociona(
    p_id_oferta INTEGER,
    p_sku_servicio VARCHAR,
    p_sku_producto VARCHAR,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO promociona (id_oferta, sku_servicio, sku_producto, fecha_inicio, fecha_fin)
    VALUES (p_id_oferta, p_sku_servicio, p_sku_producto, p_fecha_inicio, p_fecha_fin);
    RETURN format('promociona: fila insertada (%s, %s, %s)', p_id_oferta, p_sku_servicio, p_sku_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'promociona: la clave primaria ya existe';
        RETURN 'promociona: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'promociona: alguna clave foranea referenciada no existe';
        RETURN 'promociona: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'promociona: la fila no cumple una restriccion CHECK';
        RETURN 'promociona: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'promociona: se recibio NULL en una columna obligatoria';
        RETURN 'promociona: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_promociona(INTEGER, VARCHAR, VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_upd_promociona(
    p_id_oferta INTEGER,
    p_sku_servicio VARCHAR,
    p_sku_producto VARCHAR,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_fecha_inicio IS NULL AND
       p_fecha_fin IS NULL THEN
        RAISE NOTICE 'promociona: no se indico ningun valor a modificar';
        RETURN 'promociona: 0 filas actualizadas';
    END IF;
    UPDATE promociona SET
        fecha_inicio = COALESCE(p_fecha_inicio, promociona.fecha_inicio),
        fecha_fin = COALESCE(p_fecha_fin, promociona.fecha_fin)
    WHERE id_oferta = p_id_oferta
      AND sku_servicio = p_sku_servicio
      AND sku_producto = p_sku_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'promociona: no existe la fila (%, %, %)', p_id_oferta, p_sku_servicio, p_sku_producto;
        RETURN 'promociona: 0 filas actualizadas';
    END IF;

    RETURN format('promociona: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'promociona: alguna clave foranea referenciada no existe';
        RETURN 'promociona: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'promociona: la fila resultante no cumple una restriccion CHECK';
        RETURN 'promociona: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'promociona: la clave resultante ya existe';
        RETURN 'promociona: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_promociona(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_promociona(
    p_id_oferta INTEGER,
    p_sku_servicio VARCHAR,
    p_sku_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM promociona
    WHERE id_oferta = p_id_oferta
      AND sku_servicio = p_sku_servicio
      AND sku_producto = p_sku_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'promociona: no existe la fila (%, %, %)', p_id_oferta, p_sku_servicio, p_sku_producto;
        RETURN 'promociona: 0 filas eliminadas';
    END IF;

    RETURN format('promociona: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'promociona: existen filas dependientes que impiden el borrado';
        RETURN 'promociona: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_promociona(1, 'S0000001', 'P0000500', DATE '2024-01-01', DATE '2024-12-31');
-- SELECT fn_upd_promociona(1, 'S0000001', 'P0000500', DATE '2024-02-01');
-- SELECT fn_del_promociona(1, 'S0000001', 'P0000500');


-- 49. Tabla promueve

DROP FUNCTION IF EXISTS fn_ins_promueve(INTEGER, VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_ins_promueve(
    p_id_oferta INTEGER,
    p_id_servicio VARCHAR,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO promueve (id_oferta, id_servicio, fecha_inicio, fecha_fin)
    VALUES (p_id_oferta, p_id_servicio, p_fecha_inicio, p_fecha_fin);
    RETURN format('promueve: fila insertada (%s, %s)', p_id_oferta, p_id_servicio);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'promueve: la clave primaria ya existe';
        RETURN 'promueve: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'promueve: alguna clave foranea referenciada no existe';
        RETURN 'promueve: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'promueve: la fila no cumple una restriccion CHECK';
        RETURN 'promueve: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'promueve: se recibio NULL en una columna obligatoria';
        RETURN 'promueve: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_promueve(INTEGER, VARCHAR, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_upd_promueve(
    p_id_oferta INTEGER,
    p_id_servicio VARCHAR,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_fecha_inicio IS NULL AND
       p_fecha_fin IS NULL THEN
        RAISE NOTICE 'promueve: no se indico ningun valor a modificar';
        RETURN 'promueve: 0 filas actualizadas';
    END IF;
    UPDATE promueve SET
        fecha_inicio = COALESCE(p_fecha_inicio, promueve.fecha_inicio),
        fecha_fin = COALESCE(p_fecha_fin, promueve.fecha_fin)
    WHERE id_oferta = p_id_oferta
      AND id_servicio = p_id_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'promueve: no existe la fila (%, %)', p_id_oferta, p_id_servicio;
        RETURN 'promueve: 0 filas actualizadas';
    END IF;

    RETURN format('promueve: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'promueve: alguna clave foranea referenciada no existe';
        RETURN 'promueve: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'promueve: la fila resultante no cumple una restriccion CHECK';
        RETURN 'promueve: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'promueve: la clave resultante ya existe';
        RETURN 'promueve: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_promueve(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_promueve(
    p_id_oferta INTEGER,
    p_id_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM promueve
    WHERE id_oferta = p_id_oferta
      AND id_servicio = p_id_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'promueve: no existe la fila (%, %)', p_id_oferta, p_id_servicio;
        RETURN 'promueve: 0 filas eliminadas';
    END IF;

    RETURN format('promueve: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'promueve: existen filas dependientes que impiden el borrado';
        RETURN 'promueve: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_promueve(1, 'S0000500', DATE '2024-01-01', DATE '2024-12-31');
-- SELECT fn_upd_promueve(1, 'S0000500', DATE '2024-02-01');
-- SELECT fn_del_promueve(1, 'S0000500');


-- 50. Tabla compra

DROP FUNCTION IF EXISTS fn_ins_compra(VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_compra(
    p_run_usuario VARCHAR,
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO compra (run_usuario, id_venta)
    VALUES (p_run_usuario, p_id_venta);
    RETURN format('compra: fila insertada (%s, %s)', p_run_usuario, p_id_venta);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'compra: la clave primaria ya existe';
        RETURN 'compra: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'compra: alguna clave foranea referenciada no existe';
        RETURN 'compra: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'compra: la fila no cumple una restriccion CHECK';
        RETURN 'compra: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'compra: se recibio NULL en una columna obligatoria';
        RETURN 'compra: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_compra(VARCHAR, INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_compra(
    p_run_usuario VARCHAR,
    p_id_venta INTEGER,
    p_nuevo_run_usuario VARCHAR,
    p_nuevo_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE compra SET
        run_usuario = p_nuevo_run_usuario,
        id_venta = p_nuevo_id_venta
    WHERE run_usuario = p_run_usuario
      AND id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'compra: no existe la fila (%, %)', p_run_usuario, p_id_venta;
        RETURN 'compra: 0 filas actualizadas';
    END IF;

    RETURN format('compra: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'compra: alguna clave foranea referenciada no existe';
        RETURN 'compra: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'compra: la fila resultante no cumple una restriccion CHECK';
        RETURN 'compra: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'compra: la clave resultante ya existe';
        RETURN 'compra: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_compra(VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_compra(
    p_run_usuario VARCHAR,
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM compra
    WHERE run_usuario = p_run_usuario
      AND id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'compra: no existe la fila (%, %)', p_run_usuario, p_id_venta;
        RETURN 'compra: 0 filas eliminadas';
    END IF;

    RETURN format('compra: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'compra: existen filas dependientes que impiden el borrado';
        RETURN 'compra: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_compra('11000002-3', 999);
-- SELECT fn_upd_compra('11000002-3', 999, '11000003-4', 998);
-- SELECT fn_del_compra('11000003-4', 998);


-- 51. Tabla consultar

DROP FUNCTION IF EXISTS fn_ins_consultar(VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_consultar(
    p_run_usuario VARCHAR,
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO consultar (run_usuario, id_mensajeria)
    VALUES (p_run_usuario, p_id_mensajeria);
    RETURN format('consultar: fila insertada (%s, %s)', p_run_usuario, p_id_mensajeria);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'consultar: la clave primaria ya existe';
        RETURN 'consultar: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'consultar: alguna clave foranea referenciada no existe';
        RETURN 'consultar: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'consultar: la fila no cumple una restriccion CHECK';
        RETURN 'consultar: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'consultar: se recibio NULL en una columna obligatoria';
        RETURN 'consultar: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_consultar(VARCHAR, INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_consultar(
    p_run_usuario VARCHAR,
    p_id_mensajeria INTEGER,
    p_nuevo_run_usuario VARCHAR,
    p_nuevo_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE consultar SET
        run_usuario = p_nuevo_run_usuario,
        id_mensajeria = p_nuevo_id_mensajeria
    WHERE run_usuario = p_run_usuario
      AND id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'consultar: no existe la fila (%, %)', p_run_usuario, p_id_mensajeria;
        RETURN 'consultar: 0 filas actualizadas';
    END IF;

    RETURN format('consultar: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'consultar: alguna clave foranea referenciada no existe';
        RETURN 'consultar: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'consultar: la fila resultante no cumple una restriccion CHECK';
        RETURN 'consultar: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'consultar: la clave resultante ya existe';
        RETURN 'consultar: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_consultar(VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_consultar(
    p_run_usuario VARCHAR,
    p_id_mensajeria INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM consultar
    WHERE run_usuario = p_run_usuario
      AND id_mensajeria = p_id_mensajeria;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'consultar: no existe la fila (%, %)', p_run_usuario, p_id_mensajeria;
        RETURN 'consultar: 0 filas eliminadas';
    END IF;

    RETURN format('consultar: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'consultar: existen filas dependientes que impiden el borrado';
        RETURN 'consultar: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_consultar('11000001-2', 10);
-- SELECT fn_upd_consultar('11000001-2', 10, '11000001-2', 11);
-- SELECT fn_del_consultar('11000001-2', 11);


-- 52. Tabla ejerce

DROP FUNCTION IF EXISTS fn_ins_ejerce(INTEGER, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_ejerce(
    p_id_devolucion INTEGER,
    p_run_usuario VARCHAR,
    p_id_venta INTEGER,
    p_estado VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO ejerce (id_devolucion, run_usuario, id_venta, estado)
    VALUES (p_id_devolucion, p_run_usuario, p_id_venta, p_estado);
    RETURN format('ejerce: fila insertada (%s)', p_id_devolucion);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'ejerce: la clave primaria ya existe';
        RETURN 'ejerce: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'ejerce: alguna clave foranea referenciada no existe';
        RETURN 'ejerce: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'ejerce: la fila no cumple una restriccion CHECK';
        RETURN 'ejerce: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'ejerce: se recibio NULL en una columna obligatoria';
        RETURN 'ejerce: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_ejerce(INTEGER, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_ejerce(
    p_id_devolucion INTEGER,
    p_run_usuario VARCHAR DEFAULT NULL,
    p_id_venta INTEGER DEFAULT NULL,
    p_estado VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_run_usuario IS NULL AND
       p_id_venta IS NULL AND
       p_estado IS NULL THEN
        RAISE NOTICE 'ejerce: no se indico ningun valor a modificar';
        RETURN 'ejerce: 0 filas actualizadas';
    END IF;
    UPDATE ejerce SET
        run_usuario = COALESCE(p_run_usuario, ejerce.run_usuario),
        id_venta = COALESCE(p_id_venta, ejerce.id_venta),
        estado = COALESCE(p_estado, ejerce.estado)
    WHERE id_devolucion = p_id_devolucion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'ejerce: no existe la fila (%)', p_id_devolucion;
        RETURN 'ejerce: 0 filas actualizadas';
    END IF;

    RETURN format('ejerce: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'ejerce: alguna clave foranea referenciada no existe';
        RETURN 'ejerce: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'ejerce: la fila resultante no cumple una restriccion CHECK';
        RETURN 'ejerce: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'ejerce: la clave resultante ya existe';
        RETURN 'ejerce: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_ejerce(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_ejerce(
    p_id_devolucion INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM ejerce
    WHERE id_devolucion = p_id_devolucion;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'ejerce: no existe la fila (%)', p_id_devolucion;
        RETURN 'ejerce: 0 filas eliminadas';
    END IF;

    RETURN format('ejerce: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'ejerce: existen filas dependientes que impiden el borrado';
        RETURN 'ejerce: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_ejerce(999999, '11000001-2', 1, 'Pendiente');
-- SELECT fn_upd_ejerce(999999, NULL, NULL, 'Aprobada');
-- SELECT fn_del_ejerce(999999);


-- 53. Tabla crear

DROP FUNCTION IF EXISTS fn_ins_crear(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_crear(
    p_run_usuario VARCHAR,
    p_nombre_lista_deseos VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO crear (run_usuario, nombre_lista_deseos)
    VALUES (p_run_usuario, p_nombre_lista_deseos);
    RETURN format('crear: fila insertada (%s, %s)', p_run_usuario, p_nombre_lista_deseos);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'crear: la clave primaria ya existe';
        RETURN 'crear: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'crear: alguna clave foranea referenciada no existe';
        RETURN 'crear: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'crear: la fila no cumple una restriccion CHECK';
        RETURN 'crear: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'crear: se recibio NULL en una columna obligatoria';
        RETURN 'crear: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_crear(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_crear(
    p_run_usuario VARCHAR,
    p_nombre_lista_deseos VARCHAR,
    p_nuevo_run_usuario VARCHAR,
    p_nuevo_nombre_lista_deseos VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE crear SET
        run_usuario = p_nuevo_run_usuario,
        nombre_lista_deseos = p_nuevo_nombre_lista_deseos
    WHERE run_usuario = p_run_usuario
      AND nombre_lista_deseos = p_nombre_lista_deseos;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'crear: no existe la fila (%, %)', p_run_usuario, p_nombre_lista_deseos;
        RETURN 'crear: 0 filas actualizadas';
    END IF;

    RETURN format('crear: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'crear: alguna clave foranea referenciada no existe';
        RETURN 'crear: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'crear: la fila resultante no cumple una restriccion CHECK';
        RETURN 'crear: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'crear: la clave resultante ya existe';
        RETURN 'crear: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_crear(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_crear(
    p_run_usuario VARCHAR,
    p_nombre_lista_deseos VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM crear
    WHERE run_usuario = p_run_usuario
      AND nombre_lista_deseos = p_nombre_lista_deseos;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'crear: no existe la fila (%, %)', p_run_usuario, p_nombre_lista_deseos;
        RETURN 'crear: 0 filas eliminadas';
    END IF;

    RETURN format('crear: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'crear: existen filas dependientes que impiden el borrado';
        RETURN 'crear: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_crear('11000001-2', 'Lista_0002');
-- SELECT fn_upd_crear('11000001-2', 'Lista_0002', '11000001-2', 'Lista_0003');
-- SELECT fn_del_crear('11000001-2', 'Lista_0003');


-- 54. Tabla considera

DROP FUNCTION IF EXISTS fn_ins_considera(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_considera(
    p_id_venta INTEGER,
    p_codigo_postal INTEGER,
    p_codigo_transferencia VARCHAR,
    p_id_despacho INTEGER,
    p_numero_seguimiento VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO considera (id_venta, codigo_postal, codigo_transferencia, id_despacho, numero_seguimiento)
    VALUES (p_id_venta, p_codigo_postal, p_codigo_transferencia, p_id_despacho, p_numero_seguimiento);
    RETURN format('considera: fila insertada (%s, %s, %s)', p_id_venta, p_codigo_postal, p_codigo_transferencia);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'considera: la clave primaria ya existe';
        RETURN 'considera: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'considera: alguna clave foranea referenciada no existe';
        RETURN 'considera: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'considera: la fila no cumple una restriccion CHECK';
        RETURN 'considera: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'considera: se recibio NULL en una columna obligatoria';
        RETURN 'considera: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_considera(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_considera(
    p_id_venta INTEGER,
    p_codigo_postal INTEGER,
    p_codigo_transferencia VARCHAR,
    p_id_despacho INTEGER DEFAULT NULL,
    p_numero_seguimiento VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_id_despacho IS NULL AND
       p_numero_seguimiento IS NULL THEN
        RAISE NOTICE 'considera: no se indico ningun valor a modificar';
        RETURN 'considera: 0 filas actualizadas';
    END IF;
    UPDATE considera SET
        id_despacho = COALESCE(p_id_despacho, considera.id_despacho),
        numero_seguimiento = COALESCE(p_numero_seguimiento, considera.numero_seguimiento)
    WHERE id_venta = p_id_venta
      AND codigo_postal = p_codigo_postal
      AND codigo_transferencia = p_codigo_transferencia;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'considera: no existe la fila (%, %, %)', p_id_venta, p_codigo_postal, p_codigo_transferencia;
        RETURN 'considera: 0 filas actualizadas';
    END IF;

    RETURN format('considera: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'considera: alguna clave foranea referenciada no existe';
        RETURN 'considera: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'considera: la fila resultante no cumple una restriccion CHECK';
        RETURN 'considera: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'considera: la clave resultante ya existe';
        RETURN 'considera: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_considera(INTEGER, INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_considera(
    p_id_venta INTEGER,
    p_codigo_postal INTEGER,
    p_codigo_transferencia VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM considera
    WHERE id_venta = p_id_venta
      AND codigo_postal = p_codigo_postal
      AND codigo_transferencia = p_codigo_transferencia;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'considera: no existe la fila (%, %, %)', p_id_venta, p_codigo_postal, p_codigo_transferencia;
        RETURN 'considera: 0 filas eliminadas';
    END IF;

    RETURN format('considera: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'considera: existen filas dependientes que impiden el borrado';
        RETURN 'considera: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_considera(999, 1, 'TRF0000001', 1, NULL);
-- SELECT fn_upd_considera(999, 1, 'TRF0000001', 2);
-- SELECT fn_del_considera(999, 1, 'TRF0000001');


-- 55. Tabla asocia

DROP FUNCTION IF EXISTS fn_ins_asocia(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_asocia(
    p_id_servicio VARCHAR,
    p_id_empresa VARCHAR,
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO asocia (id_servicio, id_empresa, id_venta)
    VALUES (p_id_servicio, p_id_empresa, p_id_venta);
    RETURN format('asocia: fila insertada (%s, %s, %s)', p_id_venta, p_id_empresa, p_id_servicio);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'asocia: la clave primaria ya existe';
        RETURN 'asocia: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'asocia: alguna clave foranea referenciada no existe';
        RETURN 'asocia: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'asocia: la fila no cumple una restriccion CHECK';
        RETURN 'asocia: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'asocia: se recibio NULL en una columna obligatoria';
        RETURN 'asocia: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_asocia(VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_asocia(
    p_id_servicio VARCHAR,
    p_id_empresa VARCHAR,
    p_id_venta INTEGER,
    p_nuevo_id_servicio VARCHAR,
    p_nuevo_id_empresa VARCHAR,
    p_nuevo_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE asocia SET
        id_servicio = p_nuevo_id_servicio,
        id_empresa = p_nuevo_id_empresa,
        id_venta = p_nuevo_id_venta
    WHERE id_servicio = p_id_servicio
      AND id_empresa = p_id_empresa
      AND id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'asocia: no existe la fila (%, %, %)', p_id_venta, p_id_empresa, p_id_servicio;
        RETURN 'asocia: 0 filas actualizadas';
    END IF;

    RETURN format('asocia: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'asocia: alguna clave foranea referenciada no existe';
        RETURN 'asocia: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'asocia: la fila resultante no cumple una restriccion CHECK';
        RETURN 'asocia: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'asocia: la clave resultante ya existe';
        RETURN 'asocia: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_asocia(VARCHAR, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_asocia(
    p_id_servicio VARCHAR,
    p_id_empresa VARCHAR,
    p_id_venta INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM asocia
    WHERE id_servicio = p_id_servicio
      AND id_empresa = p_id_empresa
      AND id_venta = p_id_venta;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'asocia: no existe la fila (%, %, %)', p_id_venta, p_id_empresa, p_id_servicio;
        RETURN 'asocia: 0 filas eliminadas';
    END IF;

    RETURN format('asocia: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'asocia: existen filas dependientes que impiden el borrado';
        RETURN 'asocia: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_asocia('S0000001', '76000001-2', 2);
-- SELECT fn_upd_asocia('S0000001', '76000001-2', 2, 'S0000002', '76000001-2', 3);
-- SELECT fn_del_asocia('S0000002', '76000001-2', 3);


-- 56. Tabla evalua

DROP FUNCTION IF EXISTS fn_ins_evalua(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_evalua(
    p_id_reseña INTEGER,
    p_run_usuario VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO evalua (id_reseña, run_usuario)
    VALUES (p_id_reseña, p_run_usuario);
    RETURN format('evalua: fila insertada (%s)', p_id_reseña);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'evalua: la clave primaria ya existe';
        RETURN 'evalua: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'evalua: alguna clave foranea referenciada no existe';
        RETURN 'evalua: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'evalua: la fila no cumple una restriccion CHECK';
        RETURN 'evalua: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'evalua: se recibio NULL en una columna obligatoria';
        RETURN 'evalua: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_evalua(INTEGER, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_evalua(
    p_id_reseña INTEGER,
    p_run_usuario VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_run_usuario IS NULL THEN
        RAISE NOTICE 'evalua: no se indico ningun valor a modificar';
        RETURN 'evalua: 0 filas actualizadas';
    END IF;
    UPDATE evalua SET
        run_usuario = COALESCE(p_run_usuario, evalua.run_usuario)
    WHERE id_reseña = p_id_reseña;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'evalua: no existe la fila (%)', p_id_reseña;
        RETURN 'evalua: 0 filas actualizadas';
    END IF;

    RETURN format('evalua: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'evalua: alguna clave foranea referenciada no existe';
        RETURN 'evalua: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'evalua: la fila resultante no cumple una restriccion CHECK';
        RETURN 'evalua: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'evalua: la clave resultante ya existe';
        RETURN 'evalua: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_evalua(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_evalua(
    p_id_reseña INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM evalua
    WHERE id_reseña = p_id_reseña;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'evalua: no existe la fila (%)', p_id_reseña;
        RETURN 'evalua: 0 filas eliminadas';
    END IF;

    RETURN format('evalua: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'evalua: existen filas dependientes que impiden el borrado';
        RETURN 'evalua: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_evalua(2, '11000001-2');
-- SELECT fn_upd_evalua(2, '11000001-2');
-- SELECT fn_del_evalua(2);


-- 57. Tabla posee

DROP FUNCTION IF EXISTS fn_ins_posee(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_posee(
    p_id_lista_deseos_wishlist VARCHAR,
    p_id_servicio VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO posee (id_lista_deseos_wishlist, id_servicio)
    VALUES (p_id_lista_deseos_wishlist, p_id_servicio);
    RETURN format('posee: fila insertada (%s, %s)', p_id_lista_deseos_wishlist, p_id_servicio);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'posee: la clave primaria ya existe';
        RETURN 'posee: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'posee: alguna clave foranea referenciada no existe';
        RETURN 'posee: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'posee: la fila no cumple una restriccion CHECK';
        RETURN 'posee: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'posee: se recibio NULL en una columna obligatoria';
        RETURN 'posee: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_posee(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_posee(
    p_id_lista_deseos_wishlist VARCHAR,
    p_id_servicio VARCHAR,
    p_nuevo_id_lista_deseos_wishlist VARCHAR,
    p_nuevo_id_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE posee SET
        id_lista_deseos_wishlist = p_nuevo_id_lista_deseos_wishlist,
        id_servicio = p_nuevo_id_servicio
    WHERE id_lista_deseos_wishlist = p_id_lista_deseos_wishlist
      AND id_servicio = p_id_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'posee: no existe la fila (%, %)', p_id_lista_deseos_wishlist, p_id_servicio;
        RETURN 'posee: 0 filas actualizadas';
    END IF;

    RETURN format('posee: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'posee: alguna clave foranea referenciada no existe';
        RETURN 'posee: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'posee: la fila resultante no cumple una restriccion CHECK';
        RETURN 'posee: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'posee: la clave resultante ya existe';
        RETURN 'posee: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_posee(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_posee(
    p_id_lista_deseos_wishlist VARCHAR,
    p_id_servicio VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM posee
    WHERE id_lista_deseos_wishlist = p_id_lista_deseos_wishlist
      AND id_servicio = p_id_servicio;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'posee: no existe la fila (%, %)', p_id_lista_deseos_wishlist, p_id_servicio;
        RETURN 'posee: 0 filas eliminadas';
    END IF;

    RETURN format('posee: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'posee: existen filas dependientes que impiden el borrado';
        RETURN 'posee: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_posee('Lista_0001', 'S0000002');
-- SELECT fn_upd_posee('Lista_0001', 'S0000002', 'Lista_0001', 'S0000003');
-- SELECT fn_del_posee('Lista_0001', 'S0000003');


-- 58. Tabla administra

DROP FUNCTION IF EXISTS fn_ins_administra(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_administra(
    p_id_usuario VARCHAR,
    p_id_empresa VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO administra (id_usuario, id_empresa)
    VALUES (p_id_usuario, p_id_empresa);
    RETURN format('administra: fila insertada (%s, %s)', p_id_empresa, p_id_usuario);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'administra: la clave primaria ya existe';
        RETURN 'administra: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'administra: alguna clave foranea referenciada no existe';
        RETURN 'administra: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'administra: la fila no cumple una restriccion CHECK';
        RETURN 'administra: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'administra: se recibio NULL en una columna obligatoria';
        RETURN 'administra: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_administra(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_administra(
    p_id_usuario VARCHAR,
    p_id_empresa VARCHAR,
    p_nuevo_id_usuario VARCHAR,
    p_nuevo_id_empresa VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE administra SET
        id_usuario = p_nuevo_id_usuario,
        id_empresa = p_nuevo_id_empresa
    WHERE id_usuario = p_id_usuario
      AND id_empresa = p_id_empresa;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'administra: no existe la fila (%, %)', p_id_empresa, p_id_usuario;
        RETURN 'administra: 0 filas actualizadas';
    END IF;

    RETURN format('administra: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'administra: alguna clave foranea referenciada no existe';
        RETURN 'administra: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'administra: la fila resultante no cumple una restriccion CHECK';
        RETURN 'administra: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'administra: la clave resultante ya existe';
        RETURN 'administra: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_administra(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_administra(
    p_id_usuario VARCHAR,
    p_id_empresa VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM administra
    WHERE id_usuario = p_id_usuario
      AND id_empresa = p_id_empresa;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'administra: no existe la fila (%, %)', p_id_empresa, p_id_usuario;
        RETURN 'administra: 0 filas eliminadas';
    END IF;

    RETURN format('administra: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'administra: existen filas dependientes que impiden el borrado';
        RETURN 'administra: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_administra('11000001-2', '76000002-3');
-- SELECT fn_upd_administra('11000001-2', '76000002-3', '11000001-2', '76000003-4');
-- SELECT fn_del_administra('11000001-2', '76000003-4');


-- 59. Tabla conforma

DROP FUNCTION IF EXISTS fn_ins_conforma(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_conforma(
    p_id_venta INTEGER,
    p_id_servicio VARCHAR,
    p_id_usuario VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO conforma (id_venta, id_servicio, id_usuario)
    VALUES (p_id_venta, p_id_servicio, p_id_usuario);
    RETURN format('conforma: fila insertada (%s, %s, %s)', p_id_venta, p_id_servicio, p_id_usuario);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'conforma: la clave primaria ya existe';
        RETURN 'conforma: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'conforma: alguna clave foranea referenciada no existe';
        RETURN 'conforma: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'conforma: la fila no cumple una restriccion CHECK';
        RETURN 'conforma: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'conforma: se recibio NULL en una columna obligatoria';
        RETURN 'conforma: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_conforma(INTEGER, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_conforma(
    p_id_venta INTEGER,
    p_id_servicio VARCHAR,
    p_id_usuario VARCHAR,
    p_nuevo_id_venta INTEGER,
    p_nuevo_id_servicio VARCHAR,
    p_nuevo_id_usuario VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE conforma SET
        id_venta = p_nuevo_id_venta,
        id_servicio = p_nuevo_id_servicio,
        id_usuario = p_nuevo_id_usuario
    WHERE id_venta = p_id_venta
      AND id_servicio = p_id_servicio
      AND id_usuario = p_id_usuario;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'conforma: no existe la fila (%, %, %)', p_id_venta, p_id_servicio, p_id_usuario;
        RETURN 'conforma: 0 filas actualizadas';
    END IF;

    RETURN format('conforma: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'conforma: alguna clave foranea referenciada no existe';
        RETURN 'conforma: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'conforma: la fila resultante no cumple una restriccion CHECK';
        RETURN 'conforma: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'conforma: la clave resultante ya existe';
        RETURN 'conforma: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_conforma(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_conforma(
    p_id_venta INTEGER,
    p_id_servicio VARCHAR,
    p_id_usuario VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM conforma
    WHERE id_venta = p_id_venta
      AND id_servicio = p_id_servicio
      AND id_usuario = p_id_usuario;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'conforma: no existe la fila (%, %, %)', p_id_venta, p_id_servicio, p_id_usuario;
        RETURN 'conforma: 0 filas eliminadas';
    END IF;

    RETURN format('conforma: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'conforma: existen filas dependientes que impiden el borrado';
        RETURN 'conforma: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_conforma(1, 'S0000001', '11000001-2');
-- SELECT fn_upd_conforma(1, 'S0000001', '11000001-2', 2, 'S0000002', '11000001-2');
-- SELECT fn_del_conforma(2, 'S0000002', '11000001-2');


-- 60. Tabla definir

DROP FUNCTION IF EXISTS fn_ins_definir(INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_ins_definir(
    p_id_direccion INTEGER,
    p_id_producto VARCHAR,
    p_id_despacho INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO definir (id_direccion, id_producto, id_despacho)
    VALUES (p_id_direccion, p_id_producto, p_id_despacho);
    RETURN format('definir: fila insertada (%s, %s, %s)', p_id_direccion, p_id_producto, p_id_despacho);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'definir: la clave primaria ya existe';
        RETURN 'definir: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'definir: alguna clave foranea referenciada no existe';
        RETURN 'definir: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'definir: la fila no cumple una restriccion CHECK';
        RETURN 'definir: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'definir: se recibio NULL en una columna obligatoria';
        RETURN 'definir: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_definir(INTEGER, VARCHAR, INTEGER, INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_upd_definir(
    p_id_direccion INTEGER,
    p_id_producto VARCHAR,
    p_id_despacho INTEGER,
    p_nuevo_id_direccion INTEGER,
    p_nuevo_id_producto VARCHAR,
    p_nuevo_id_despacho INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE definir SET
        id_direccion = p_nuevo_id_direccion,
        id_producto = p_nuevo_id_producto,
        id_despacho = p_nuevo_id_despacho
    WHERE id_direccion = p_id_direccion
      AND id_producto = p_id_producto
      AND id_despacho = p_id_despacho;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'definir: no existe la fila (%, %, %)', p_id_direccion, p_id_producto, p_id_despacho;
        RETURN 'definir: 0 filas actualizadas';
    END IF;

    RETURN format('definir: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'definir: alguna clave foranea referenciada no existe';
        RETURN 'definir: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'definir: la fila resultante no cumple una restriccion CHECK';
        RETURN 'definir: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'definir: la clave resultante ya existe';
        RETURN 'definir: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_definir(INTEGER, VARCHAR, INTEGER);
CREATE OR REPLACE FUNCTION fn_del_definir(
    p_id_direccion INTEGER,
    p_id_producto VARCHAR,
    p_id_despacho INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM definir
    WHERE id_direccion = p_id_direccion
      AND id_producto = p_id_producto
      AND id_despacho = p_id_despacho;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'definir: no existe la fila (%, %, %)', p_id_direccion, p_id_producto, p_id_despacho;
        RETURN 'definir: 0 filas eliminadas';
    END IF;

    RETURN format('definir: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'definir: existen filas dependientes que impiden el borrado';
        RETURN 'definir: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_definir(1, 'P0000001', 2);
-- SELECT fn_upd_definir(1, 'P0000001', 2, 1, 'P0000002', 3);
-- SELECT fn_del_definir(1, 'P0000002', 3);


-- 61. Tabla añadir

DROP FUNCTION IF EXISTS fn_ins_añadir(VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_añadir(
    p_nombre_lista_deseos VARCHAR,
    p_sku_servicio VARCHAR,
    p_sku_producto VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO añadir (nombre_lista_deseos, sku_servicio, sku_producto)
    VALUES (p_nombre_lista_deseos, p_sku_servicio, p_sku_producto);
    RETURN format('añadir: fila insertada (%s, %s, %s)', p_nombre_lista_deseos, p_sku_servicio, p_sku_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'añadir: la clave primaria ya existe';
        RETURN 'añadir: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'añadir: alguna clave foranea referenciada no existe';
        RETURN 'añadir: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'añadir: la fila no cumple una restriccion CHECK';
        RETURN 'añadir: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'añadir: se recibio NULL en una columna obligatoria';
        RETURN 'añadir: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_añadir(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_añadir(
    p_nombre_lista_deseos VARCHAR,
    p_sku_servicio VARCHAR,
    p_sku_producto VARCHAR,
    p_nuevo_nombre_lista_deseos VARCHAR,
    p_nuevo_sku_servicio VARCHAR,
    p_nuevo_sku_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE añadir SET
        nombre_lista_deseos = p_nuevo_nombre_lista_deseos,
        sku_servicio = p_nuevo_sku_servicio,
        sku_producto = p_nuevo_sku_producto
    WHERE nombre_lista_deseos = p_nombre_lista_deseos
      AND sku_servicio = p_sku_servicio
      AND sku_producto = p_sku_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'añadir: no existe la fila (%, %, %)', p_nombre_lista_deseos, p_sku_servicio, p_sku_producto;
        RETURN 'añadir: 0 filas actualizadas';
    END IF;

    RETURN format('añadir: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'añadir: alguna clave foranea referenciada no existe';
        RETURN 'añadir: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'añadir: la fila resultante no cumple una restriccion CHECK';
        RETURN 'añadir: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'añadir: la clave resultante ya existe';
        RETURN 'añadir: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_añadir(VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_añadir(
    p_nombre_lista_deseos VARCHAR,
    p_sku_servicio VARCHAR,
    p_sku_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM añadir
    WHERE nombre_lista_deseos = p_nombre_lista_deseos
      AND sku_servicio = p_sku_servicio
      AND sku_producto = p_sku_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'añadir: no existe la fila (%, %, %)', p_nombre_lista_deseos, p_sku_servicio, p_sku_producto;
        RETURN 'añadir: 0 filas eliminadas';
    END IF;

    RETURN format('añadir: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'añadir: existen filas dependientes que impiden el borrado';
        RETURN 'añadir: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_añadir('Lista_0001', 'S0000001', 'P0000002');
-- SELECT fn_upd_añadir('Lista_0001', 'S0000001', 'P0000002', 'Lista_0001', 'S0000002', 'P0000003');
-- SELECT fn_del_añadir('Lista_0001', 'S0000002', 'P0000003');


-- 62. Tabla reseña

DROP FUNCTION IF EXISTS fn_ins_reseña(INTEGER, INTEGER, TEXT, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_reseña(
    p_numero_reseña INTEGER,
    p_puntaje INTEGER,
    p_comentario TEXT,
    p_run_usuario VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO reseña (numero_reseña, puntaje, comentario, run_usuario)
    VALUES (p_numero_reseña, p_puntaje, p_comentario, p_run_usuario);
    RETURN format('reseña: fila insertada (%s)', p_numero_reseña);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'reseña: la clave primaria ya existe';
        RETURN 'reseña: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'reseña: alguna clave foranea referenciada no existe';
        RETURN 'reseña: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'reseña: la fila no cumple una restriccion CHECK';
        RETURN 'reseña: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'reseña: se recibio NULL en una columna obligatoria';
        RETURN 'reseña: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_reseña(INTEGER, INTEGER, TEXT, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_reseña(
    p_numero_reseña INTEGER,
    p_puntaje INTEGER DEFAULT NULL,
    p_comentario TEXT DEFAULT NULL,
    p_run_usuario VARCHAR DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN

    IF p_puntaje IS NULL AND
       p_comentario IS NULL AND
       p_run_usuario IS NULL THEN
        RAISE NOTICE 'reseña: no se indico ningun valor a modificar';
        RETURN 'reseña: 0 filas actualizadas';
    END IF;
    UPDATE reseña SET
        puntaje = COALESCE(p_puntaje, reseña.puntaje),
        comentario = COALESCE(p_comentario, reseña.comentario),
        run_usuario = COALESCE(p_run_usuario, reseña.run_usuario)
    WHERE numero_reseña = p_numero_reseña;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'reseña: no existe la fila (%)', p_numero_reseña;
        RETURN 'reseña: 0 filas actualizadas';
    END IF;

    RETURN format('reseña: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'reseña: alguna clave foranea referenciada no existe';
        RETURN 'reseña: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'reseña: la fila resultante no cumple una restriccion CHECK';
        RETURN 'reseña: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'reseña: la clave resultante ya existe';
        RETURN 'reseña: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_reseña(INTEGER);
CREATE OR REPLACE FUNCTION fn_del_reseña(
    p_numero_reseña INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM reseña
    WHERE numero_reseña = p_numero_reseña;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'reseña: no existe la fila (%)', p_numero_reseña;
        RETURN 'reseña: 0 filas eliminadas';
    END IF;

    RETURN format('reseña: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'reseña: existen filas dependientes que impiden el borrado';
        RETURN 'reseña: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_reseña(999999, 5, 'Comentario de prueba', '11000001-2');
-- SELECT fn_upd_reseña(999999, 4);
-- SELECT fn_del_reseña(999999);


-- 63. Tabla reseñar

DROP FUNCTION IF EXISTS fn_ins_reseñar(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_ins_reseñar(
    p_id_reseña INTEGER,
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO reseñar (id_reseña, id_usuario, id_producto)
    VALUES (p_id_reseña, p_id_usuario, p_id_producto);
    RETURN format('reseñar: fila insertada (%s, %s, %s)', p_id_reseña, p_id_usuario, p_id_producto);
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'reseñar: la clave primaria ya existe';
        RETURN 'reseñar: no se inserto, clave duplicada';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'reseñar: alguna clave foranea referenciada no existe';
        RETURN 'reseñar: no se inserto, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'reseñar: la fila no cumple una restriccion CHECK';
        RETURN 'reseñar: no se inserto, restriccion CHECK violada';
    WHEN not_null_violation THEN
        RAISE NOTICE 'reseñar: se recibio NULL en una columna obligatoria';
        RETURN 'reseñar: no se inserto, columna obligatoria en NULL';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_upd_reseñar(INTEGER, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_upd_reseñar(
    p_id_reseña INTEGER,
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR,
    p_nuevo_id_reseña INTEGER,
    p_nuevo_id_usuario VARCHAR,
    p_nuevo_id_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE reseñar SET
        id_reseña = p_nuevo_id_reseña,
        id_usuario = p_nuevo_id_usuario,
        id_producto = p_nuevo_id_producto
    WHERE id_reseña = p_id_reseña
      AND id_usuario = p_id_usuario
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'reseñar: no existe la fila (%, %, %)', p_id_reseña, p_id_usuario, p_id_producto;
        RETURN 'reseñar: 0 filas actualizadas';
    END IF;

    RETURN format('reseñar: %s fila(s) actualizada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'reseñar: alguna clave foranea referenciada no existe';
        RETURN 'reseñar: no se actualizo, clave foranea invalida';
    WHEN check_violation THEN
        RAISE NOTICE 'reseñar: la fila resultante no cumple una restriccion CHECK';
        RETURN 'reseñar: no se actualizo, restriccion CHECK violada';
    WHEN unique_violation THEN
        RAISE NOTICE 'reseñar: la clave resultante ya existe';
        RETURN 'reseñar: no se actualizo, clave duplicada';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS fn_del_reseñar(INTEGER, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION fn_del_reseñar(
    p_id_reseña INTEGER,
    p_id_usuario VARCHAR,
    p_id_producto VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM reseñar
    WHERE id_reseña = p_id_reseña
      AND id_usuario = p_id_usuario
      AND id_producto = p_id_producto;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE NOTICE 'reseñar: no existe la fila (%, %, %)', p_id_reseña, p_id_usuario, p_id_producto;
        RETURN 'reseñar: 0 filas eliminadas';
    END IF;

    RETURN format('reseñar: %s fila(s) eliminada(s)', v_filas);
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'reseñar: existen filas dependientes que impiden el borrado';
        RETURN 'reseñar: no se elimino, integridad referencial';
END;
$$ LANGUAGE plpgsql;

-- SELECT fn_ins_reseñar(1, '11000001-2', 'P0000002');
-- SELECT fn_upd_reseñar(1, '11000001-2', 'P0000002', 2, '11000001-2', 'P0000003');
-- SELECT fn_del_reseñar(2, '11000001-2', 'P0000003');

-- vistas.txt
-- Proyecto Compra y Venta | Universidad de Los Lagos
-- Ejecutar DESPUES de consultas.txt
-- 8. VISTAS LÓGICAS E INDICADORES DE NEGOCIO
--------------------------------------------------------------------------------
-- 8.1. Vista factura fiscal del cliente
--------------------------------------------------------------------------------
-- Enunciado: Disenar una vista integral que consolide la factura fiscal del cliente, desglosando formalmente el valor neto, el impuesto IVA, los descuentos y el recargo por envio.
CREATE OR REPLACE VIEW vista_factura_cliente AS
SELECT u.run, u.nombre AS cliente, v.id_venta,
v.precio_sin_iva AS valor_neto,
v.total_iva AS impuesto_iva,
(SELECT COALESCE(MAX(o.descuento), 0)
 FROM incluye i
 JOIN promociona pr ON pr.sku_producto = i.sku_producto
 JOIN oferta o ON o.id_oferta = pr.id_oferta
 WHERE i.id_venta = v.id_venta) AS descuento,
des.precio AS recargo_envio,
(v.precio_sin_iva + v.total_iva + des.precio) AS total_factura
FROM usuario u
JOIN compra c ON c.run_usuario = u.run
JOIN venta v ON v.id_venta = c.id_venta
JOIN considera co ON co.id_venta = v.id_venta
JOIN despacho des ON des.id_despacho = co.id_despacho;

--------------------------------------------------------------------------------
-- 8.2. Vista inventario critico (stock < 10)
--------------------------------------------------------------------------------
-- Enunciado: Crear una vista de alerta que exponga el inventario critico, notificando sobre aquellos productos fisicos cuyo stock operativo descienda de las diez unidades.
CREATE OR REPLACE VIEW vista_inventario_critico AS
SELECT p.sku, p.nombre, st.cantidad AS stock_actual
FROM producto p
JOIN contiene c ON c.sku_producto = p.sku
JOIN caracteristicas car ON car.id_caracteristicas = c.id_caracteristicas
JOIN stock st ON st.id_stock = car.id_stock
WHERE st.cantidad < 10;

--------------------------------------------------------------------------------
-- 8.3. Vista rendimiento emprendedores por facturacion trimestral
--------------------------------------------------------------------------------
-- Enunciado: Formular una vista de rendimiento metrico que categorice a los emprendedores en rangos consolidados segun su facturacion trimestral bruta acumulada.
CREATE OR REPLACE VIEW vista_rendimiento_emprendedor AS
SELECT u.run, u.nombre,
SUM(mp.Precio_Total) AS facturacion_trimestral,
CASE
WHEN SUM(mp.Precio_Total) < 100000 THEN 'Bajo'
WHEN SUM(mp.Precio_Total) < 500000 THEN 'Medio'
ELSE 'Alto'
END AS rango
FROM usuario u
JOIN vende ve ON ve.id_usuario = u.run
JOIN detalle det ON det.id_producto = ve.id_producto
JOIN Medio_Pago mp ON mp.ID_Venta = det.id_venta
WHERE u.tipo_emprendedor = TRUE
AND mp.Fecha >= (DATE '2024-03-15' - INTERVAL '3 months')
GROUP BY u.run, u.nombre;

--------------------------------------------------------------------------------
-- 8.4. Life-Time Value de cada cliente
--------------------------------------------------------------------------------
-- Enunciado: Estructurar un modelo de consulta que reporte el valor historico consolidado (Life-Time Value) de cada cliente, integrando todo su volumen de transacciones en la plataforma.
--------------------------------------------------------------------------------
-- 8.5. Vista jerarquica de categorias y subcategorias
--------------------------------------------------------------------------------
-- Enunciado: Crear una vista jerarquica unificada que mapee la estructura completa y dependencias de todas las categorias y subcategorias mediante logica recursiva.
-- Consulta sin JOIN explicito: producto cartesiano con filtro
CREATE OR REPLACE VIEW vista_categorias_jerarquia AS
SELECT s.nombre_a_categoria AS categoria_padre,
s.nombre_b_categoria AS subcategoria
FROM subdivide s;

--------------------------------------------------------------------------------
-- 8.6. Utilidades proyectadas con comision 5%
--------------------------------------------------------------------------------
-- Enunciado: Consolidar el total de utilidades operativas proyectadas para la plataforma, asumiendo un cargo por comision equivalente al 5 % sobre el valor bruto de cada venta.
--------------------------------------------------------------------------------
-- 8.7. Vista geoespacial empresas y superficie de comunas
--------------------------------------------------------------------------------
-- Enunciado: Generar una vista geoespacial que agrupe a las empresas registradas segun su giro comercial y totalice la superficie demografica de las comunas donde mantienen presencia.
CREATE OR REPLACE VIEW vista_geo_empresas AS
SELECT e.run_empresa, e.nombre AS empresa,
cat.tipo AS giro,
SUM(co.superficie) AS superficie_total_comunas
FROM empresa e
JOIN direccion d ON d.run_empresa = e.run_empresa
JOIN comuna co ON co.id_comuna = d.id_comuna
JOIN comercializa com ON com.id_empresa = e.run_empresa
JOIN pertenece pe ON pe.id_producto = com.id_producto
JOIN categoria cat ON cat.nombre = pe.nombre_categoria
GROUP BY e.run_empresa, e.nombre, cat.tipo;

--------------------------------------------------------------------------------
-- 8.8. Promedio diario de nuevos clientes ultimo mes
--------------------------------------------------------------------------------
-- Enunciado: Disenar un panel de monitoreo temporal que muestre el promedio aritmetico diario de nuevos registros de clientes en el sistema a lo largo del ultimo mes calendario.
--------------------------------------------------------------------------------
-- 8.9. Auditoria de consistencia de montos
--------------------------------------------------------------------------------
-- Enunciado: Estructurar una consulta de auditoria que verifique la consistencia numerica, confirmando que el importe total abonado coincide con la suma aritmetica de brutos e IVA, restando el descuento.
--------------------------------------------------------------------------------
-- 8.10. Vista catalogo unificado productos y servicios
--------------------------------------------------------------------------------
-- Enunciado: Formular una vista general de catalogo unificado que integre la disponibilidad de productos fisicos y la oferta de servicios profesionales en una matriz unica de busqueda indexada.
CREATE OR REPLACE VIEW vista_catalogo_unificado AS
SELECT p.sku AS codigo, p.nombre, 'Producto' AS tipo, p.marca AS detalle, p.restriccion_edad
FROM producto p
UNION
SELECT s.sku AS codigo, s.nombre, 'Servicio' AS tipo, CAST(s.tiempo AS VARCHAR) AS detalle, s.restriccion_edad
FROM servicio s;
