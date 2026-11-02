using Microsoft.AspNetCore.Mvc;
using Vento.Api.Data;
using Vento.Api.DTOs;

namespace Vento.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public HealthController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var dbConnected = false;
        string dbNote;

        try
        {
            dbConnected = await _context.Database.CanConnectAsync();
            dbNote = dbConnected
                ? "Conectado correctamente a PostgreSQL (modelo BD2)."
                : "API operativa; PostgreSQL no accesible con las credenciales actuales.";
        }
        catch (Exception ex)
        {
            dbNote = $"API operativa; pendiente configurar credenciales PostgreSQL ({ex.GetType().Name}).";
        }

        var payload = new
        {
            status = "Healthy",
            service = "Vento.Api (.NET 8 + PostgreSQL BD2)",
            environment = _env.EnvironmentName,
            databaseConnected = dbConnected,
            databaseMessage = dbNote,
            timestampUtc = DateTime.UtcNow
        };

        return Ok(ApiResponse<object>.Ok(payload, "Servidor Vento.Api operativo."));
    }
}
