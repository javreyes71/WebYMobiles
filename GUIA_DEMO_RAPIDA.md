# Guía Rápida de Verificación y Demostración (Avance Backend 50%)

Esta guía contiene los pasos exactos para verificar que todo el sistema esté operativo y realizar una presentación fluida ante el docente.

---

## 1. Preparación Previa (Solo una vez)

### Paso 1: Inicializar la base de datos PostgreSQL
Asegúrate de que el servicio de PostgreSQL esté corriendo en tu equipo. Abre una terminal (PowerShell o CMD) en la raíz del proyecto y ejecuta:

```powershell
.\inicializar-bd.bat
```

* El script te pedirá la contraseña del usuario `postgres` de tu computador.
* Creará automáticamente la base de datos `vento_bd2`, cargará las tablas, los triggers y las cuentas de prueba, y configurará `appsettings.Development.json`.

---

## 2. Levantar el Sistema en 1 Clic

En la raíz del proyecto, ejecuta:

```powershell
.\iniciar.bat
```

Esto compilará y dejará corriendo simultáneamente:
* **Backend API (.NET 8):** `http://localhost:5000`
* **Documentación interactiva Swagger:** `http://localhost:5000/swagger`
* **Frontend (React + Vite):** `http://localhost:5173`

*(Para detener ambos servidores al terminar, presiona `Ctrl + C` en esa terminal).*

---

## 3. Verificación Rápida en el Navegador

Antes de la clase, abre estas dos direcciones en tu navegador para confirmar:
1. `http://localhost:5000/api/health`
   * Debe responder con status `Healthy` y el contrato JSON `{ success: true, message: ... }`.
2. `http://localhost:5000/swagger`
   * Debe mostrar la lista completa de endpoints REST disponibles (`/api/auth`, `/api/usuarios`, `/api/productos`, `/api/servicios`, etc.).

---

## 4. Demostración en Postman (Paso a Paso)

### Configuración inicial en Postman
1. Abre **Postman**.
2. Haz clic en **Import** (arriba a la izquierda).
3. Arrastra los dos archivos ubicados en la carpeta `backend/postman/`:
   * `Vento_Marketplace.postman_collection.json`
   * `Vento_Local_Raspberry.postman_environment.json`
4. En el selector de entorno (arriba a la derecha), elige:
   **`Vento - Desarrollo Local / Raspberry Pi`**.

---

### Las 3 pruebas clave para mostrarle al profesor:

#### Prueba 1 — Caso Exitoso (Status 200 OK)
* **Dónde ir:** Carpeta `02. Autenticación y Sesiones` ➔ `POST /api/auth/login - Admin`.
* **Acción:** Presionar el botón azul **Send**.
* **Qué verificar:**
  * Status: `200 OK`.
  * La respuesta devuelve `{ "success": true, "message": "Inicio de sesión exitoso.", "data": { "token": "..." } }`.
  * El script guarda automáticamente el token para las siguientes pruebas.

#### Prueba 2 — Caso de Error por Validación (Status 400 Bad Request)
* **Dónde ir:** Carpeta `02. Autenticación y Sesiones` ➔ `POST /api/auth/register - [400 Bad Request] Correo inválido`.
* **Acción:** Presionar **Send**.
* **Qué verificar:**
  * Status: `400 Bad Request`.
  * La respuesta devuelve `{ "success": false, "message": "Datos inválidos.", "errors": ["El correo electrónico no tiene un formato válido."] }`.
* **Qué decirle al docente:** *"El backend valida en el servidor antes de tocar la base de datos y detalla el error en el arreglo errors"*.

#### Prueba 3 — Caso de Error por Conflicto (Status 409 Conflict)
* **Dónde ir:** Carpeta `02. Autenticación y Sesiones` ➔ `POST /api/auth/register - [409 Conflict] Correo duplicado`.
* **Acción:** Presionar **Send**.
* **Qué verificar:**
  * Status: `409 Conflict`.
  * La respuesta devuelve `{ "success": false, "message": "Conflicto con recurso existente.", "errors": ["El correo ya está registrado..."] }`.

---

## 5. Demostración de Persistencia Real en PostgreSQL

Para demostrar que los datos persisten físicamente y no están en memoria:
1. En Postman, ejecuta `GET /api/usuarios`.
2. Muestra que la lista devuelve los usuarios almacenados en PostgreSQL.
3. Si creas un nuevo usuario mediante `POST /api/auth/register`, vuelve a ejecutar `GET /api/usuarios` y muestra que el nuevo registro aparece al final de la lista.

---

## 6. Demostración de Conexión con React

1. Abre tu navegador en `http://localhost:5173`.
2. Presiona `F12` para abrir las herramientas de desarrollador y ve a la pestaña **Red (Network)**.
3. Recarga la página:
   * Verás las solicitudes HTTP automáticas saliendo hacia `http://localhost:5000/api/...`.
   * Verás que React recibe el JSON con status `200` y muestra los productos en pantalla.
