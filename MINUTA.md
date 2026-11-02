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
