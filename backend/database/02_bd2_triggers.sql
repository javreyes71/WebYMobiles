-- TRIGGER 1: Clientes con mas de 5 compras en el mismo mes: descuento del 10% y nota.

ALTER TABLE compra
ADD COLUMN IF NOT EXISTS descuento NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS nota TEXT;

CREATE OR REPLACE FUNCTION tgf_descuento_cliente_frecuente()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha DATE;
    v_compras INTEGER;
BEGIN
    SELECT Fecha INTO v_fecha
    FROM Medio_Pago
    WHERE ID_Venta = NEW.id_venta;

    IF v_fecha IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_compras
    FROM compra c
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    WHERE c.run_usuario = NEW.run_usuario
      AND EXTRACT(YEAR FROM mp.Fecha) = EXTRACT(YEAR FROM v_fecha)
      AND EXTRACT(MONTH FROM mp.Fecha) = EXTRACT(MONTH FROM v_fecha);

    IF v_compras > 5 THEN
        UPDATE compra
        SET descuento = 10,
            nota = 'Descuento del 10% por superar 5 compras en el mes'
        WHERE run_usuario = NEW.run_usuario
          AND id_venta = NEW.id_venta;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_01_descuento_cliente_frecuente ON compra;
CREATE TRIGGER trg_01_descuento_cliente_frecuente
AFTER INSERT OR UPDATE OF run_usuario, id_venta ON compra
FOR EACH ROW EXECUTE PROCEDURE tgf_descuento_cliente_frecuente();



-- TRIGGER 2: Calculo dinamico del costo de envio segun ancho, alto y fondo.

ALTER TABLE despacho
ADD COLUMN IF NOT EXISTS ancho NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS alto NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS fondo NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS costo_envio_proyectado NUMERIC(12,2);

CREATE OR REPLACE FUNCTION tgf_calcular_costo_envio()
RETURNS TRIGGER AS $$
DECLARE
    v_volumen NUMERIC;
BEGIN
    IF NEW.ancho IS NULL OR NEW.alto IS NULL OR NEW.fondo IS NULL THEN
        NEW.costo_envio_proyectado := NEW.precio;
        RETURN NEW;
    END IF;

    IF NEW.ancho <= 0 OR NEW.alto <= 0 OR NEW.fondo <= 0 THEN
        RAISE EXCEPTION 'Las dimensiones deben ser mayores que cero';
    END IF;

    v_volumen := NEW.ancho * NEW.alto * NEW.fondo;
    NEW.costo_envio_proyectado :=
        ROUND(COALESCE(NEW.precio, 0) + v_volumen * 0.05, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_02_calcular_costo_envio ON despacho;
CREATE TRIGGER trg_02_calcular_costo_envio
BEFORE INSERT OR UPDATE OF precio, ancho, alto, fondo ON despacho
FOR EACH ROW EXECUTE PROCEDURE tgf_calcular_costo_envio();



-- TRIGGER 3: Ocultar productos y servicios sin actividad durante mas de 40 dias.

ALTER TABLE producto
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ultima_actividad DATE;

ALTER TABLE servicio
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ultima_actividad DATE;

CREATE OR REPLACE FUNCTION tgf_actualizar_actividad_catalogo()
RETURNS TRIGGER AS $$
DECLARE
    v_venta INTEGER;
    v_fecha DATE;
BEGIN
    UPDATE producto
    SET visible = FALSE
    WHERE ultima_actividad IS NOT NULL
      AND ultima_actividad < CURRENT_DATE - 40;

    UPDATE servicio
    SET visible = FALSE
    WHERE ultima_actividad IS NOT NULL
      AND ultima_actividad < CURRENT_DATE - 40;

    IF TG_TABLE_NAME = 'medio_pago' THEN
        v_venta := NEW.ID_Venta;
        v_fecha := NEW.Fecha;
    ELSE
        v_venta := NEW.id_venta;
        SELECT Fecha INTO v_fecha
        FROM Medio_Pago
        WHERE ID_Venta = NEW.id_venta;
    END IF;

    UPDATE producto p
    SET ultima_actividad = v_fecha,
        visible = COALESCE(v_fecha >= CURRENT_DATE - 40, FALSE)
    FROM incluye i
    WHERE i.id_venta = v_venta
      AND p.sku = i.sku_producto;

    UPDATE servicio s
    SET ultima_actividad = v_fecha,
        visible = COALESCE(v_fecha >= CURRENT_DATE - 40, FALSE)
    FROM incluye i
    WHERE i.id_venta = v_venta
      AND s.sku = i.sku_servicio;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_03_actualizar_actividad_catalogo ON Medio_Pago;
CREATE TRIGGER trg_03_actualizar_actividad_catalogo
AFTER INSERT OR UPDATE OF Fecha, ID_Venta ON Medio_Pago
FOR EACH ROW EXECUTE PROCEDURE tgf_actualizar_actividad_catalogo();

DROP TRIGGER IF EXISTS trg_03_actualizar_actividad_incluye ON incluye;
CREATE TRIGGER trg_03_actualizar_actividad_incluye
AFTER INSERT OR UPDATE OF id_venta, sku_producto, sku_servicio ON incluye
FOR EACH ROW EXECUTE PROCEDURE tgf_actualizar_actividad_catalogo();



-- TRIGGER 4: Un producto o servicio solo puede tener una oferta activa al mismo tiempo.

CREATE OR REPLACE FUNCTION tgf_evitar_ofertas_superpuestas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_inicio IS NULL OR NEW.fecha_fin IS NULL
       OR NEW.fecha_fin < NEW.fecha_inicio THEN
        RAISE EXCEPTION 'El periodo de la oferta no es valido';
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF EXISTS (
            SELECT 1
            FROM promociona p
            WHERE (p.sku_producto = NEW.sku_producto
                   OR p.sku_servicio = NEW.sku_servicio)
              AND DATERANGE(p.fecha_inicio, p.fecha_fin, '[]')
                  && DATERANGE(NEW.fecha_inicio, NEW.fecha_fin, '[]')
        ) THEN
            RAISE EXCEPTION
                'El producto o servicio ya posee una oferta activa en ese periodo';
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1
            FROM promociona p
            WHERE (p.sku_producto = NEW.sku_producto
                   OR p.sku_servicio = NEW.sku_servicio)
              AND DATERANGE(p.fecha_inicio, p.fecha_fin, '[]')
                  && DATERANGE(NEW.fecha_inicio, NEW.fecha_fin, '[]')
              AND (p.id_oferta, p.sku_servicio, p.sku_producto)
                  IS DISTINCT FROM
                  (OLD.id_oferta, OLD.sku_servicio, OLD.sku_producto)
        ) THEN
            RAISE EXCEPTION
                'El producto o servicio ya posee una oferta activa en ese periodo';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_04_evitar_ofertas_superpuestas ON promociona;
CREATE TRIGGER trg_04_evitar_ofertas_superpuestas
BEFORE INSERT OR UPDATE ON promociona
FOR EACH ROW EXECUTE PROCEDURE tgf_evitar_ofertas_superpuestas();



-- TRIGGER 5: Usar el precio con oferta vigente; de lo contrario, el precio original.

ALTER TABLE detalle
ADD COLUMN IF NOT EXISTS precio_aplicado NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS descuento_aplicado NUMERIC(5,2) DEFAULT 0;

CREATE OR REPLACE FUNCTION tgf_precio_vigente_producto()
RETURNS TRIGGER AS $$
DECLARE
    v_precio NUMERIC;
    v_descuento NUMERIC := 0;
BEGIN
    SELECT c.precio::NUMERIC INTO v_precio
    FROM comercializa c
    WHERE c.id_producto = NEW.id_producto
      AND c.id_empresa = NEW.id_empresa
    LIMIT 1;

    IF v_precio IS NULL THEN
        SELECT ve.precio::NUMERIC INTO v_precio
        FROM vende ve
        WHERE ve.id_producto = NEW.id_producto
        ORDER BY ve.id_usuario
        LIMIT 1;
    END IF;

    IF v_precio IS NULL THEN
        RAISE EXCEPTION 'El producto % no posee precio de venta', NEW.id_producto;
    END IF;

    SELECT COALESCE(MAX(o.descuento), 0)
    INTO v_descuento
    FROM promociona p
    JOIN oferta o ON o.id_oferta = p.id_oferta
    WHERE p.sku_producto = NEW.id_producto
      AND CURRENT_DATE BETWEEN p.fecha_inicio AND p.fecha_fin;

    NEW.descuento_aplicado := v_descuento;
    NEW.precio_aplicado := ROUND(v_precio * (1 - v_descuento / 100), 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_05_precio_vigente_producto ON detalle;
CREATE TRIGGER trg_05_precio_vigente_producto
BEFORE INSERT OR UPDATE OF id_producto ON detalle
FOR EACH ROW EXECUTE PROCEDURE tgf_precio_vigente_producto();



-- TRIGGER 6: Impedir que un menor contrate un servicio con restriccion de edad.

CREATE OR REPLACE FUNCTION tgf_validar_restriccion_edad()
RETURNS TRIGGER AS $$
DECLARE
    v_restringido BOOLEAN;
    v_nacimiento DATE;
    v_edad INTEGER;
BEGIN
    SELECT restriccion_edad INTO v_restringido
    FROM servicio WHERE sku = NEW.sku_servicio;

    IF COALESCE(v_restringido, FALSE) = FALSE THEN
        RETURN NEW;
    END IF;

    SELECT fecha_nacimiento INTO v_nacimiento
    FROM usuario WHERE run = NEW.run_usuario;

    IF v_nacimiento IS NULL THEN
        RAISE EXCEPTION
            'No se puede validar la edad del usuario %', NEW.run_usuario;
    END IF;

    v_edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_nacimiento));
    IF v_edad < 18 THEN
        RAISE EXCEPTION
            'El usuario % es menor de edad y no puede contratar el servicio %',
            NEW.run_usuario, NEW.sku_servicio;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_06_validar_restriccion_edad ON incluye;
CREATE TRIGGER trg_06_validar_restriccion_edad
BEFORE INSERT OR UPDATE OF run_usuario, sku_servicio ON incluye
FOR EACH ROW EXECUTE PROCEDURE tgf_validar_restriccion_edad();



-- TRIGGER 7: Rechazar correos con estructura o dominio invalido.

CREATE OR REPLACE FUNCTION tgf_validar_correo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.direccion_correo := LOWER(TRIM(NEW.direccion_correo));

    IF NEW.direccion_correo !~
       '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
       OR NEW.direccion_correo LIKE '%..%' THEN
        RAISE EXCEPTION 'Correo electronico invalido: %', NEW.direccion_correo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_07_validar_correo ON correo;
CREATE TRIGGER trg_07_validar_correo
BEFORE INSERT OR UPDATE OF direccion_correo ON correo
FOR EACH ROW EXECUTE PROCEDURE tgf_validar_correo();



-- TRIGGER 8: Crear una alerta cuando el stock sea inferior a 10 unidades.

CREATE TABLE IF NOT EXISTS alerta_inventario (
    id_alerta BIGSERIAL PRIMARY KEY,
    id_stock INTEGER,
    sku_producto VARCHAR(50),
    cantidad INTEGER,
    mensaje TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION tgf_alerta_inventario_critico()
RETURNS TRIGGER AS $$
DECLARE
    v_sku VARCHAR(50);
BEGIN
    IF NEW.cantidad < 10 THEN
        IF TG_OP = 'UPDATE'
           AND OLD.cantidad < 10
           AND OLD.cantidad = NEW.cantidad THEN
            RETURN NEW;
        END IF;

        SELECT c.sku_producto INTO v_sku
        FROM caracteristicas ca
        JOIN contiene c ON c.id_caracteristicas = ca.id_caracteristicas
        WHERE ca.id_stock = NEW.id_stock
        LIMIT 1;

        INSERT INTO alerta_inventario
            (id_stock, sku_producto, cantidad, mensaje)
        VALUES
            (NEW.id_stock, v_sku, NEW.cantidad,
             'Inventario critico: quedan menos de 10 unidades');

        RAISE NOTICE 'Inventario critico para %, stock: %',
                     COALESCE(v_sku, 'sin producto'), NEW.cantidad;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_08_alerta_inventario_critico ON stock;
CREATE TRIGGER trg_08_alerta_inventario_critico
AFTER INSERT OR UPDATE OF cantidad ON stock
FOR EACH ROW EXECUTE PROCEDURE tgf_alerta_inventario_critico();



-- TRIGGER 9: Al concretar una compra, descontar la cantidad comprada del stock.

CREATE OR REPLACE FUNCTION tgf_descontar_stock_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_cantidad INTEGER;
    v_stock INTEGER;
BEGIN
    IF NEW.sku_producto IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT cantidad INTO v_cantidad
    FROM venta WHERE id_venta = NEW.id_venta;

    SELECT s.cantidad INTO v_stock
    FROM contiene c
    JOIN caracteristicas ca
      ON ca.id_caracteristicas = c.id_caracteristicas
    JOIN stock s ON s.id_stock = ca.id_stock
    WHERE c.sku_producto = NEW.sku_producto
    FOR UPDATE;

    IF v_stock IS NULL THEN
        RAISE EXCEPTION 'No existe stock para el producto %', NEW.sku_producto;
    END IF;
    IF v_stock < v_cantidad THEN
        RAISE EXCEPTION
            'Stock insuficiente para %. Disponible: %, solicitado: %',
            NEW.sku_producto, v_stock, v_cantidad;
    END IF;

    UPDATE stock s
    SET cantidad = cantidad - v_cantidad
    FROM caracteristicas ca
    JOIN contiene c ON c.id_caracteristicas = ca.id_caracteristicas
    WHERE c.sku_producto = NEW.sku_producto
      AND s.id_stock = ca.id_stock;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_09_descontar_stock_compra ON incluye;
CREATE TRIGGER trg_09_descontar_stock_compra
AFTER INSERT ON incluye
FOR EACH ROW EXECUTE PROCEDURE tgf_descontar_stock_compra();



-- TRIGGER 10: Al concretar una devolucion, reintegrar la cantidad al stock.

CREATE OR REPLACE FUNCTION tgf_reintegrar_stock_devolucion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado NOT IN ('Aprobada', 'Entregado') THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.estado IN ('Aprobada', 'Entregado') THEN
            RETURN NEW;
        END IF;
    END IF;

    UPDATE stock s
    SET cantidad = s.cantidad + v.cantidad
    FROM considera co
    JOIN detalle d ON d.id_venta = co.id_venta
    JOIN venta v ON v.id_venta = co.id_venta
    JOIN contiene c ON c.sku_producto = d.id_producto
    JOIN caracteristicas ca
      ON ca.id_caracteristicas = c.id_caracteristicas
    WHERE co.id_despacho = NEW.id_despacho
      AND s.id_stock = ca.id_stock;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_10_reintegrar_stock_devolucion ON devolucion;
CREATE TRIGGER trg_10_reintegrar_stock_devolucion
AFTER INSERT OR UPDATE OF estado ON devolucion
FOR EACH ROW EXECUTE PROCEDURE tgf_reintegrar_stock_devolucion();



-- TRIGGER 11: Ocultar productos cuyo stock llegue a cero.

CREATE OR REPLACE FUNCTION tgf_ocultar_producto_sin_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE producto p
    SET visible = (NEW.cantidad > 0)
                  AND (
                      p.ultima_actividad IS NULL
                      OR p.ultima_actividad >= CURRENT_DATE - 40
                  )
    FROM caracteristicas ca
    JOIN contiene c ON c.id_caracteristicas = ca.id_caracteristicas
    WHERE ca.id_stock = NEW.id_stock
      AND p.sku = c.sku_producto;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_11_ocultar_producto_sin_stock ON stock;
CREATE TRIGGER trg_11_ocultar_producto_sin_stock
AFTER INSERT OR UPDATE OF cantidad ON stock
FOR EACH ROW EXECUTE PROCEDURE tgf_ocultar_producto_sin_stock();



-- TRIGGER 12: Calcular automaticamente IVA y total de la venta.

ALTER TABLE venta
ADD COLUMN IF NOT EXISTS total NUMERIC(12,2);

CREATE OR REPLACE FUNCTION tgf_calcular_total_venta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.precio_sin_iva IS NULL OR NEW.precio_sin_iva < 0 THEN
        RAISE EXCEPTION 'El valor neto de la venta debe ser mayor o igual a cero';
    END IF;
    NEW.total_iva := NEW.precio_sin_iva * 0.19;
    NEW.total := NEW.precio_sin_iva + NEW.total_iva;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_12_calcular_total_venta ON venta;
CREATE TRIGGER trg_12_calcular_total_venta
BEFORE INSERT OR UPDATE OF precio_sin_iva ON venta
FOR EACH ROW EXECUTE PROCEDURE tgf_calcular_total_venta();



-- TRIGGER 13: Validar que el total pagado sea neto mas IVA menos descuento vigente.

CREATE OR REPLACE FUNCTION tgf_validar_total_pagado()
RETURNS TRIGGER AS $$
DECLARE
    v_descuento NUMERIC := 0;
    v_descuento_cliente NUMERIC := 0;
    v_esperado NUMERIC;
BEGIN
    SELECT COALESCE(MAX(o.descuento), 0)
    INTO v_descuento
    FROM incluye i
    JOIN promociona p ON p.sku_producto = i.sku_producto
    JOIN oferta o ON o.id_oferta = p.id_oferta
    WHERE i.id_venta = NEW.ID_Venta
      AND NEW.Fecha BETWEEN p.fecha_inicio AND p.fecha_fin;

    SELECT COALESCE(MAX(c.descuento), 0)
    INTO v_descuento_cliente
    FROM compra c
    WHERE c.id_venta = NEW.ID_Venta;

    v_descuento := GREATEST(v_descuento, v_descuento_cliente);

    IF NEW.Precio_sin_IVA IS NULL
       OR NEW.Total_IVA IS NULL
       OR NEW.Precio_Total IS NULL THEN
        RAISE EXCEPTION 'Los valores del pago no pueden ser nulos';
    END IF;

    v_esperado := ROUND(
        NEW.Precio_sin_IVA + NEW.Total_IVA
        - (NEW.Precio_sin_IVA * v_descuento / 100), 0
    );

    IF NEW.Precio_Total <> v_esperado THEN
        RAISE EXCEPTION
            'Total inconsistente. Recibido: %, esperado: %',
            NEW.Precio_Total, v_esperado;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_13_validar_total_pagado ON Medio_Pago;
CREATE TRIGGER trg_13_validar_total_pagado
BEFORE INSERT OR UPDATE OF Precio_sin_IVA, Total_IVA, Precio_Total,
                           Fecha, ID_Venta
ON Medio_Pago
FOR EACH ROW EXECUTE PROCEDURE tgf_validar_total_pagado();

CREATE OR REPLACE FUNCTION tgf_aplicar_descuento_pago()
RETURNS TRIGGER AS $$
DECLARE
    v_descuento NUMERIC := 0;
    v_descuento_cliente NUMERIC := 0;
BEGIN
    SELECT COALESCE(MAX(o.descuento), 0)
    INTO v_descuento
    FROM promociona p
    JOIN oferta o ON o.id_oferta = p.id_oferta
    JOIN Medio_Pago mp ON mp.ID_Venta = NEW.id_venta
    WHERE p.sku_producto = NEW.sku_producto
      AND mp.Fecha BETWEEN p.fecha_inicio AND p.fecha_fin;

    SELECT COALESCE(MAX(c.descuento), 0)
    INTO v_descuento_cliente
    FROM compra c
    WHERE c.id_venta = NEW.id_venta;

    v_descuento := GREATEST(v_descuento, v_descuento_cliente);

    UPDATE Medio_Pago
    SET Precio_Total = ROUND(
        Precio_sin_IVA + Total_IVA
        - (Precio_sin_IVA * v_descuento / 100), 0
    )
    WHERE ID_Venta = NEW.id_venta;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_13_aplicar_descuento_pago ON incluye;
CREATE TRIGGER trg_13_aplicar_descuento_pago
AFTER INSERT OR UPDATE OF sku_producto, id_venta ON incluye
FOR EACH ROW EXECUTE PROCEDURE tgf_aplicar_descuento_pago();



-- TRIGGER 14: Validar y corregir el digito verificador del RUN de clientes y emprendedores.
-- 1. Función para calcular el Dígito Verificador del RUT chileno
CREATE OR REPLACE FUNCTION fn_calcular_dv_rut(p_numero TEXT)
RETURNS TEXT AS $$
DECLARE
    v_suma INTEGER := 0;
    v_factor INTEGER := 2;
    v_indice INTEGER;
    v_resto INTEGER;
BEGIN
    FOR v_indice IN REVERSE LENGTH(p_numero)..1 LOOP
        v_suma := v_suma + SUBSTRING(p_numero FROM v_indice FOR 1)::INTEGER * v_factor;
        v_factor := v_factor + 1;
        IF v_factor > 7 THEN
            v_factor := 2;
        END IF;
    END LOOP;

    v_resto := 11 - (v_suma % 11);
    IF v_resto = 11 THEN RETURN '0'; END IF;
    IF v_resto = 10 THEN RETURN 'K'; END IF;
    RETURN v_resto::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Función del Trigger que detecta y corrige el RUT
CREATE OR REPLACE FUNCTION tgf_corregir_rut()
RETURNS TRIGGER AS $$
DECLARE
    v_rut TEXT;
    v_numero TEXT;
    v_actual TEXT;
    v_correcto TEXT;
BEGIN
    IF TG_TABLE_NAME = 'usuario' THEN
        v_rut := NEW.run;
    ELSE
        v_rut := NEW.run_empresa;
    END IF;

    v_rut := UPPER(REPLACE(REPLACE(v_rut, '.', ''), ' ', ''));
    v_numero := SPLIT_PART(v_rut, '-', 1);
    v_actual := SPLIT_PART(v_rut, '-', 2);

    IF v_numero !~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'RUT invalido: %', v_rut;
    END IF;

    v_correcto := fn_calcular_dv_rut(v_numero);
    IF v_actual <> v_correcto THEN
        RAISE NOTICE 'RUT % corregido a %-%', v_rut, v_numero, v_correcto;
    END IF;

    IF TG_TABLE_NAME = 'usuario' THEN
        NEW.run := v_numero || '-' || v_correcto;
    ELSE
        NEW.run_empresa := v_numero || '-' || v_correcto;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_14_corregir_rut_usuario ON usuario;
CREATE TRIGGER trg_14_corregir_rut_usuario
BEFORE INSERT OR UPDATE OF run ON usuario
FOR EACH ROW EXECUTE PROCEDURE tgf_corregir_rut();

DROP TRIGGER IF EXISTS trg_14_corregir_rut_empresa ON empresa;
CREATE TRIGGER trg_14_corregir_rut_empresa
BEFORE INSERT OR UPDATE OF run_empresa ON empresa
FOR EACH ROW EXECUTE PROCEDURE tgf_corregir_rut();

-- TRIGGER 16: Impedir eliminar a un cliente con compras sin entregar o con una compra dentro de los ultimos 60 dias.

DROP TRIGGER IF EXISTS trg_16_evitar_eliminar_cliente ON usuario;
DROP FUNCTION IF EXISTS tgf_evitar_eliminar_cliente();

CREATE OR REPLACE FUNCTION tgf_evitar_eliminar_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM compra c
        JOIN considera co ON co.id_venta = c.id_venta
        JOIN despacho d ON d.id_despacho = co.id_despacho
        WHERE c.run_usuario = OLD.run
          AND d.estado IS DISTINCT FROM 'Entregado'
    ) OR EXISTS (
        SELECT 1
        FROM compra c
        JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
        WHERE c.run_usuario = OLD.run
          AND mp.Fecha >= CURRENT_DATE - 60
    ) THEN
        RAISE EXCEPTION 'No se puede eliminar al cliente %: tiene compras sin entregar o dentro de los ultimos 60 dias', OLD.run;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_16_evitar_eliminar_cliente
BEFORE DELETE ON usuario
FOR EACH ROW EXECUTE PROCEDURE tgf_evitar_eliminar_cliente();



-- TRIGGER 17: Evitar que la cantidad de un producto en el inventario se vuelva negativa.

DROP TRIGGER IF EXISTS trg_17_stock_no_negativo ON stock;
DROP FUNCTION IF EXISTS tgf_stock_no_negativo();

CREATE OR REPLACE FUNCTION tgf_stock_no_negativo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cantidad < 0 THEN
        RAISE EXCEPTION 'El stock % no puede quedar en %', NEW.id_stock, NEW.cantidad;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_17_stock_no_negativo
BEFORE INSERT OR UPDATE OF cantidad ON stock
FOR EACH ROW EXECUTE PROCEDURE tgf_stock_no_negativo();



-- TRIGGER 18: Impedir modificar una venta cuando el despacho esta Entregado o el pago quedo Completada.

DROP TRIGGER IF EXISTS trg_18_bloquear_boleta_emitida ON venta;
DROP FUNCTION IF EXISTS tgf_bloquear_boleta_emitida();

CREATE OR REPLACE FUNCTION tgf_bloquear_boleta_emitida()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM considera co
        JOIN despacho d ON d.id_despacho = co.id_despacho
        WHERE co.id_venta = OLD.id_venta
          AND d.estado = 'Entregado'
    ) OR EXISTS (
        SELECT 1
        FROM Medio_Pago mp
        JOIN genera g ON g.id_medio_pago = mp.Codigo_Transferencia
        WHERE mp.ID_Venta = OLD.id_venta
          AND g.estado = 'Completada'
    ) THEN
        RAISE EXCEPTION 'La venta % ya esta entregada o pagada y no se puede modificar', OLD.id_venta;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_18_bloquear_boleta_emitida
BEFORE UPDATE ON venta
FOR EACH ROW EXECUTE PROCEDURE tgf_bloquear_boleta_emitida();



-- TRIGGER 19: La cotizacion dura 15 dias, despues se reajusta cada semana y a los 45 dias se elimina.

ALTER TABLE cotizacion
ADD COLUMN IF NOT EXISTS fecha_limite DATE;

ALTER TABLE solicita
ADD COLUMN IF NOT EXISTS precio_base INTEGER,
ADD COLUMN IF NOT EXISTS semanas_reajuste INTEGER DEFAULT 0;

DROP TRIGGER IF EXISTS trg_19_vigencia_cotizacion ON cotizacion;
DROP TRIGGER IF EXISTS trg_19_reajuste_solicita ON solicita;
DROP FUNCTION IF EXISTS tgf_vigencia_cotizacion();
DROP FUNCTION IF EXISTS tgf_reajuste_cotizacion();

CREATE OR REPLACE FUNCTION tgf_vigencia_cotizacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha IS NULL THEN
        NEW.fecha := CURRENT_DATE;
    END IF;

    IF NEW.fecha + 45 < CURRENT_DATE THEN
        RAISE EXCEPTION 'La cotizacion supera los 45 dias y debe eliminarse';
    END IF;

    NEW.fecha_limite := NEW.fecha + 15;

    DELETE FROM cotizacion c
    WHERE c.fecha + 45 < CURRENT_DATE
      AND c.id_cotizacion <> NEW.id_cotizacion
      AND NOT EXISTS (SELECT 1 FROM producto p WHERE p.id_cotizacion = c.id_cotizacion)
      AND NOT EXISTS (SELECT 1 FROM servicio s WHERE s.id_cotizacion = c.id_cotizacion);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_19_vigencia_cotizacion
BEFORE INSERT OR UPDATE OF fecha ON cotizacion
FOR EACH ROW EXECUTE PROCEDURE tgf_vigencia_cotizacion();

CREATE OR REPLACE FUNCTION tgf_reajuste_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha DATE;
    v_semanas INTEGER;
BEGIN
    SELECT fecha INTO v_fecha
    FROM cotizacion
    WHERE id_cotizacion = NEW.id_cotizacion;

    IF v_fecha IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.precio_base IS NULL THEN
        NEW.precio_base := NEW.precio;
    END IF;

    v_semanas := FLOOR((CURRENT_DATE - (v_fecha + 15)) / 7.0)::INTEGER;
    IF v_semanas > 0 AND v_semanas IS DISTINCT FROM COALESCE(NEW.semanas_reajuste, 0) THEN
        NEW.semanas_reajuste := v_semanas;
        NEW.precio := ROUND(NEW.precio_base * (1 + (0.02 * v_semanas)))::INTEGER;
        RAISE NOTICE 'Cotizacion % reajustada a % tras % semana(s)', NEW.id_cotizacion, NEW.precio, v_semanas;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_19_reajuste_solicita
BEFORE INSERT OR UPDATE OF precio, id_cotizacion ON solicita
FOR EACH ROW EXECUTE PROCEDURE tgf_reajuste_cotizacion();



-- TRIGGER 20: Advertir si la cantidad pedida supera el stock, al agregar un producto a la compra o a la cotizacion.

DROP TRIGGER IF EXISTS trg_20_disponibilidad_incluye ON incluye;
DROP TRIGGER IF EXISTS trg_20_disponibilidad_detalle ON detalle;
DROP FUNCTION IF EXISTS tgf_advertir_disponibilidad();

CREATE OR REPLACE FUNCTION tgf_advertir_disponibilidad()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido INTEGER;
    v_stock INTEGER;
    v_sku VARCHAR;
BEGIN
    IF TG_TABLE_NAME = 'incluye' THEN
        v_sku := NEW.sku_producto;
    ELSE
        v_sku := NEW.id_producto;
    END IF;

    SELECT COALESCE(cantidad, 1) INTO v_pedido
    FROM venta
    WHERE id_venta = NEW.id_venta;

    SELECT s.cantidad INTO v_stock
    FROM contiene c
    JOIN caracteristicas ca ON ca.id_caracteristicas = c.id_caracteristicas
    JOIN stock s ON s.id_stock = ca.id_stock
    WHERE c.sku_producto = v_sku
    LIMIT 1;

    IF v_stock IS NOT NULL AND COALESCE(v_pedido, 1) > v_stock THEN
        RAISE NOTICE 'Advertencia: el producto % pide % y el stock es %', v_sku, v_pedido, v_stock;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_20_disponibilidad_incluye
BEFORE INSERT ON incluye
FOR EACH ROW EXECUTE PROCEDURE tgf_advertir_disponibilidad();

CREATE TRIGGER trg_20_disponibilidad_detalle
BEFORE INSERT ON detalle
FOR EACH ROW EXECUTE PROCEDURE tgf_advertir_disponibilidad();



-- TRIGGER 21: Funcion que recorre clientes y empresas, valida el digito verificador y advierte si es incorrecto.

DROP FUNCTION IF EXISTS fn_validar_ruts_masivo();

CREATE OR REPLACE FUNCTION fn_validar_ruts_masivo()
RETURNS TABLE (
    tipo VARCHAR,
    run VARCHAR,
    dv_informado TEXT,
    dv_correcto TEXT,
    estado TEXT
) AS $$
DECLARE
    r RECORD;
    v_numero TEXT;
    v_actual TEXT;
    v_correcto TEXT;
BEGIN
    FOR r IN
        SELECT 'cliente'::VARCHAR AS tipo, u.run AS run
        FROM usuario u
        UNION ALL
        SELECT 'empresa'::VARCHAR, e.run_empresa
        FROM empresa e
    LOOP
        v_numero := SPLIT_PART(REPLACE(UPPER(r.run), '.', ''), '-', 1);
        v_actual := SPLIT_PART(REPLACE(UPPER(r.run), '.', ''), '-', 2);
        IF v_numero ~ '^[0-9]+$' THEN
            v_correcto := fn_calcular_dv_rut(v_numero);
            tipo := r.tipo;
            run := r.run;
            dv_informado := v_actual;
            dv_correcto := v_correcto;
            estado := CASE WHEN v_actual = v_correcto THEN 'Valido' ELSE 'Incorrecto' END;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;



-- TRIGGER 22: Clientes sin compras en los ultimos 6 meses reciben 5% en la proxima compra.
ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS descuento_proxima NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_desde DATE;
ALTER TABLE compra
ADD COLUMN IF NOT EXISTS descuento NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS nota TEXT;
DROP TRIGGER IF EXISTS trg_22_descuento_inactividad ON compra;
DROP FUNCTION IF EXISTS tgf_descuento_inactividad();
CREATE OR REPLACE FUNCTION tgf_descuento_inactividad()
RETURNS TRIGGER AS $$
DECLARE
    v_ultima DATE;
    v_desde DATE;
    v_descuento NUMERIC;
BEGIN
    -- Busca la última compra del usuario (distinta de la actual)
    SELECT MAX(mp.Fecha) INTO v_ultima
    FROM compra c
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    WHERE c.run_usuario = NEW.run_usuario
      AND c.id_venta <> NEW.id_venta;
    SELECT descuento_desde, COALESCE(descuento_proxima, 0)
    INTO v_desde, v_descuento
    FROM usuario
    WHERE run = NEW.run_usuario;
    -- Si pasaron más de 45 días, el descuento vence
    IF v_desde IS NOT NULL AND v_desde + 45 < CURRENT_DATE THEN
        UPDATE usuario
        SET descuento_proxima = 0,
            descuento_desde = NULL
        WHERE run = NEW.run_usuario;
        v_descuento := 0;
        v_desde := NULL;
        RAISE NOTICE 'El descuento de 5%% de % vencio a los 45 dias', NEW.run_usuario;
    END IF;
    -- Si no tiene compras o la última fue hace más de 6 meses, asignar 5%
    IF (v_ultima IS NULL OR v_ultima < CURRENT_DATE - INTERVAL '6 months')
       AND v_descuento = 0 THEN
        UPDATE usuario
        SET descuento_proxima = 5,
            descuento_desde = CURRENT_DATE
        WHERE run = NEW.run_usuario;
        NEW.descuento := 5;
        NEW.nota := 'Descuento del 5% por 6 meses sin compras. Vigente 45 dias';
    ELSIF v_descuento = 5 AND v_desde IS NOT NULL AND v_desde + 45 >= CURRENT_DATE THEN
        NEW.descuento := 5;
        NEW.nota := 'Descuento del 5% vigente hasta ' || (v_desde + 45)::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_22_descuento_inactividad
BEFORE INSERT ON compra
FOR EACH ROW EXECUTE PROCEDURE tgf_descuento_inactividad();

-- TRIGGER 23: Ese descuento dura solo 45 dias.

ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS descuento_proxima NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_desde DATE;

DROP TRIGGER IF EXISTS trg_22_descuento_inactividad ON compra;
DROP FUNCTION IF EXISTS tgf_descuento_inactividad();

CREATE OR REPLACE FUNCTION tgf_descuento_inactividad()
RETURNS TRIGGER AS $$
DECLARE
    v_ultima DATE;
    v_desde DATE;
    v_descuento NUMERIC;
BEGIN
    SELECT MAX(mp.Fecha) INTO v_ultima
    FROM compra c
    JOIN Medio_Pago mp ON mp.ID_Venta = c.id_venta
    WHERE c.run_usuario = NEW.run_usuario
      AND c.id_venta <> NEW.id_venta;

    SELECT descuento_desde, COALESCE(descuento_proxima, 0)
    INTO v_desde, v_descuento
    FROM usuario
    WHERE run = NEW.run_usuario;

    IF v_desde IS NOT NULL AND v_desde + 45 < CURRENT_DATE THEN
        UPDATE usuario
        SET descuento_proxima = 0,
            descuento_desde = NULL
        WHERE run = NEW.run_usuario;
        v_descuento := 0;
        v_desde := NULL;
        RAISE NOTICE 'El descuento de 5%% de % vencio a los 45 dias', NEW.run_usuario;
    END IF;

    IF (v_ultima IS NULL OR v_ultima < CURRENT_DATE - INTERVAL '6 months')
       AND v_descuento = 0 THEN
        UPDATE usuario
        SET descuento_proxima = 5,
            descuento_desde = CURRENT_DATE
        WHERE run = NEW.run_usuario;
        NEW.descuento := 5;
        NEW.nota := 'Descuento del 5% por 6 meses sin compras. Vigente 45 dias';
    ELSIF v_descuento = 5 AND v_desde IS NOT NULL AND v_desde + 45 >= CURRENT_DATE THEN
        NEW.descuento := 5;
        NEW.nota := 'Descuento del 5% vigente hasta ' || (v_desde + 45)::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_22_descuento_inactividad
BEFORE INSERT ON compra
FOR EACH ROW EXECUTE PROCEDURE tgf_descuento_inactividad();



