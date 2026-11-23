# Guía Rápida de Verificación y Demostración (Avance Backend 50%)

Esta guía describe los comandos de terminal estándar (`dotnet`, `npm`, `psql`) y los pasos en Postman para validar y presentar el backend de forma directa, sin depender de scripts automatizados.

---

## 1. Base de Datos PostgreSQL

Asegúrate de tener el servicio de PostgreSQL corriendo. Para crear la base de datos y cargar el esquema con los datos de prueba, ejecuta los scripts SQL en orden desde una terminal:

```bash
# 1. Crear la base de datos
psql -U postgres -c "CREATE DATABASE vento_bd2;"

# 2. Cargar tablas, restricciones, triggers y datos semilla
psql -U postgres -d vento_bd2 -f backend/database/00_setup_usuario_bd.sql
psql -U postgres -d vento_bd2 -f backend/database/01_bd2_tablas_restricciones_indices.sql
psql -U postgres -d vento_bd2 -f backend/database/02_bd2_triggers.sql
psql -U postgres -d vento_bd2 -f backend/database/03_bd2_funciones_y_vistas.sql
psql -U postgres -d vento_bd2 -f backend/database/04_extension_vento_rbac.sql
psql -U postgres -d vento_bd2 -f backend/database/05_seed_vento_demo.sql
```

*(También puedes abrir estos archivos y ejecutarlos en orden dentro de **pgAdmin 4** sobre la base `vento_bd2`).*

---

## 2. Configuración de Credenciales (`appsettings.Development.json`)

Verifica que en el archivo `backend/Vento.Api/appsettings.Development.json` la cadena de conexión tenga las credenciales correctas de tu PostgreSQL local:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vento_bd2;Username=vento_app;Password=TU_PASSWORD"
  }
}
```

---

## 3. Levantar los Servidores con Comandos Directos

Abre dos terminales:

### Terminal 1: Backend (.NET 8 Web API)
```bash
cd backend/Vento.Api
dotnet run
```
* **API activa en:** `http://localhost:5000`
* **Health Check:** `http://localhost:5000/api/health`
* **Documentación Swagger:** `http://localhost:5000/swagger`

### Terminal 2: Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
* **Frontend activo en:** `http://localhost:5173`

---

## 4. Demostración en Postman (Pauta de Evaluación)

### Configuración en Postman
1. Abre **Postman**.
2. Haz clic en **Import** y carga los archivos desde `backend/postman/`:
   * `Vento_Marketplace.postman_collection.json`
   * `Vento_Local_Raspberry.postman_environment.json`
3. En la esquina superior derecha de Postman, selecciona el entorno:
   **`Vento - Desarrollo Local / Raspberry Pi`** (apunta a `http://localhost:5000`).

---

### Las 3 Pruebas para Presentar al Docente

#### 1. Caso de Éxito (`200 OK`)
* **Endpoint:** `POST {{baseUrl}}/api/auth/login` (dentro de la carpeta `02. Autenticación y Sesiones` ➔ `Login Admin`).
* **Acción:** Presionar **Send**.
* **Resultado:**
  * Código HTTP: `200 OK`.
  * Formato JSON: `{ success: true, message: "Inicio de sesión exitoso.", data: { token: "..." } }`.
  * Demuestra autenticación con BCrypt y emisión de token JWT.

#### 2. Caso de Error de Validación (`400 Bad Request`)
* **Endpoint:** `POST {{baseUrl}}/api/auth/register` (dentro de `02. Autenticación y Sesiones` ➔ `[400 Bad Request] Correo inválido`).
* **Acción:** Presionar **Send**.
* **Resultado:**
  * Código HTTP: `400 Bad Request`.
  * Formato JSON: `{ success: false, message: "Datos inválidos.", errors: ["El correo electrónico no tiene un formato válido."] }`.
* **Argumento:** Demuestra que el backend valida en el servidor y protege la integridad de los datos antes de guardarlos.

#### 3. Caso de Error de Conflicto (`409 Conflict`)
* **Endpoint:** `POST {{baseUrl}}/api/auth/register` (dentro de `02. Autenticación y Sesiones` ➔ `[409 Conflict] Correo duplicado`).
* **Acción:** Presionar **Send**.
* **Resultado:**
  * Código HTTP: `409 Conflict`.
  * Formato JSON: `{ success: false, message: "Conflicto con recurso existente.", errors: [...] }`.
* **Argumento:** Demuestra control de registros duplicados en base de datos.

---

## 5. Demostración de Persistencia en Base de Datos

Para comprobar que los datos no son estáticos ni en memoria:
1. En Postman, ejecuta `GET {{baseUrl}}/api/usuarios`.
2. Muestra que la respuesta devuelve los registros que existen en la tabla `usuario` de PostgreSQL.
3. Si registras un nuevo usuario por `POST`, vuelve a ejecutar `GET {{baseUrl}}/api/usuarios` y muestra que el nuevo registro aparece persistido.

---

## 6. Demostración de Integración con el Frontend

1. Abre el navegador en `http://localhost:5173`.
2. Presiona `F12` y ve a la pestaña **Red (Network)**.
3. Recarga la página y muestra las peticiones HTTP que React realiza hacia `http://localhost:5000/api/...`, confirmando que el cliente consume la API y procesa el contrato `{ success, message, data, errors }`.
