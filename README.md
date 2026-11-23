# Vento Marketplace (WYM)

Plataforma integral de **Compra y Venta de Productos Físicos** y **Oferta y Cotización de Servicios Profesionales** desarrollada para la asignatura *Tecnologías Web y Móviles* (Universidad de Concepción).

El repositorio está estructurado de forma simétrica en **`/frontend`** (React 18 + Vite 5 + Tailwind CSS 3 + Material UI 6) y **`/backend`** (**ASP.NET Core Web API .NET 8 LTS + Entity Framework Core + PostgreSQL `BD2` + Postman + Raspberry Pi**).

---

## Estructura del Repositorio

```text
WebYMobiles/
├── frontend/                   # Aplicación SPA React + Vite + MUI + Tailwind
│   ├── .env.example            # Plantilla de variables de entorno (VITE_API_URL)
│   ├── package.json
│   ├── vite.config.js          # Alias @/ -> ./src y code-splitting optimizado
│   └── src/                    # Arquitectura Atomic Design (atoms, molecules, organisms, pages)
├── backend/                    # API REST Vento.Api (.NET 8 + EF Core + PostgreSQL BD2)
│   ├── Vento.sln
│   ├── Vento.Api/              # Controladores, DTOs, Middleware global, JWT, BCrypt y DbSeeder
│   ├── database/               # Scripts SQL 00..06 (49 tablas BD2, 23 triggers, 6 vistas y RBAC)
│   ├── postman/                # Colección oficial Postman v2.1 + Entorno {{baseUrl}} (63 pruebas)
│   └── deploy/                 # Servicio systemd y script ARM64 para Raspberry Pi (0.0.0.0:5000)
├── docker-compose.yml          # Orquestación con PostgreSQL 17 + .NET 8 + React
├── GUIA_DEMO_RAPIDA.md         # Guía de verificación paso a paso con comandos estándar
├── DESARROLLO_IMPLEMENTADO.md  # Informe técnico completo y matriz de cumplimiento
├── MINUTA.md                   # Registro histórico de reuniones y acuerdos del equipo
└── README.md                   # Guía de instalación, ejecución y cuentas de prueba
```

---

## Tecnologías Principales

### Frontend (`/frontend`)
- **Framework UI:** React 18 + Vite 5
- **Sistema de Diseño Híbrido:** Material UI 6 (`@mui/material`) + Tailwind CSS 3
- **Enrutamiento y Seguridad:** React Router DOM 6 con guardián RBAC (`ProtectedRoute` + vista HTTP `403`)
- **Iconografía:** Lucide React & Material Icons
- **Estándares:** HTML5 Semántico W3C (`lang="es"`), Accesibilidad WCAG, Atomic Design y validación de RUT chileno Módulo 11

### Backend (`/backend`)
- **Framework:** ASP.NET Core Web API (.NET 8.0 LTS)
- **Acceso a Datos:** Entity Framework Core + Npgsql sobre PostgreSQL
- **Seguridad:** Autenticación por tokens JWT Bearer + contraseñas hasheadas con BCrypt
- **Contrato JSON:** Respuestas unificadas `{ success, message, data, errors }` y middleware centralizado de excepciones
- **Pruebas:** Colección de Postman con pruebas automáticas para casos de éxito y de error

---

## Instalación y Ejecución con Comandos Estándar

### 1. Base de Datos PostgreSQL
Asegúrate de tener el servicio de PostgreSQL activo en tu equipo. Ejecuta los scripts SQL en orden para aprovisionar el esquema relacional y los datos iniciales:

```bash
# 1. Crear base de datos
psql -U postgres -c "CREATE DATABASE vento_bd2;"

# 2. Cargar tablas, restricciones, triggers y datos semilla
psql -U postgres -d vento_bd2 -f backend/database/00_setup_usuario_bd.sql
psql -U postgres -d vento_bd2 -f backend/database/01_bd2_tablas_restricciones_indices.sql
psql -U postgres -d vento_bd2 -f backend/database/02_bd2_triggers.sql
psql -U postgres -d vento_bd2 -f backend/database/03_bd2_funciones_y_vistas.sql
psql -U postgres -d vento_bd2 -f backend/database/04_extension_vento_rbac.sql
psql -U postgres -d vento_bd2 -f backend/database/05_seed_vento_demo.sql
```
*(También puedes abrir y ejecutar estos archivos SQL en orden desde **pgAdmin 4**).*

---

### 2. Configurar Credenciales del Backend
Verifica que en [`backend/Vento.Api/appsettings.Development.json`](./backend/Vento.Api/appsettings.Development.json) la cadena de conexión tenga las credenciales de tu PostgreSQL local:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vento_bd2;Username=vento_app;Password=TU_PASSWORD_LOCAL"
  }
}
```

---

### 3. Levantar los Servidores

Abre **dos terminales**:

#### Terminal 1 — Backend (.NET 8 Web API)
```bash
cd backend/Vento.Api
dotnet run
```
* **API activa en:** `http://localhost:5000`
* **Health Check:** `http://localhost:5000/api/health`
* **Swagger UI:** `http://localhost:5000/swagger`

#### Terminal 2 — Frontend (React + Vite)
```bash
cd frontend
npm install   # (Solo la primera vez)
npm run dev
```
* **Frontend activo en:** `http://localhost:5173`
* *(Asegúrate de tener en `frontend/.env`: `VITE_API_URL=http://localhost:5000/api`)*

---

### Alternativa: Contenedores Docker
Si prefieres levantar todo en un entorno aislado con Docker Desktop:
```bash
docker compose up --build
```
* Frontend: `http://localhost:5173`
* Backend: `http://localhost:5000/api/health`
* PostgreSQL: `localhost:5433`

---

## Batería de Pruebas en Postman

El proyecto incluye la colección oficial en [`backend/postman/`](./backend/postman/):
1. Importa en Postman `Vento_Marketplace.postman_collection.json` y `Vento_Local_Raspberry.postman_environment.json`.
2. Selecciona el entorno **Vento - Desarrollo Local / Raspberry Pi**.
3. Consulta [`GUIA_DEMO_RAPIDA.md`](./GUIA_DEMO_RAPIDA.md) para el paso a paso de demostración de los casos exitosos (`200 OK`) y de error (`400 Bad Request`, `409 Conflict`).

---

## Ecosistema de 4 Perfiles (RBAC) y Cuentas Demo

| Perfil / Rol | RUT | Contraseña | Capacidades Clave |
| :--- | :--- | :--- | :--- |
| **Administrador (`Admin`)** | `12.345.678-5` | `Admin123!` | Centro de Gobierno (`/admin/usuarios`): aprobar/rechazar cuentas comerciales y publicaciones, destacar ítems, suspender usuarios (`403`), cupones dinámicos, tickets de soporte y panel interactivo con las vistas SQL de BD2. |
| **Vendedor Productos (`VendedorProducto`)** | `11.111.111-1` | `vento1234` | Dashboard de ventas (`/admin/productos`), alertas de stock crítico (`≤ 3`), ofertas reales, bandeja logística con courier/tracking y tienda pública (`/tienda/vendedor/2`). |
| **Proveedor Servicios (`ProveedorServicio`)** | `22.222.222-2` | `servicio1234` | Portafolio profesional (`/admin/servicios`), CRM de cotizaciones con propuesta formal en CLP, control de ejecución y perfil público (`/servicios/proveedor/3`). |
| **Comprador (`Comprador`)** | `15.555.555-6` | `compra1234` | Compra en Tienda, libreta de direcciones, tracking con `Stepper` MUI + boleta imprimible, aceptación de cotizaciones hacia checkout y reseñas verificadas. |
| **Vendedor en Revisión (`Pendiente`)** | `18.888.888-7` | `pendiente1234` | Permite verificar el bloqueo preventivo de publicación hasta que el Administrador apruebe su solicitud comercial. |

Para el detalle de arquitectura y cumplimiento de pauta técnica revisa [`DESARROLLO_IMPLEMENTADO.md`](./DESARROLLO_IMPLEMENTADO.md).
