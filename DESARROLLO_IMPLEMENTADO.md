# Documentación Técnica de Desarrollo Implementado — Vento Marketplace (WYM)

Este documento detalla la arquitectura e implementación integral realizada sobre **Vento Marketplace (`WebYMobiles`)**, cubriendo la base E-Commerce/Servicios y las **Fases F0 a F5** del sistema multi-perfil (**RBAC de 4 roles + Moderación Previa Estricta + Flujos Bidireccionales**), verificadas contra los lineamientos académicos de *Tecnologías Web y Móviles*.

---

## 1. Resumen Ejecutivo de la Plataforma

1. **Separación Estricta entre Venta de Productos y Oferta de Servicios:**
   - Barra superior (`Navbar`) con acceso público y permanente a **`TIENDA`** (`/tienda`) y **`SERVICIOS`** (`/servicios`).
   - En ninguna vista pública ni panel de gestión se mezclan artículos físicos (`Producto`) con prestaciones profesionales (`Servicio`).
   - Portales independientes por rol: `/admin/productos` + `/tienda/vendedor/:id` para vendedores de productos, y `/admin/servicios` + `/servicios/proveedor/:id` para proveedores de servicios.

2. **Arquitectura RBAC de 4 Perfiles con Propiedad de Datos (`ownerId` / `compradorId`):**
   - **`Admin` (Administrador General):** Gobierno total de la plataforma, colas de aprobación previa de cuentas comerciales y publicaciones, gestión de usuarios (incluyendo suspensión con bloqueo `403 Forbidden`), destacados en portada, motor dinámico de cupones y bandeja de tickets de soporte.
   - **`VendedorProducto` (Vendedor de Productos):** Dashboard de ventas y alertas de stock crítico (`≤ 3`), inventario propio aislado por `ownerId`, creación de ofertas reales, bandeja logística de despachos (*Confirmado* → *En Preparación* → *Enviado* con courier y código de seguimiento → *Entregado*) y tienda pública verificable. Conserva capacidad de compra.
   - **`ProveedorServicio` (Proveedor de Servicios):** Dashboard de proyectos, portafolio propio aislado por `ownerId`, CRM interactivo de cotizaciones (envío de **Propuesta Formal** con monto CLP, plazo, vigencia y alcance; avance a *En Ejecución* y *Completado*) y perfil profesional público con credenciales. Conserva capacidad de compra.
   - **`Comprador` (Usuario Comprador):** Libreta de direcciones chilenas (Región/Comuna) integrada en un clic con Checkout, cambio de contraseña con verificación de clave actual y botón de ojo, seguimiento visual de pedidos con `Stepper` MUI y boleta imprimible, aceptación/pago o rechazo de propuestas de servicio, reseñas con sello *"Compra Verificada"* / *"Servicio Verificado"* y formulario de postulación a rol comercial.

3. **Regla de Moderación Previa Estricta:**
   - Las cuentas nuevas o postulaciones a `VendedorProducto` / `ProveedorServicio` nacen en estado `Pendiente` hasta que el `Admin` las aprueba (pudiendo otorgar insignia *"Verificado"* o rechazar con observación).
   - Toda publicación nueva creada por un vendedor o proveedor entra como `Pendiente` (invisible en `/tienda` y `/servicios` hasta su aprobación).
   - Si un vendedor/proveedor edita campos comerciales públicos (título, precio, imagen, descripción, categoría, marca o modalidad), la publicación vuelve automáticamente a `Pendiente`. Los ajustes de stock o pausar/reactivar son inmediatos sin requerir re-aprobación.

---

## 2. Detalle Técnico por Fases Implementadas (F0 a F5)

### Fase F0: Núcleo RBAC, Propiedad de Datos y Moderación Base
- **`frontend/src/utils/roles.js`:** Definición centralizada de `ROLES`, `ACCOUNT_STATUS`, `APPROVAL_STATUS`, `MODERATION_STATUS`, `normalizeUserRoles()`, `canAccessProductPanel()`, `canAccessServicePanel()` y `didCommercialContentChange()`.
- **`frontend/src/components/atoms/ProtectedRoute/ProtectedRoute.jsx`:** Guardián RBAC que recibe `allowedRoles` y despliega una vista semántica **HTTP 403 Acceso Restringido** cuando el rol no posee permisos.
- **`frontend/src/services/api.js`:** Cliente HTTP preparado para `import.meta.env.VITE_API_URL` con validación `respuesta.ok`, `try/catch` y respaldo local persistente (`_v2`) con validación de RUT Módulo 11, bloqueo de login fantasma (`401`), bloqueo de suspendidos (`403`), prevención de auto-asignación de `Admin` (`403`) y control de duplicados (`409`).

### Fase F1: Perfil Usuario Comprador (`Comprador`)
- **`frontend/src/utils/chileGeo.js`:** División político-administrativa de Chile (Regiones y Comunas) compartida entre Perfil y Checkout.
- **`frontend/src/pages/Perfil/Perfil.jsx`:**
  - **Libreta de Direcciones:** Creación, eliminación y marcación de dirección predeterminada sincronizada con `Checkout.jsx`.
  - **Seguridad:** Cambio de contraseña validando clave actual con alternancia de visibilidad (`Eye` / `EyeOff`).
  - **Mis Pedidos con `Stepper` MUI:** Visualización de etapas logísticas (*Confirmado* → *En Preparación* → *Enviado* con courier y código de tracking → *Entregado*) y emisión de boleta electrónica imprimible.
  - **Cotizaciones Interactivas:** Recepción de propuestas formales con botones **"Aceptar y Pagar"** (carga el servicio acordado al carrito y redirige a `/checkout`, pasando a *En Ejecución* tras el pago) y **"Rechazar Propuesta"**.
  - **Postulación Comercial:** Formulario para solicitar habilitación como `VendedorProducto`, `ProveedorServicio` o `Ambos`, entrando directo a la cola del Administrador.
- **`frontend/src/pages/ProductDetail/ProductDetail.jsx`:** Detección automática de transacciones reales del usuario para otorgar el sello **"Compra Verificada"** o **"Servicio Verificado"** en sus valoraciones.

### Fase F2: Perfil Vendedor de Productos (`VendedorProducto`)
- **`frontend/src/pages/AdminProductos/AdminProductos.jsx` (`mode="productos"`):**
  - Tarjetas KPI en tiempo real: *Ingresos Acumulados*, *Despachos Activos*, *Productos Publicados* y *Stock Crítico (`≤ 3` unidades)*.
  - Pestaña **Bandeja de Pedidos y Despachos** con modal para asignar empresa de transporte (*Starken*, *Chilexpress*, *Bluexpress*, *Correos de Chile*) y código de seguimiento, reflejado instantáneamente en el `Stepper` del comprador.
- **`frontend/src/pages/PerfilVendedor/PerfilVendedor.jsx` (`/tienda/vendedor/:id`):** Escaparate público exclusivo de productos aprobados de la tienda, reputación promedio, filtro por categorías e insignia *"Tienda Verificada"*.

### Fase F3: Perfil Proveedor de Servicios (`ProveedorServicio`)
- **`frontend/src/pages/AdminProductos/AdminProductos.jsx` (`mode="servicios"`):**
  - Tarjetas KPI profesionales: *Por Cotizar*, *En Ejecución*, *Facturación Cotizada* y *Portafolio Activo*.
  - **CRM de Cotizaciones y Proyectos:** Filtros por estado, modal de **Propuesta Formal** (`monto` CLP, `plazo`, `validez` y `detalle` técnico) y botones para avanzar servicios pagados desde *En Ejecución* hasta *Completado*.
- **`frontend/src/pages/PerfilProveedor/PerfilProveedor.jsx` (`/servicios/proveedor/:id`):** Perfil profesional público con especialidad, años de experiencia, certificaciones acreditadas y portafolio exclusivo de `ServiceCard`.

### Fase F4: Centro de Gobierno Administrador (`Admin`)
- **`frontend/src/pages/AdminUsuarios/AdminUsuarios.jsx`:** Reescritura integral como consola ejecutiva en 6 módulos:
  1. **Aprobación de Cuentas Comerciales:** Aprobar con sello *"Verificado"*, aprobar estándar o rechazar con motivo obligatorio.
  2. **Moderación y Destacados de Catálogo:** Colas separadas para Productos y Servicios pendientes, rechazo con observación al autor y botón **Destacar** conectado con la portada (`Home.jsx`).
  3. **Usuarios y Roles (CRUD Unificado):** Búsqueda por RUT/correo/tienda, creación de cuentas/administradores, edición de roles, insignia de verificación y suspensión de acceso (`403`).
  4. **Motor Dinámico de Cupones:** Creación, pausa/activación y eliminación de códigos promocionales conectados en vivo al Carrito y Checkout.
  5. **Bandeja de Soporte:** Gestión y respuesta de tickets generados desde `Contacto.jsx` (`TCK-XXXX`).
  6. **Datos Corporativos:** Configuración de RUT legal, razón social, sitio web y logo corporativo.

### Fase F5: Documentación y Reestructuración Simétrica `/frontend` + `/backend`
- Reorganización limpia mediante `git mv` preservando historial hacia `/frontend` y `/backend`, dejando la raíz preparada para la API en **ASP.NET Core + Entity Framework Core + PostgreSQL**.

---

## 3. Matriz de Verificación Académica y Funcional

| Estándar / Requerimiento | Estado | Implementación Verificada |
| :--- | :---: | :--- |
| Barra superior con sección **SERVICIOS** separada de **TIENDA** | Cumplido | `Navbar.jsx`, `/tienda` vs. `/servicios`, `/admin/productos` vs. `/admin/servicios` |
| Visibilidad de contraseña (ojo) y recuperación de clave | Cumplido | `CustomTextField.jsx`, `LoginForm.jsx`, `Login.jsx`, `Register.jsx`, `Perfil.jsx` |
| 4 Perfiles RBAC con propiedad de datos y moderación estricta | Cumplido | `roles.js`, `ProtectedRoute.jsx`, `AuthContext.jsx`, `ProductContext.jsx`, `CartContext.jsx` |
| HTML5 Semántico W3C (`lang="es"`) y Accesibilidad WCAG | Cumplido | `index.html`, `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `aria-label` |
| Atomic Design + Alias `@/` + Tema MUI coherente | Cumplido | `frontend/vite.config.js`, `frontend/jsconfig.json`, `atoms/`, `molecules/`, `organisms/`, `pages/` |
| `VITE_API_URL`, `respuesta.ok`, `try/catch` y `{ success, message, data, errors }` | Cumplido | `frontend/.env.example`, `.gitignore`, `frontend/src/services/api.js` |
| Estructura simétrica `/frontend` y `/backend` | Cumplido | `frontend/` (SPA React compilada sin errores) + `backend/` (guía `Vento.Api`) |

---

## 4. Árbol Actualizado del Proyecto

```text
WebYMobiles/
├── .gitignore
├── README.md
├── MINUTA.md
├── DESARROLLO_IMPLEMENTADO.md
├── backend/
│   └── README.md
└── frontend/
    ├── .env.example
    ├── index.html
    ├── jsconfig.json
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
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
        │   ├── PerfilProveedor/PerfilProveedor.jsx
        │   ├── PerfilVendedor/PerfilVendedor.jsx
        │   ├── ProductDetail/ProductDetail.jsx
        │   ├── Register/Register.jsx
        │   ├── Servicios/Servicios.jsx
        │   └── Tienda/Tienda.jsx
        ├── services/
        │   └── api.js
        └── utils/
            ├── chileGeo.js
            ├── roles.js
            └── validators.js
```

---

## 5. Cuentas Semilla y Datos de Prueba

| Rol | RUT | Contraseña | Tienda / Estudio | Estado Inicial |
| :--- | :--- | :--- | :--- | :--- |
| `Admin` | `12.345.678-5` | `admin1234` | Vento Oficial Store | Aprobado y Verificado |
| `VendedorProducto` | `11.111.111-1` | `vento1234` | SneakerDrop CL | Aprobado y Verificado |
| `ProveedorServicio` | `22.222.222-2` | `servicio1234` | SneakerCare & Custom Studio | Aprobado y Verificado |
| `Comprador` | `15.555.555-6` | `compra1234` | — (Cliente con pedidos y cotizaciones) | Activo |
| `VendedorProducto` | `18.888.888-7` | `pendiente1234` | UrbanThreads Sur | **Pendiente de Aprobación Admin** |

- **Cupones iniciales activos:** `VENTO10` (`10%`), `BIENVENIDO` (`15%`), `VENTO20` (`20%`) — administrables en vivo desde el Centro de Gobierno.
- **Publicaciones semilla en cola de moderación (`Pendiente`):** Producto `id: 8` (*Chaqueta Cortaviento*) y Servicio `id: 107` (*Autenticación Legit Check*), listos para ser aprobados o rechazados por el Administrador.
