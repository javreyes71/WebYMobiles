# Backend — Vento Marketplace (`Vento.Api` · .NET 8 LTS + PostgreSQL `BD2`)

API RESTful construida en **ASP.NET Core Web API (.NET 8.0 LTS)** con **Entity Framework Core + Npgsql**, alineada **100 %** con:
1. Los lineamientos oficiales de *Tecnologías Web y Móviles* (`pdfs/Contenido backend-1.pdf`).
2. El modelo relacional completo del ramo *Base de Datos Avanzadas* (`BD2`): **49 tablas**, **9 restricciones `CHECK`**, **25 índices**, **23 triggers PL/pgSQL**, funciones almacenadas y las **6 vistas analíticas** (`vista_inventario_critico`, `vista_factura_cliente`, `vista_rendimiento_emprendedor`, `vista_catalogo_unificado`, `vista_geo_empresas`, `vista_categorias_jerarquia`).

---

## 1. Estructura del Directorio `/backend`

```text
backend/
├── Vento.sln
├── Vento.Api/
│   ├── Controllers/           # Health, Auth, Usuarios, Productos, Servicios, AdminCatalogo, Ordenes, Cotizaciones, Cupones, Resenas, Contacto, AnaliticaBd2
│   ├── Data/AppDbContext.cs   # Mapeo EF Core sobre esquema BD2 + extensiones RBAC
│   ├── DTOs/                  # ApiResponse<T> { success, message, data, errors } y DTOs sin ClaveAcceso
│   ├── Middlewares/           # ExceptionHandlingMiddleware (traduce excepciones y triggers P0001/23505/23514 de PostgreSQL)
│   ├── Models/Bd2Entities.cs  # Entidades BD2 + tablas puente + extensiones web
│   ├── Seeds/DbSeeder.cs      # Semilla idempotente (IDs >= 5001, coexistencia limpia con inserts de BD2)
│   ├── Services/              # AuthAndUserService (BCrypt + JWT) y CatalogoService
│   ├── Utils/RutValidator.cs  # Validación chilena Módulo 11 en servidor antes de BD
│   ├── appsettings.json       # Plantilla segura (sin credenciales reales)
│   └── appsettings.Example.json
├── database/
│   ├── 00_setup_usuario_bd.sql                 # Rol dedicado vento_app (mínimo privilegio, nunca postgres)
│   ├── 01_bd2_tablas_restricciones_indices.sql # 49 tablas, CHECKs e índices de BD2
│   ├── 02_bd2_triggers.sql                     # 23 triggers de BD2 (control de stock, alerta_inventario, etc.)
│   ├── 03_bd2_funciones_y_vistas.sql           # Funciones y las 6 vistas analíticas de BD2
│   ├── 04_extension_vento_rbac.sql             # Extensión no destructiva RBAC y moderación previa
│   ├── 05_seed_vento_demo.sql                  # Semilla SQL base para pruebas directas
│   └── 06_seed_3filas_vistas.sql               # Demostración práctica activa (>= 3 filas en cada vista)
├── postman/
│   ├── Vento_Marketplace.postman_collection.json
│   └── Vento_Local_Raspberry.postman_environment.json
└── deploy/
    ├── vento-api.service      # Unidad systemd escuchando en 0.0.0.0:5000
    └── deploy_raspberry.sh    # Publicación linux-arm64 y despliegue en Raspberry Pi
```

---

## 2. Inicialización de PostgreSQL (`BD2` + RBAC)

Ejecutar en orden sobre una base de datos PostgreSQL (ej. `vento_bd2` en `pgAdmin 4` o `psql`):

```bash
psql -U postgres -c "CREATE DATABASE vento_bd2;"
psql -U postgres -d vento_bd2 -f database/00_setup_usuario_bd.sql
psql -U postgres -d vento_bd2 -f database/01_bd2_tablas_restricciones_indices.sql
psql -U postgres -d vento_bd2 -f database/02_bd2_triggers.sql
psql -U postgres -d vento_bd2 -f database/03_bd2_funciones_y_vistas.sql
psql -U postgres -d vento_bd2 -f database/04_extension_vento_rbac.sql
psql -U postgres -d vento_bd2 -f database/05_seed_vento_demo.sql
psql -U postgres -d vento_bd2 -f database/06_seed_3filas_vistas.sql
```

> **Coexistencia con `insertsll.txt` de BD2:** Los scripts `04`, `05` y `06` utilizan `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING` e identificadores `>= 5001` para convivir sin colisiones con los registros `1..1000` de *Base de Datos Avanzadas*. Además, si un usuario histórico de `BD2` inicia sesión con su contraseña legada, `AuthAndUserService` la migra automáticamente a hash `BCrypt`.

---

## 3. Ejecución Local en Desarrollo

1. Copiar `Vento.Api/appsettings.Example.json` a `Vento.Api/appsettings.Development.json` (ignorado en Git) y configurar la contraseña local del usuario `vento_app`.
2. Compilar y levantar la API en `http://0.0.0.0:5000`:

```bash
cd backend
dotnet build Vento.sln
dotnet run --project Vento.Api
```

3. Verificar estado en `http://localhost:5000/api/health`.
4. Para conectar el Frontend React (`/frontend`), crear `/frontend/.env` con:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Cuentas Demo Semilla (RBAC 4 Perfiles)

| Perfil | RUT | Contraseña | Estado Inicial |
| :--- | :--- | :--- | :--- |
| `Admin` | `12.345.678-5` | `Admin123!` | Activo / Aprobado |
| `VendedorProducto` | `11.222.333-9` | `Vende123!` | Activo / Aprobado |
| `ProveedorServicio` | `22.333.444-6` | `Serv123!` | Activo / Aprobado |
| `Comprador` | `15.432.987-1` | `Compra123!` | Activo / NoAplica |
| `VendedorProducto` (en cola) | `18.765.432-K` | `Pend1234!` | Activo / **Pendiente** |

---

## 5. Pruebas en Postman (`Fase B5`)

1. Importar `postman/Vento_Marketplace.postman_collection.json` y `postman/Vento_Local_Raspberry.postman_environment.json`.
2. Seleccionar el entorno **Vento - Desarrollo Local / Raspberry Pi** (`{{baseUrl}} = http://localhost:5000` o `http://IP_RASPBERRY:5000`).
3. Ejecutar la carpeta **02. Autenticación y Sesiones**: los scripts `pm.test` guardan automáticamente `{{adminToken}}`, `{{vendedorToken}}`, `{{proveedorToken}}` y `{{compradorToken}}`, y validan tanto códigos HTTP (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`) como el contrato JSON `{ success, message, data, errors }`.

---

## 6. Despliegue en Raspberry Pi (`linux-arm64`)

1. En la Raspberry Pi (o compilación cruzada desde PC):
   ```bash
   cd backend
   chmod +x deploy/deploy_raspberry.sh
   ./deploy/deploy_raspberry.sh
   ```
2. Editar `/etc/vento-api/vento.env` con la cadena de conexión de `vento_app`, el secreto JWT de producción y la URL de origen CORS del frontend.
3. En el proyecto React (`/frontend/.env`), apuntar `VITE_API_URL=http://<IP_RASPBERRY>:5000/api` y probar desde otra máquina de la red local.
