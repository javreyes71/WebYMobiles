# Minuta de Reuniones - Equipo WebYMobiles

Este documento registra las sesiones de trabajo del equipo para el desarrollo de **Vento Marketplace**, en cumplimiento con la metodología y requerimientos de la asignatura *Tecnologías Web y Móviles*.

---

## Reunión 1: Planificación y Setup Inicial
**Fecha y Hora:** Lunes 28 de Septiembre de 2026, 09:00 hrs.  
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Revisión de la rúbrica de entrega y los diseños en Figma.
- Definición del stack tecnológico (React, Tailwind CSS).
- Necesidad de integrar Material UI (MUI) para cumplir con los componentes requeridos.

**Tareas Asignadas y Avances:**
- **Javier:** Inicializar repositorio y configurar dependencias de Material UI. (Completado)
- **María:** Diseñar el flujo base de las vistas. (Completado)
- **Pedro:** Revisar documentación de componentes MUI. (Completado)

---

## Reunión 2: Autenticación y Perfil de Usuario
**Fecha y Hora:** Miércoles 30 de Septiembre de 2026, 11:00 hrs.  
**Miembros Presentes:** Javier Reyes, María Silva. (Ausente justificado: Pedro Pascal).

**Temas Discutidos:**
- Implementación de los flujos de Login y Registro requeridos.
- Validación de RUT chileno y estructura de "Mi Perfil".

**Tareas Asignadas y Avances:**
- **María:** Maquetar y programar modales de Login y Registro. (Completado)
- **Javier:** Conectar sesión en el Navbar (Avatar y Menú desplegable) e integrar la vista de Perfil. (Completado)

---

## Reunión 3: Módulos CRUD y Separación Tienda vs. Servicios
**Fecha y Hora:** Sábado 3 de Octubre de 2026, 10:00 hrs.  
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Separación estricta entre la **Tienda de Productos Físicos** (`/tienda`) y el **Directorio de Servicios Profesionales** (`/servicios`).
- Incorporación del botón de visibilidad de contraseña (ojo), recuperación de clave y reparación integral de Carrito y Checkout.

**Tareas Asignadas y Avances:**
- **Pedro:** Desarrollar CRUD separado de Productos y Servicios con carga de imágenes reales y ofertas porcentuales/fijas. (Completado)
- **María:** Implementar `LoginForm` accesible, validación Módulo 11 y recuperación de contraseña. (Completado)
- **Javier:** Unificar cálculo de envío gratis sobre `$50.000`, cupones de descuento y `QuoteModal`. (Completado)

---

## Reunión 4: Diseño de Arquitectura RBAC de 4 Perfiles y Moderación Estricta
**Fecha y Hora:** Viernes 30 de Octubre de 2026, 19:30 hrs.  
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Auditoría completa frente a los 6 documentos académicos del curso (`W3C`, `WCAG`, `Atomic Design`, `Guía React y MUI`, `Contenido Backend`).
- Definición de los **4 perfiles diferenciados**: `Admin`, `VendedorProducto`, `ProveedorServicio` y `Comprador` (manteniendo capacidad de compra transversal).
- Acuerdo de **Moderación Previa Estricta**: toda cuenta comercial nueva y toda publicación nueva o editada en su contenido comercial pasa por estado `Pendiente` hasta ser aprobada por el `Admin` (cambios de stock o pausa son inmediatos).

**Acuerdos y Tareas:**
- **Javier:** Implementar núcleo `roles.js`, aislamiento por `ownerId` / `compradorId` y `ProtectedRoute` con respuesta HTTP `403`. (Completado)
- **María:** Diseñar flujos bidireccionales de cotización formal y despacho con tracking. (Completado)

---

## Reunión 5: Cierre de Fases Frontend (F1–F5) y Estructura Simétrica `/frontend` + `/backend`
**Fecha y Hora:** Lunes 2 de Noviembre de 2026, 12:30 hrs.  
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Implementación de mejoras por perfil:
  - **Comprador (`F1`):** Libreta de direcciones chilenas (Región/Comuna), cambio de contraseña seguro, seguimiento de pedidos con `Stepper` MUI + boleta imprimible, aceptación de cotizaciones hacia Checkout, postulación comercial y sello *"Compra Verificada"*.
  - **Vendedor de Productos (`F2`):** Dashboard KPI de ventas/stock crítico, bandeja logística con asignación de courier y código de seguimiento, y perfil público `/tienda/vendedor/:id`.
  - **Proveedor de Servicios (`F3`):** Dashboard profesional, CRM de cotizaciones con envío de propuesta formal en CLP, control de ejecución y perfil público `/servicios/proveedor/:id`.
  - **Administrador (`F4`):** Centro de Gobierno en `/admin/usuarios` con colas de aprobación de cuentas y publicaciones, destacados en portada, suspensión `403`, motor dinámico de cupones y bandeja de soporte conectada a `Contacto`.
- Reestructuración limpia con `git mv` en carpetas simétricas `/frontend` y `/backend` dejando el repositorio listo para iniciar la API en **ASP.NET Core + PostgreSQL + Postman + Raspberry Pi**.

---

## Reunión 6: Implementación Backend .NET 8, Alineación con Base de Datos Avanzadas (`BD2`), Postman y Raspberry Pi
**Fecha y Hora:** Lunes 2 de Noviembre de 2026, 14:00 hrs.  
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Integración total de los entregables del ramo *Base de Datos Avanzadas* (`BD2`): 49 tablas relacionales, 9 restricciones `CHECK` (`IVA 19%`, estados logísticos `'En Preparación'`, `'Despachado'`, `'En reparto'`, `'Entregado'`), 25 índices, 23 triggers PL/pgSQL y 4 vistas analíticas, extendidos de manera no destructiva (`04_extension_vento_rbac.sql`) para soportar los 4 roles RBAC y moderación previa estricta.
- Implementación de `Vento.Api` en `.NET 8.0 LTS` con `Npgsql.EntityFrameworkCore.PostgreSQL`, `BCrypt.Net-Next`, `JWT Bearer`, doble validación en C# (`RutValidator` Módulo 11 antes de PostgreSQL) y `ExceptionHandlingMiddleware` que traduce excepciones `P0001`/`23505`/`23514` de triggers de `BD2` al contrato `{ success, message, data, errors }`.
- Creación de colección oficial Postman (`63` pruebas automatizadas con `{{baseUrl}}`, positivos y negativos por recurso) y scripts de despliegue `linux-arm64` en Raspberry Pi (`0.0.0.0:5000` + CORS + `VITE_API_URL`).

**Acuerdos y Tareas:**
- **Javier:** Implementar `Vento.Api` (Fases B1–B4) y scripts SQL `00..05` alineados con `BD2`. (Completado)
- **María:** Construir colección Postman v2.1 (`Fase B5`) con auto-guardado de JWT y validaciones negativas. (Completado)
- **Pedro:** Integrar `VITE_API_URL` + JWT en `api.js`, alinear estados de despacho `BD2` en `Stepper` y documentar despliegue en Raspberry Pi (`Fase B6`). (Completado)
