# Documentación Técnica de Desarrollo Implementado — Vento Marketplace (WYM)

Este documento detalla la implementación integral en **5 fases** realizada sobre el repositorio **WebYMobiles (Vento Marketplace)**, junto con la matriz de verificación de cumplimiento de todos los requerimientos funcionales solicitados y los estándares técnicos/académicos establecidos en la carpeta `pdfs/` (*Tecnologías Web y Móviles*).

---

## 1. Resumen Ejecutivo

Se evolucionó la aplicación hacia un **Marketplace de Compra/Venta de Productos y Contratación/Cotización de Servicios Profesionales** de nivel productivo, manteniendo el stack base (**React 18 + Vite 5 + Tailwind CSS 3 + Material UI 6 + React Router DOM 6**) y resolviendo brechas arquitectónicas, funcionales y de experiencia de usuario:

- **Separación estricta entre Ventas y Servicios:** La barra superior (`Navbar`) incorpora de forma permanente y pública la sección **`SERVICIOS`** (`/servicios`), totalmente independiente de **`TIENDA`** (`/tienda`). En ninguna vista de catálogo ni tabla de administración se mezclan productos físicos con servicios profesionales.
- **Autenticación completa y accesible:** Incorporación del botón de **ojo (`Visibility` / `VisibilityOff`)** para visualizar caracteres en todos los campos de contraseña (Login y Registro), flujo interactivo **`¿Olvidaste tu contraseña?`**, casilla **`Recordar usuario`**, auto-formateo de **RUT chileno** en tiempo real con validación Módulo 11 y control de duplicados (`409 Conflict`).
- **Corrección de bugs críticos y flujo E-Commerce de punta a punta:** Reparación del error fatal `clearCart is not a function` en `Checkout.jsx`, unificación matemática entre Carrito y Checkout (despacho gratis desde `$50.000` y cupones de descuento reales), ofertas con recálculo real de precios (eliminando ítems corruptos con `$NaN`), carga de imágenes locales con previsualización (`FileReader`), galería interactiva, control de stock, reseñas, lista de deseos (*Wishlist*) y **Modal de Cotización de Servicios (`QuoteModal`)**.
- **Cumplimiento de estándares académicos (PDFs del curso):** Arquitectura estricta **Atomic Design**, alias `@/` en Vite, HTML5 semántico **W3C**, accesibilidad **WCAG**, variables de entorno (`VITE_API_URL` + `.env.example`), cliente HTTP con validación `respuesta.ok` y `try/catch`, contrato JSON `{ success, message, data, errors }` y manejo explícito de los **4 estados de interfaz con Material UI** (*Cargando*, *Éxito*, *Error de validación* y *Fallo de conexión*).

---

## 2. Desarrollo Implementado por Fases

### Fase 1: Arquitectura Atómica, Alias `@/`, Tema MUI y Estándar W3C/WCAG

1. **Configuración de Build y Variables de Entorno:**
   - `vite.config.js`: Configuración del alias `@/` apuntando a `./src` (según *Guía REACT y MUI.pdf*, pág. 5) y particionado de bundles (`manualChunks` para `vendor-react`, `vendor-mui` y `vendor-icons`) optimizando la carga en producción sin advertencias de tamaño ni ciclos.
   - `.gitignore` y `.env.example`: Protección de `.env` y documentación de `VITE_API_URL` para conexión limpia con un backend `.NET + PostgreSQL`.
   - `index.html`: Cambio de idioma raíz a `<html lang="es">` y metadatos descriptivos en español.
2. **Tema Global y Utilidades de Validación:**
   - `src/theme.js`: Definición de paleta corporativa Vento, tipografía `Inter` y bordes redondeados consistentes para componentes Material UI.
   - `src/utils/validators.js`: Implementación de `validateRUT` (Módulo 11), `formatRUT` (formateo dinámico `XX.XXX.XXX-X`), `normalizeRUT`, `validateEmail`, `getInitials` y `formatCurrency` (`CLP`).
3. **Átomos y Organismo Global:**
   - `src/components/atoms/TextField/CustomTextField.jsx`: Campo reutilizable basado en MUI `TextField` que detecta automáticamente `type="password"` e inyecta un `IconButton` accesible (`aria-label`) con íconos `Visibility` y `VisibilityOff`.
   - `src/components/atoms/Button/CustomButton.jsx`: Botón atómico con estado `loading` (`CircularProgress`), soporte de íconos y variantes (`primary`, `secondary`, `service`, `danger`, `outline`).
   - `src/components/atoms/Logo/Logo.jsx`, `NavLinkItem/NavLinkItem.jsx` y `ProtectedRoute/ProtectedRoute.jsx` (guardián de rutas autenticadas y de rol `Admin`).
   - `src/components/organisms/Footer/Footer.jsx`: Pie de página semántico `<footer>` global con enlaces rápidos a Tienda, Servicios, Carrito, Contacto y garantías de compra segura.

---

### Fase 2: Barra Superior y Separación Total de "Tienda (Ventas)" vs. "Servicios"

1. **Barra Superior (`src/components/organisms/Navbar/Navbar.jsx`):**
   - Navegación principal visible para todo usuario (autenticado o visitante): **`INICIO`** (`/`), **`TIENDA`** (`/tienda`), **`SERVICIOS`** (`/servicios`) y **`CONTACTO`** (`/contacto`).
   - Acciones diferenciadas para usuarios autenticados: **`Vender`** (`/admin/productos`) separado de **`Ofrecer Servicio`** (`/admin/servicios`).
   - Indicadores dinámicos con contadores para **Favoritos (*Wishlist*)** y **Carrito de Compras**, además de menú móvil responsive completo.
2. **Datasets y Modelos Independientes:**
   - `src/data/products.js`: Catálogo exclusivo de productos físicos (`tipo: 'Producto'`) con `stock`, múltiples imágenes (`images`), `marca`, `genero`, `tallas`, `envioGratis`, `rating` y `reviews`.
   - `src/data/services.js`: Catálogo exclusivo de servicios profesionales (`tipo: 'Servicio'`) con `modalidad` (*Presencial*, *Remoto / Online*, *A Domicilio*), `duracionEstimada`, `cobertura`, `profesional`, `experiencia`, `garantia` e ilustraciones vectoriales embebidas listas para uso sin conexión.
3. **Componentes y Vistas Especializadas:**
   - `src/components/molecules/ServiceCard/ServiceCard.jsx`: Tarjeta exclusiva para servicios (distinta visual y funcionalmente de `ProductCard.jsx`), destacando modalidad, cobertura, tiempo estimado, proveedor verificado y botón directo **`Solicitar Cotización`**.
   - `src/pages/Servicios/Servicios.jsx`: Página dedicada en `/servicios` con identidad visual propia, buscador especializado, filtros por categoría de servicio, modalidad, cobertura geográfica, rango tarifario, ordenamiento y apertura directa del modal de cotización.
   - `src/pages/Tienda/Tienda.jsx`: Aislada estrictamente para renderizar solo artículos físicos (`tipo === 'Producto'`), con enlace cruzado informativo hacia `/servicios` sin mezclar listados.

---

### Fase 3: Autenticación Completa y Seguridad de Formularios

1. **Molécula `LoginForm` (`src/components/molecules/LoginForm/LoginForm.jsx`):**
   - Construida siguiendo explícitamente el ejemplo de *Estructura y Componentes.pptx.pdf* (pág. 10), integrando:
     - Campo RUT con auto-formateo en vivo y validación Módulo 11.
     - Campo Contraseña con **botón de ojo** para mostrar/ocultar caracteres.
     - Casilla **`Recordar usuario`** (`Checkbox` MUI) que persiste el RUT para futuros inicios de sesión.
     - Enlace **`¿Olvidaste tu contraseña?`**.
     - Alertas MUI para validación (`400`), credenciales inválidas (`401`), fallo de conexión y estado de carga.
2. **Recuperación de Contraseña (`src/pages/Login/Login.jsx`):**
   - Flujo interactivo completo para **`¿Olvidaste tu contraseña?`**: solicita RUT o correo electrónico registrado, valida existencia contra la capa de servicio, muestra estado de carga y despliega pantalla de confirmación con instrucciones de restablecimiento.
3. **Registro con Validación Exhaustiva (`src/pages/Register/Register.jsx`):**
   - Selector de tipo de cuenta (**Comprador**, **Vendedor de Productos**, **Proveedor de Servicios**), validación campo por campo, **botón de ojo** tanto en *Contraseña* como en *Confirmar Contraseña*, verificación de coincidencia y manejo del código **`409 Conflict`** si el RUT o correo ya existen.

---

### Fase 4: Experiencia Avanzada de Compra, Venta, Cotizaciones y Checkout

1. **Inicio Conectado (`src/pages/Home/Home.jsx`):**
   - Buscador superior funcional con selector de destino (**Productos en Tienda** vs. **Servicios**) que redirige con query params (`?q=...`).
   - Corrección de las imágenes invertidas en categorías (*Ropa* vs. *Zapatos*) y navegación directa filtrada (`/tienda?categoria=...`).
   - Bloques separados para **Productos Destacados** y **Servicios Profesionales Verificados**.
2. **Filtros Completos en Tienda (`src/pages/Tienda/Tienda.jsx`):**
   - Implementación real de todos los filtros laterales (anteriormente varios sin estado): **Búsqueda por texto**, **Categoría**, **Rango de Precio (`Slider` MUI)**, **Marca**, **Género**, **Talla**, **Solo Despacho Gratis (`Switch` MUI)**, **Ordenamiento** (*Relevancia*, *Menor precio*, *Mayor precio*, *Mejor evaluados*) y contador de filtros activos con limpieza en un clic.
3. **Ficha de Detalle y Cotizaciones (`src/pages/ProductDetail/ProductDetail.jsx` y `QuoteModal.jsx`):**
   - Galería con miniaturas interactivas, selector de talla y cantidad validado contra `stock`, botón de **Favoritos**, envío y publicación de **Reseñas con calificación (`Rating` MUI)** y productos/servicios relacionados del mismo tipo.
   - Si el ítem es un **Servicio** (`/servicio/:id`), adapta la interfaz mostrando cobertura, modalidad, duración y habilitando tanto **Solicitud de Cotización (`QuoteModal`)** como reserva directa.
4. **Carrito y Checkout Reparados (`CartContext.jsx`, `Cart.jsx`, `Checkout.jsx`):**
   - Implementación de `clearCart()` en `CartContext.jsx`, eliminando el crash al confirmar pago en `Checkout.jsx`.
   - Cálculo unificado en todo el flujo: barra de progreso hacia **Despacho Gratis sobre `$50.000`** (`$4.990` bajo el umbral; `$0` para servicios digitales/remotos) y motor de **cupones promocionales** (`VENTO10`, `BIENVENIDO`, `VENTO20`).
   - Registro automático de cada compra confirmada en el historial de **Mis Pedidos** con código único de orden y descuento de stock.
5. **Portales Separados de Gestión y Ofertas Reales (`AdminProductos.jsx`):**
   - `/admin/productos` (`mode="productos"`): Publicación, edición, control de stock y creación de ofertas exclusivamente sobre productos físicos.
   - `/admin/servicios` (`mode="servicios"`): Publicación, edición y promociones exclusivamente sobre servicios profesionales (con campos de modalidad, duración, cobertura y garantía).
   - **Carga de imágenes reales** desde el dispositivo mediante `FileReader` (con previsualización instantánea y validación de tamaño) o mediante URL externa.
   - **Reparación de `Crear Oferta`:** Ahora selecciona un producto/servicio existente y aplica el porcentaje real calculando `precioOriginal`, `discount` y nuevo `price` numérico (eliminando el bug anterior que creaba tarjetas vacías con `$NaN`).
6. **Perfil Dinámico (`src/pages/Perfil/Perfil.jsx`):**
   - Edición real de datos personales con persistencia, pestaña **Mis Pedidos** conectada a órdenes reales de Checkout, pestaña **Mis Cotizaciones de Servicios** y pestaña **Lista de Deseos (Favoritos)**.

---

### Fase 5: Capa API REST (`VITE_API_URL`), 4 Estados UI y Verificación de Producción

1. **Cliente y Servicio API (`src/services/api.js`):**
   - Lee `import.meta.env.VITE_API_URL`. Cuando está configurada, ejecuta peticiones `fetch()` reales verificando `if (!respuesta.ok)` dentro de bloques `try/catch`.
   - Cuando se ejecuta sin backend externo configurado, opera sobre una capa persistente en `localStorage` que respeta exactamente el mismo contrato JSON estandarizado (`{ success, message, data, errors, status }`) y códigos HTTP (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `409 Conflict`).
2. **Los 4 Estados de Interfaz con Material UI:**
   - Implementados en formularios críticos (`LoginForm`, `Login`, `Register`, `Contacto`, `QuoteModal`, `Checkout`):
     1. **Cargando:** `CircularProgress` y deshabilitación preventiva de botones durante peticiones asíncronas.
     2. **Éxito:** `Alert severity="success"` y confirmaciones visuales con código de seguimiento/orden.
     3. **Error de validación (`400` / `401` / `409`):** `Alert severity="error"` detallando mensajes específicos y `helperText` por campo.
     4. **Fallo de conexión:** `Alert severity="warning"` ante errores de red capturados en `catch`.

---

## 3. Matriz de Verificación de Cumplimiento

### 3.1 Requerimientos Funcionales del Usuario

| Requerimiento | Estado | Implementación / Archivos Clave |
| :--- | :---: | :--- |
| Sección **SERVICIOS** obligatoria en la barra superior | Cumplido | `src/components/organisms/Navbar/Navbar.jsx` (enlace público `/servicios` en desktop y móvil) |
| Ventas y oferta de servicios en páginas separadas (nunca mezcladas) | Cumplido | `/tienda` (`Tienda.jsx`) solo `Producto` vs. `/servicios` (`Servicios.jsx`) solo `Servicio`; `/admin/productos` vs. `/admin/servicios` |
| Ícono de **ojo** para ver/ocultar caracteres de contraseña | Cumplido | `src/components/atoms/TextField/CustomTextField.jsx` integrado en `LoginForm.jsx` y `Register.jsx` |
| Opción **"¿Olvidaste tu contraseña?"** funcional | Cumplido | `src/components/molecules/LoginForm/LoginForm.jsx` + vista de recuperación en `src/pages/Login/Login.jsx` |
| Reparación de flujo de compra, carrito, checkout y ofertas | Cumplido | `CartContext.jsx` (`clearCart`, cupones, envío), `Checkout.jsx`, `AdminProductos.jsx` |

### 3.2 Requerimientos Académicos (`pdfs/`)

| Documento PDF de Referencia | Requerimiento Técnico | Estado | Evidencia en el Código |
| :--- | :--- | :---: | :--- |
| `[TWM] Semana 1–4` | HTML5 semántico W3C (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`) y `lang="es"` | Cumplido | `index.html`, `App.jsx`, `Navbar.jsx`, `Footer.jsx`, `Tienda.jsx`, `Servicios.jsx` |
| `[TWM] Semana 2` | Accesibilidad WCAG (`aria-label`, `alt` descriptivos, navegación por teclado y contraste) | Cumplido | `CustomTextField.jsx`, `Navbar.jsx`, `ProductCard.jsx`, `ServiceCard.jsx` |
| `Estructura y Componentes.pptx.pdf` | Atomic Design (`atoms`, `molecules`, `organisms`, `pages`) y molécula `LoginForm` con `Checkbox` *"Recordar usuario"* | Cumplido | `src/components/atoms/*`, `src/components/molecules/LoginForm/LoginForm.jsx` |
| `Guia REACT y MUI.pdf` | Configuración de alias `@/` en `vite.config.js` e integración coherente de `ThemeProvider` MUI + Tailwind | Cumplido | `vite.config.js`, `src/theme.js`, `src/main.jsx` |
| `Contenido backend-1.pdf` | Uso de `import.meta.env.VITE_API_URL`, `.env` en `.gitignore`, verificación `respuesta.ok`, `try/catch`, contrato `{ success, message, data, errors }` y 4 estados UI | Cumplido | `.gitignore`, `.env.example`, `src/services/api.js`, `Contacto.jsx`, `LoginForm.jsx`, `Register.jsx` |

---

## 4. Estructura del Proyecto (Atomic Design)

```text
d:\wym
├── .env.example
├── .gitignore
├── index.html
├── vite.config.js
├── DESARROLLO_IMPLEMENTADO.md
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── theme.js
    ├── components/
    │   ├── atoms/
    │   │   ├── Button/CustomButton.jsx
    │   │   ├── Logo/Logo.jsx
    │   │   ├── NavLinkItem/NavLinkItem.jsx
    │   │   ├── ProtectedRoute/ProtectedRoute.jsx
    │   │   └── TextField/CustomTextField.jsx
    │   ├── molecules/
    │   │   ├── LoginForm/LoginForm.jsx
    │   │   ├── ProductCard/ProductCard.jsx
    │   │   ├── QuoteModal/QuoteModal.jsx
    │   │   └── ServiceCard/ServiceCard.jsx
    │   └── organisms/
    │       ├── Footer/Footer.jsx
    │       └── Navbar/Navbar.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── CartContext.jsx
    │   ├── ProductContext.jsx
    │   └── ToastContext.jsx
    ├── data/
    │   ├── products.js
    │   └── services.js
    ├── pages/
    │   ├── AdminProductos/AdminProductos.jsx
    │   ├── AdminUsuarios/AdminUsuarios.jsx
    │   ├── Cart/Cart.jsx
    │   ├── Checkout/Checkout.jsx
    │   ├── Contacto/Contacto.jsx
    │   ├── Home/Home.jsx
    │   ├── Login/Login.jsx
    │   ├── Perfil/Perfil.jsx
    │   ├── ProductDetail/ProductDetail.jsx
    │   ├── Register/Register.jsx
    │   ├── Servicios/Servicios.jsx
    │   └── Tienda/Tienda.jsx
    ├── services/
    │   └── api.js
    └── utils/
        └── validators.js
```

---

## 5. Guía de Ejecución y Datos de Prueba

### Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

### Cuentas de Prueba Pre-cargadas

| Rol | RUT | Contraseña | Correo | Permisos Principales |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `12.345.678-5` | `admin1234` | `admin@vento.cl` | Acceso total + Panel `Config` (`/admin/usuarios`), Ventas y Servicios |
| **Vendedor / Proveedor** | `11.111.111-1` | `vento1234` | `javier@vento.cl` | Publicar/editar en `/admin/productos` y `/admin/servicios`, crear ofertas |

*(También es posible registrar cualquier usuario nuevo desde el botón **Registrarse**, validando RUT chileno real con Módulo 11).*

### Cupones de Descuento y Reglas de Despacho

- **`VENTO10`**: `10%` de descuento sobre el subtotal del carrito.
- **`BIENVENIDO`**: `15%` de descuento primera compra.
- **`VENTO20`**: `20%` de descuento promocional especial.
- **Despacho Gratis**: Se activa automáticamente en compras con subtotal igual o superior a **`$50.000 CLP`** (o cuando el carrito solo contiene servicios remotos/online).

---

## 6. Contrato REST Preparado para Backend (`.NET + PostgreSQL`)

Al definir `VITE_API_URL=http://localhost:5000/api` en un archivo `.env`, `src/services/api.js` redirige automáticamente las operaciones a los siguientes endpoints esperando el envoltorio estándar `{ success, message, data, errors }`:

- `POST /api/auth/login` (`200 OK` / `400 Bad Request` / `401 Unauthorized`)
- `POST /api/auth/register` (`201 Created` / `400 Bad Request` / `409 Conflict`)
- `POST /api/auth/recover-password` (`200 OK` / `404 Not Found`)
- `GET /api/products` y `POST /api/products`
- `GET /api/services` y `POST /api/services`
- `POST /api/quotes` (`201 Created` — solicitudes de cotización de servicios)
- `POST /api/contact` (`201 Created` — formulario de contacto y soporte)
