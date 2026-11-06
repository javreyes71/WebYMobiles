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

---

## 6. Arquitectura e Implementación Backend (`Fases B1 a B6` · .NET 8 + PostgreSQL `BD2`)

### Fase B1: Base `.NET 8`, Seguridad de Secretos y Alineación `BD2`
- **Solución:** `backend/Vento.sln` + `backend/Vento.Api/Vento.Api.csproj` (`net8.0`, `Npgsql.EntityFrameworkCore.PostgreSQL 8.0.11`, `Microsoft.AspNetCore.Authentication.JwtBearer 8.0.11`, `BCrypt.Net-Next 4.0.3`).
- **Suite SQL (`backend/database/`):**
  - `00_setup_usuario_bd.sql`: Rol dedicado `vento_app` con privilegios mínimos (cumpliendo Diapositiva 21 de `Contenido backend-1.pdf`, nunca `postgres`).
  - `01_bd2_tablas_restricciones_indices.sql`: Las **49 tablas**, **9 `CHECK` constraints** y **25 índices** de *Base de Datos Avanzadas* (`BD2`).
  - `02_bd2_triggers.sql` y `03_bd2_funciones_y_vistas.sql`: Los **23 triggers PL/pgSQL**, funciones y las **4 vistas analíticas** de `BD2`.
  - `04_extension_vento_rbac.sql` y `05_seed_vento_demo.sql`: Extensión no destructiva (`ADD COLUMN IF NOT EXISTS`) y semilla con IDs `>= 5001` compatible sin colisión con los `1..1000` registros de `insertsll.txt`.
- **Middleware y Contrato JSON:** `ApiResponse<T>` y `ExceptionHandlingMiddleware` garantizan `{ success, message, data, errors }` en toda respuesta HTTP (incluyendo errores `P0001`, `23505` y `23514` lanzados por triggers de PostgreSQL `BD2`).

### Fase B2: Autenticación JWT, Hash `BCrypt` y Usuarios RBAC
- **`AuthController` y `UsuariosController`:** Login con migración transparente de claves históricas de `BD2` a `BCrypt`, registro con bloqueo `403` ante auto-asignación de `Admin` (Diapositiva 34), doble validación en servidor de RUT Módulo 11 (`RutValidator.cs`) antes de PostgreSQL (`400`), perfil público `/api/usuarios/{id}/publico`, libreta de direcciones, postulación comercial, aprobación/suspensión administrativa y `204 No Content` en `DELETE`.

### Fase B3: Catálogo Separado (`/api/productos` y `/api/servicios`) y Moderación
- **`ProductosController`, `ServiciosController` y `AdminCatalogoController`:** Separación estricta de dominios, control de propiedad `ownerRun` (`403`), verificación de cuenta comercial aprobada (`403`), regla inteligente de edición (cambios comerciales regresan a `Pendiente`; ajustes de `stock` o pausa son inmediatos sincronizando la tabla `stock` de `BD2`) y cola administrativa `/api/admin/catalogo/pendientes`.

### Fase B4: Operaciones Transaccionales `BD2` y Analítica
- **`OrdenesController`:** Transacciones ACID sobre `venta` (`total_iva = precio_sin_iva * 0.19` cumpliendo `chk_venta_iva_valido`), `compra`, `medio_pago`, `despacho` (`chk_despacho_estado_valido`: `'En Preparación'`, `'Despachado'`, `'En reparto'`, `'Entregado'`), `empresa_transporte_despacho` y descuento atómico de inventario en `stock`.
- **`CotizacionesController`, `CuponesController`, `ResenasController`, `ContactoYSoporteController` y `AnaliticaBd2Controller`:** Flujo completo sobre `cotizacion`/`solicita`, reseñas sobre `reseña`/`reseñar`/`critica`, tickets de soporte y exposición de las vistas `vista_inventario_critico`, `alerta_inventario`, `vista_factura_cliente`, `vista_rendimiento_emprendedor` y `vista_catalogo_unificado`.

### Fase B5: Colección Oficial Postman (`backend/postman/`)
- **`Vento_Marketplace.postman_collection.json` y `Vento_Local_Raspberry.postman_environment.json`:** **9 carpetas** y **63 peticiones** con variable `{{baseUrl}}`, captura automática de tokens JWT por rol y scripts `pm.test` verificando casos positivos (`200`, `201`, `204`) y al menos 2 casos negativos por recurso (`400`, `401`, `403`, `404`, `409`).

### Fase B6: Integración React (`VITE_API_URL` + JWT) y Despliegue Raspberry Pi
- **Integración Frontend:** `apiFetch()` inyecta `Authorization: Bearer <JWT>`, sincroniza catálogo, usuarios, órdenes, despachos, cotizaciones y reseñas contra `Vento.Api` cuando `VITE_API_URL` está definida, y alinea el `Stepper` de `Perfil.jsx` y `AdminProductos.jsx` con los estados logísticos de `BD2`.
- **Despliegue ARM64 (`backend/deploy/`):** Servicio `vento-api.service` (`0.0.0.0:5000`) y script `deploy_raspberry.sh` con publicación `linux-arm64` y variables de entorno externas seguras (`/etc/vento-api/vento.env`).

---

## 7. Fase F6: Refinamiento Integral de Frontend y Catálogo Oficial Completo

### 1. Identidad Visual y Branding en el Navegador
- **Favicon y Logo Oficial:** Configurado `vento-logo.png` y `favicon.ico` en `frontend/public/` e indexado en `index.html` con `<link rel="icon">`, `apple-touch-icon` y `shortcut icon`. El isotipo y tipografía bold de Vento se exhiben en la pestaña del navegador y en la cabecera `Navbar`.

### 2. Taxonomía Oficial Exacta del Curso y Poblamiento Completo (153 Ítems)
- **Centralización Jerárquica (`frontend/src/data/categories.js`):** Estructura que modela formalmente las 10 categorías de productos y 7 de servicios requeridas en el enunciado.
- **90 Productos (Exactamente 9 ítems por categoría):**
  - **2.1 Tecnología:** Notebook ASUS ZenBook 14 OLED, Monitor Gamer Samsung Odyssey G5, Audífonos Sony WH-1000XM5, Parlante JBL Charge 5, PS5 Slim, Control Xbox Series, Smart TV LG 55", Chromecast 4K, SSD Kingston 1TB.
  - **2.2 Celulares:** iPhone 15, Samsung Galaxy S24 Ultra, Xiaomi Redmi Note 13 Pro+, Motorola Edge 50 Pro, Carcasa Spigen MagFit, Cargador Anker GaN 65W, Galaxy Watch6, Apple Watch SE, Batería MagGo 10.000mAh.
  - **2.3 Hogar y Cocina:** Cafetera Espresso DeLonghi Dedica, Freidora de Aire Philips Dual Basket XXL, Robot Xiaomi Vacuum E10, Batería Tefal Titanium 7 Pzas, Cuchillo Santoku Damasco 8", Lámpara Nórdica Trípode, Estante Modular Fierro/Pino, Frascos de Vidrio Bambú, Sábanas Algodón Egipcio 300 Hilos.
  - **2.4 Alimentación:** Café Especialidad Etiopía Yirgacheffe 500g, Pack Té en Hebras Selección Botánica, Mix Frutos Secos con Miel de Ulmo, Granola Artesanal Avena/Cacao, Aceite de Oliva Arbequina Huasco, Pasta Ají Cacho de Cabra, Bombones de Autor y Trufas Belgas, Barras de Chocolate 85% Bean-to-Bar, Kombucha Orgánica Arándano/Jengibre.
  - **2.5 Accesorios para vehículos:** Radio Pantalla 9" CarPlay/Android Auto, Barras de Techo Aluminio, Dashcam 4K Dual GPS/WiFi, Cojín Lumbar Memory Foam, Kit Detailing Cerámico, Compresor Portátil 150 PSI, Parlantes Coaxiales 6.5", Arrancador Jump Starter 12.000mAh, Organizador Colgante de Maleta.
  - **2.6 Libros e instrumentos musicales:** Fender Squier Stratocaster Sonic, Bajo Ibanez GSR200 4 Cuerdas, Teclado MIDI Novation Launchkey, Pedal Boss DS-1 Distortion, Interfaz Focusrite Scarlett 2i2, Novela "Cien Años de Soledad", Libro "Sapiens", Libro "Sneakers Collectors Guide", Libro "Diseño de Sistemas y Arquitectura Limpia".
  - **2.7 Ropa, moda y calzado:** Nike Air More Uptempo '96 *(HD local)*, Court Vision Low *(HD local)*, Nike Air Force 1 '07 *(HD local)*, Air Jordan 4 Retro OG SP *(HD local)*, Botines Cuero Nobuck Vento, Polerón Oversize Heavyweight 420g, Chaqueta Cortaviento Reflective 3M, Pantalón Cargo Tactical Ripstop, Polera Boxy Fit Algodón Peinado.
  - **2.8 Juguetes y Niños:** Juego Catan Oficial, Juego Dixit Clásico, LEGO Star Wars X-Wing, LEGO Architecture Tokio, Funko Pop! Dragon Ball Goku, Cilindro Montessori Madera, Bloques Magnéticos 3D 60 Pzas, Scooter Plegable LED, Bicicleta de Equilibrio 12".
  - **2.9 Útiles y librería:** Bullet Journal Leuchtturm1917 A5, Marcadores Tombow Dual Brush x10, Tiralíneas Sakura Pigma Micron x6, Pluma Lamy Safari Carbón Matte, Cintas Washi Tape Japonesas, Mochila Antirrobo 15.6", Estuche Standing Canvas, Desk Mat Cuero Sintético 80x40cm, Organizador Giratorio Madera 360°.
  - **2.10 Otros:** Carpa Camping 4 Personas 3000mm, Saco de Dormir Confort 0°C Ripstop, Cocinilla a Gas Camping, Cortadora de Pelo Fade Master, Kit Afeitado Tradicional Maquinilla/Brocha, Arnés Antitirones Julius-K9, Bebedero Fuente Automática 2L, Bandas de Resistencia 11 Pzas, Taladro Percutor 20V con Maletín.
- **63 Servicios (Exactamente 9 ítems por categoría):**
  - **1.1 Computación y Tecnología:** Mantención PC/Notebook, Reparación Hardware Laptop, WiFi Mesh Pymes, Auditoría Ciberseguridad, Servidores Linux & Cloud, Recuperación Forense de Datos, Armado PC Gamer, Cámaras Seguridad IP WiFi, Desinfección Ransomware.
  - **1.2 Servicios domésticos:** Aseo Profundo Departamentos, Limpieza Alfombras/Tapices Inyección-Extracción, Jardinería/Poda Cerco, Paisajismo y Riego Goteo, Deshollinado Estufas Pellet/Leña, Gasfitería/Fugas de Agua, Cuidado Adulto Mayor, Babysitter Certificada, Pintor Interiores.
  - **1.3 Servicios profesionales:** Tiendas Online Shopify/WooCommerce, Asesoría Legal/Contratos, Declaración Renta F22/F29 SII, Regularización Ley del Mono, Terapia Psicológica Ansiedad, Telemedicina General, Evaluación Dental Profilaxis, Kinesiología Motora Domicilio, Clases Particulares Matemáticas/Física, Atención Veterinaria Domicilio, Traducción Certificada Español-Inglés.
  - **1.4 Vehículos:** Scanner Diagnóstico OBD2, Cambio de Aceite Sintético/Filtros, Desabolladura Varillero DSP, Pintura al Horno por Pieza, Inspección Pre-Compra Domicilio, Frenos/Rectificado Discos, Alineación 3D Láser/Balanceo, Pulido Focos UV, Láminas Seguridad Antiasalto 8 Micras.
  - **1.5 Confección de ropa y vestuario:** Ajuste Bastas/Entalle Trajes, Camisas y Blusas a Medida Algodón Pima, Delantales y Pecheras Gastronómicas, Uniformes Clínicos Scrubs, Vestidos de Gala a Pedido, Bordado Computarizado Logos, Estampado DTF Textil, Restauración/Teñido Cuero Vintage, Customización Artística Mezclilla.
  - **1.6 Banquetería, repostería y alimentación:** Banquetería Matrimonios, Coffee Break Corporativo, Tortas Temáticas Fondant, Caja Cóctel 50 Pastelitos, Almuerzos Saludables al Vacío, Tabla Quesos/Charcutería 6-8 Personas, Maestro Asador Parrillero Domicilio, Bar Móvil Coctelería de Autor, Desayunos Sorpresa Gourmet.
  - **1.7 Otros:** Fotografía Profesional Retrato/Moda, Grabación Dron 4K Inmobiliario, Animación Infantil Magia/Títeres, Cerrajería Móvil 24/7, Fletes y Mudanzas Locales, Interpretación Simultánea Conferencias, Cobertura Audiovisual Matrimonios, Cerraduras Digitales Biométricas, Embalaje Profesional Mudanzas.

### 3. Correspondencia Fotográfica Fiel 1:1
- Cada ítem cuenta con una fotografía real específica asociada mediante [frontend/src/data/products.js](file:///d:/wym/frontend/src/data/products.js) y [frontend/src/data/services.js](file:///d:/wym/frontend/src/data/services.js), garantizando que lo que se describe en el texto coincida de forma exacta con la imagen presentada.
- Componentes [`ProductCard.jsx`](file:///d:/wym/frontend/src/components/molecules/ProductCard/ProductCard.jsx), [`ServiceCard.jsx`](file:///d:/wym/frontend/src/components/molecules/ServiceCard/ServiceCard.jsx) y [`ProductDetail.jsx`](file:///d:/wym/frontend/src/pages/ProductDetail/ProductDetail.jsx) incorporan manejador `onError` para respaldo gráfico automático contra cortes de red.

### 4. Experiencia de Usuario y Accesibilidad
- **Tipografía Uniforme:** Botones en mayúsculas (`uppercase tracking-wider font-bold`) y jerarquía de títulos normalizada.
- **Validación RUT Módulo 11:** Admite solo números y `k/K`, límite de 9 caracteres y auto-formateo con puntos y guion.
- **Alternancia Contraseña:** Botón de ojo funcional en todos los formularios de autenticación.
- **Cifrado en Frontend:** Implementación nativa de `crypto.subtle.digest('SHA-256')` evitando contraseñas en texto plano.
- **Navegación Fluida:** Barras rápidas con desplazamiento horizontal para las 10 categorías de productos y 7 de servicios; subcategorías filtradas contextualmente; indicador visual de pestaña activa en Navbar.
