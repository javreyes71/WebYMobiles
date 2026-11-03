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
│   ├── database/               # Scripts SQL 00..06 (49 tablas BD2, 23 triggers, 6 vistas y RBAC)
│   ├── postman/                # Colección oficial Postman v2.1 + Entorno {{baseUrl}} (63 pruebas)
│   └── deploy/                 # Servicio systemd y script ARM64 para Raspberry Pi (0.0.0.0:5000)
├── docker-compose.yml          # Levanta PostgreSQL BD2 + .NET 8 + React en 1 comando
├── iniciar.bat                 # Lanzador rápido en 1 clic / consola para Windows
├── iniciar.ps1                 # Script PowerShell orquestador (Full / Frontend / Backend / Docker)
├── iniciar.sh                  # Script Bash multiplataforma (Linux / macOS / Git Bash / Raspberry Pi)
├── inicializar-bd.bat          # Crea vento_bd2 y carga los 6 SQL (00..05) en PostgreSQL local
├── inicializar-bd.ps1          # Script PowerShell de inicialización de BD2 local
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

## Inicio Rápido en 1 Comando (2 Modalidades Conviviendo)

El repositorio soporta **ambas modalidades** sin conflicto: contenedores listos en un comando (`Docker Compose`) y ejecución nativa liviana pensada para desarrollo directo y **Raspberry Pi** (`systemd`).

### Opción A — Contenedores Todo-en-Uno (`Docker Compose`)
Levanta automáticamente **PostgreSQL 17** (ejecutando los 7 scripts `00..06` de `BD2` en el primer arranque), **Vento.Api (`.NET 8`)** con el usuario de mínimo privilegio `vento_app` y **Frontend (`React + Vite`)**:
```bash
docker compose up --build
# (o bien: .\iniciar.bat -Modo Docker  /  ./iniciar.sh docker)
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/health`
- PostgreSQL `BD2`: `localhost:5433` *(usa `5433` en el host para no chocar con un PostgreSQL local en `5432`)*

### Opción B — Ejecución Nativa (Windows, Linux y Raspberry Pi)
Detecta automáticamente `.NET 8 SDK` y `Node.js`, instala `node_modules` si falta, crea `appsettings.Development.json` desde plantilla y detiene todo limpiamente con `Ctrl + C`:

#### En Windows (`CMD` o `PowerShell`)
```powershell
# (Opcional 1 sola vez) Crear vento_bd2 y cargar los 6 SQL (00..05) en tu PostgreSQL local:
.\inicializar-bd.bat

# Levantar Backend (.NET 8 en :5000) + Frontend (Vite en :5173)
.\iniciar.bat

# Levantar ambos conectando automáticamente VITE_API_URL=http://localhost:5000/api
.\iniciar.bat -ConectarApi

# Levantar únicamente Frontend (:5173) o únicamente Backend (:5000)
.\iniciar.bat -Modo Frontend
.\iniciar.bat -Modo Backend
```

#### En Linux / macOS / Git Bash / Raspberry Pi
```bash
chmod +x iniciar.sh

./iniciar.sh            # Levanta Backend (:5000) + Frontend (:5173)
./iniciar.sh api        # Levanta ambos con VITE_API_URL=http://localhost:5000/api
./iniciar.sh frontend   # Solo Frontend (:5173)
./iniciar.sh backend    # Solo Backend (:5000)
```
*(Para despliegue permanente en **Raspberry Pi** como servicio `systemd` en `0.0.0.0:5000`, usa [`backend/deploy/deploy_raspberry.sh`](./backend/deploy/deploy_raspberry.sh)).*

---

## Instalación y Ejecución Manual

### 1. Clonar el repositorio
```bash
git clone https://github.com/javreyes71/WebYMobiles.git
cd WebYMobiles
```

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
cp .env.example .env   # Opcional: definir VITE_API_URL=http://localhost:5000/api
npm run dev            # Disponible en http://localhost:5173
```
*(Si `VITE_API_URL` está vacío, el frontend opera automáticamente con su capa persistente en `localStorage` respetando exactamente el contrato `{ success, message, data, errors }` y códigos HTTP).*

### 3. Backend (`/backend` + PostgreSQL `BD2`)
```bash
cd backend
dotnet build Vento.sln
dotnet run --project Vento.Api   # Disponible en http://localhost:5000/api/health
```
Para inicializar las **49 tablas, triggers y vistas de `BD2`**, ejecutar las **63 pruebas en Postman** o desplegar en **Raspberry Pi**, consulta [`backend/README.md`](./backend/README.md).

---

## Ecosistema de 4 Perfiles (RBAC) y Cuentas Demo

En el modal de **Iniciar Sesión** dispones de botones de acceso rápido para probar de inmediato los **4 roles** y la **cola de aprobación previa estricta**:

| Perfil / Rol | RUT | Contraseña | Capacidades Clave |
| :--- | :--- | :--- | :--- |
| **Administrador (`Admin`)** | `12.345.678-5` | `admin1234` | Centro de Gobierno (`/admin/usuarios`): aprobar/rechazar cuentas comerciales y publicaciones, destacar ítems, suspender usuarios (`403`), cupones dinámicos, tickets de soporte y panel interactivo con las **6 Vistas SQL de BD2**. |
| **Vendedor Productos (`VendedorProducto` - Aprobado)** | `11.111.111-1` | `vento1234` | Dashboard de ventas (`/admin/productos`), alertas de stock crítico (`≤ 3`), ofertas reales, bandeja logística con courier/tracking y tienda pública (`/tienda/vendedor/2`). |
| **Proveedor Servicios (`ProveedorServicio` - Aprobado)** | `22.222.222-2` | `servicio1234` | Portafolio profesional (`/admin/servicios`), CRM de cotizaciones con envío de propuesta formal en CLP, control de ejecución y perfil público (`/servicios/proveedor/3`). |
| **Comprador (`Comprador`)** | `15.555.555-6` | `compra1234` | Compra en Tienda, libreta de direcciones chilenas, tracking con `Stepper` MUI + boleta imprimible, aceptación y pago de cotizaciones, reseñas verificadas y postulación comercial. |
| **Vendedor en Revisión (`Pendiente`)** | `18.888.888-7` | `pendiente1234` | Permite verificar el bloqueo preventivo de publicación hasta que el Administrador apruebe su solicitud comercial. |

Para el detalle arquitectónico completo revisa [`DESARROLLO_IMPLEMENTADO.md`](./DESARROLLO_IMPLEMENTADO.md).
