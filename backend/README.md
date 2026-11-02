# Backend — Vento Marketplace (`Vento.Api`)

Directorio reservado para la capa de servidor **ASP.NET Core Web API (.NET 8/9)** y persistencia relacional **PostgreSQL**, simétrica a `/frontend` según los lineamientos de *Tecnologías Web y Móviles*.

## Arquitectura Planificada (Fases B1 a B6)

- **Framework:** ASP.NET Core Web API (`C#`)
- **ORM y Base de Datos:** Entity Framework Core + `Npgsql.EntityFrameworkCore.PostgreSQL`
- **Seguridad y RBAC:** Hash de contraseñas con `BCrypt.Net-Next`, autenticación `JWT Bearer` y autorización basada en los 4 roles (`Admin`, `VendedorProducto`, `ProveedorServicio`, `Comprador`).
- **Contrato JSON Estandarizado:**
  ```json
  {
    "success": true,
    "message": "Operación exitosa.",
    "data": {},
    "errors": null
  }
  ```
- **Validación y Pruebas:** Doble validación (Frontend + DataAnnotations/FluentValidation en servidor, incluyendo RUT chileno Módulo 11) y colección Postman con variable `{{baseUrl}}`.
- **Despliegue:** Configuración preparada para ejecución en servidor Linux ARM64 (**Raspberry Pi**) detrás de Nginx / `systemd` con política CORS explícita hacia el cliente Vite (`VITE_API_URL`).
