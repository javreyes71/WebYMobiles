# Minuta de Reuniones - Equipo WebYMobiles

Este documento registra las sesiones de trabajo del equipo para el desarrollo del Marketplace Vento, en cumplimiento con los requerimientos de la asignatura Tecnologías Web y Móviles.

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
- **María:** Diseñar el flujo base de las vistas.
- **Pedro:** Revisar documentación de componentes MUI.

---

## Reunión 2: Autenticación y Perfil de Usuario
**Fecha y Hora:** Miércoles 30 de Septiembre de 2026, 11:00 hrs.
**Miembros Presentes:** Javier Reyes, María Silva. (Ausente justificado: Pedro Pascal).

**Temas Discutidos:**
- Implementación de los flujos de Login y Registro requeridos.
- Lógica de captura de datos y uso de `console.log()` para verificar envíos.
- Creación de la vista dinámica de "Mi Perfil".

**Tareas Asignadas y Avances:**
- **María:** Maquetar y programar modales de Login y Registro. (Completado)
- **Javier:** Conectar la simulación de sesión en el Navbar (Avatar y Menú desplegable) e integrar la vista de Perfil. (Completado)

---

## Reunión 3: Módulos CRUD y Finalización
**Fecha y Hora:** Sábado 3 de Octubre de 2026, 10:00 hrs.
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Definición de las dos entidades a administrar: Productos y Usuarios.
- Integración de componentes complejos de MUI (Tables, Modals, Forms).
- Corrección de bugs menores (alerta en carrito y link de Webpay).

**Tareas Asignadas y Avances:**
- **Pedro:** Desarrollar CRUD de Productos completo (Create, Read, Update, Delete). (Completado)
- **María:** Desarrollar CRUD de Usuarios y validaciones de contraseña/RUT. (Completado)
- **Javier:** Refactorizar código del Carrito y resolver alertas molestas. (Completado)

---

## Reunión 4: Revisión de Avances y Próximos Pasos (Roadmap)
**Fecha y Hora:** Domingo 4 de Octubre de 2026, 21:00 hrs.
**Miembros Presentes:** Javier Reyes, María Silva, Pedro Pascal.

**Temas Discutidos:**
- Revisión cruzada de todo el código vs Rúbrica.
- Discusión sobre cómo incorporar la teoría de las clases 1 y 2 en futuras entregas.

**Acuerdos y Próximos Pasos (Roadmap Propuesto):**
1. **Fase 1 (Accesibilidad y W3C):** Reemplazar `divs` genéricos por etiquetas semánticas (`<main>`, `<section>`, `<article>`) y agregar atributos `aria-labels` para lectores de pantalla.
2. **Fase 2 (Ergonomía):** Reemplazar los `alert()` nativos por `Snackbars` de MUI e incorporar *Spinners* de carga en botones de acción.
3. **Fase 3 (Asincronía):** Simular latencia de red usando `Promises` (`async/await`) en lugar de logs instantáneos.
