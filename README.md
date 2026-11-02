# Vento Marketplace (WYM)

Plataforma integral de **Compra y Venta de Productos Físicos** y **Oferta y Cotización de Servicios Profesionales** desarrollada para la asignatura *Tecnologías Web y Móviles* (Universidad de Concepción).

El repositorio está estructurado de forma simétrica en **`/frontend`** (React 18 + Vite 5 + Tailwind CSS 3 + Material UI 6) y **`/backend`** (**ASP.NET Core Web API .NET 8 LTS + Entity Framework Core + PostgreSQL `BD2` + Postman + Raspberry Pi**).

---

## Estructura del Repositorio

```text
WebYMobiles/
├── frontend/                   # Aplicación SPA React + Vite + MUI + Tailwind
│   ├── .env.example            # Variable de entorno VITE_API_URL
│   ├── package.json
│   ├── vite.config.js          # Alias @/ -> ./src y code-splitting optimizado
│   └── src/                    # Arquitectura Atomic Design (atoms, molecules, organisms, pages)
├── backend/                    # API REST Vento.Api (.NET 8 + EF Core + PostgreSQL BD2)
│   ├── Vento.sln
│   ├── Vento.Api/              # Controladores, DTOs, Middleware global, JWT, BCrypt y DbSeeder
│   ├── database/               # Scripts SQL 00..05 (49 tablas BD2, 23 triggers, vistas y RBAC)
│   ├── postman/                # Colección oficial Postman v2.1 + Entorno {{baseUrl}} (63 pruebas)
│   └── deploy/                 # Servicio systemd y script ARM64 para Raspberry Pi (0.0.0.0:5000)
├── DESARROLLO_IMPLEMENTADO.md  # Informe técnico completo y matriz de cumplimiento
├── MINUTA.md                   # Registro histórico de reuniones y acuerdos del equipo
└── README.md                   # Guía rápida de instalación y cuentas de prueba
```

---

## Tecnologías Principales (`/frontend`)

- **Framework UI:** React 18 + Vite 5
- **Sistema de Diseño Híbrido:** Material UI 6 (`@mui/material`) + Tailwind CSS 3
- **Enrutamiento y Seguridad:** React Router DOM 6 con guardián RBAC (`ProtectedRoute` + vista HTTP `403`)
- **Iconografía:** Lucide React & Material Icons
- **Estándares:** HTML5 Semántico W3C (`lang="es"`), Accesibilidad WCAG, Atomic Design y validación de RUT chileno Módulo 11

---

## Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/javreyes71/WebYMobiles.git
cd WebYMobiles/frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (opcional)
Copia `.env.example` a `.env` si deseas apuntar a un servidor backend `.NET`:
```bash
cp .env.example .env
```
*(Si `VITE_API_URL` está vacío, el frontend opera automáticamente con su capa persistente en `localStorage` respetando exactamente el contrato `{ success, message, data, errors }` y códigos HTTP).*

### 4. Levantar servidor de desarrollo
```bash
npm run dev
```
Abre `http://localhost:5173` en tu navegador. Para compilar a producción ejecuta `npm run build`.

---

## Ecosistema de 4 Perfiles (RBAC) y Cuentas Demo

En el modal de **Iniciar Sesión** dispones de botones de acceso rápido para probar de inmediato los **4 roles** y la **cola de aprobación previa estricta**:

| Perfil / Rol | RUT | Contraseña | Capacidades Clave |
| :--- | :--- | :--- | :--- |
| **Administrador (`Admin`)** | `12.345.678-5` | `admin1234` | Centro de Gobierno (`/admin/usuarios`): aprobar/rechazar cuentas comerciales y publicaciones, destacar ítems, suspender usuarios (`403`), cupones dinámicos y tickets de soporte. |
| **Vendedor Productos (`VendedorProducto` - Aprobado)** | `11.111.111-1` | `vento1234` | Dashboard de ventas (`/admin/productos`), alertas de stock crítico (`≤ 3`), ofertas reales, bandeja logística con courier/tracking y tienda pública (`/tienda/vendedor/2`). |
| **Proveedor Servicios (`ProveedorServicio` - Aprobado)** | `22.222.222-2` | `servicio1234` | Portafolio profesional (`/admin/servicios`), CRM de cotizaciones con envío de propuesta formal en CLP, control de ejecución y perfil público (`/servicios/proveedor/3`). |
| **Comprador (`Comprador`)** | `15.555.555-6` | `compra1234` | Compra en Tienda, libreta de direcciones chilenas, tracking con `Stepper` MUI + boleta imprimible, aceptación y pago de cotizaciones, reseñas verificadas y postulación comercial. |
| **Vendedor en Revisión (`Pendiente`)** | `18.888.888-7` | `pendiente1234` | Permite verificar el bloqueo preventivo de publicación hasta que el Administrador apruebe su solicitud comercial. |

Para el detalle arquitectónico completo revisa [`DESARROLLO_IMPLEMENTADO.md`](./DESARROLLO_IMPLEMENTADO.md).
