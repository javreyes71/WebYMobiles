using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;
using Vento.Api.Services;

namespace Vento.Api.Controllers;

[ApiController]
[Route("api")]
public class ContactoYSoporteController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContactoYSoporteController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("contacto")]
    public async Task<IActionResult> CrearTicketContacto([FromBody] TicketCreateDto dto)
    {
        var nombre = (dto.Nombre ?? string.Empty).Trim();
        var correo = (dto.Correo ?? string.Empty).Trim().ToLowerInvariant();
        var asunto = (dto.Asunto ?? "Consulta general").Trim();
        var mensaje = (dto.Mensaje ?? string.Empty).Trim();

        var errors = new List<string>();
        if (nombre.Length < 2) errors.Add("El nombre es obligatorio (mínimo 2 caracteres).");
        if (!AuthAndUserService.IsValidEmail(correo)) errors.Add("Ingresa un correo electrónico válido.");
        if (mensaje.Length < 10) errors.Add("El mensaje debe contener al menos 10 caracteres.");

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos de contacto inválidos.", errors));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var codigo = $"TCK-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 100000:D5}";

        var ticket = new TicketSoporte
        {
            Codigo = codigo,
            RunUsuario = !string.IsNullOrWhiteSpace(callerRun) && await _context.Usuarios.AnyAsync(u => u.Run == callerRun) ? callerRun : null,
            Nombre = nombre,
            Correo = correo,
            Asunto = asunto[..Math.Min(asunto.Length, 160)],
            Mensaje = mensaje,
            Estado = "Abierto",
            FechaCreacion = DateTime.Now
        };

        _context.TicketsSoporte.Add(ticket);
        await _context.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ApiResponse<object>.Ok(
            MapTicket(ticket),
            "Mensaje recibido correctamente. Nuestro equipo responderá a la brevedad."));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/tickets")]
    public async Task<IActionResult> GetTicketsAdmin()
    {
        var tickets = await _context.TicketsSoporte.AsNoTracking()
            .OrderByDescending(t => t.FechaCreacion)
            .Take(100)
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(tickets.Select(MapTicket).ToList(), "Bandeja de soporte obtenida."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("admin/tickets/{codigo}/respuesta")]
    public async Task<IActionResult> ResponderTicket(string codigo, [FromBody] TicketRespuestaDto dto)
    {
        var ticket = await _context.TicketsSoporte.FirstOrDefaultAsync(t => t.Codigo == codigo);
        if (ticket is null)
        {
            return NotFound(ApiResponse.Fail("Ticket de soporte no encontrado."));
        }

        if (string.IsNullOrWhiteSpace(dto.RespuestaAdmin))
        {
            return BadRequest(ApiResponse.Fail("Respuesta vacía.", "Debes ingresar una respuesta para el usuario."));
        }

        ticket.RespuestaAdmin = dto.RespuestaAdmin.Trim();
        ticket.Estado = string.IsNullOrWhiteSpace(dto.Estado) ? "Respondido" : dto.Estado.Trim();
        ticket.FechaRespuesta = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(MapTicket(ticket), "Respuesta registrada en el ticket."));
    }

    [HttpGet("empresa")]
    public async Task<IActionResult> GetDatosEmpresa()
    {
        var cfg = await _context.ConfiguracionesPlataforma.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Clave == "empresa_corporativa");

        if (cfg is null)
        {
            return Ok(ApiResponse<object>.Ok(new
            {
                rut = "76.543.210-3",
                nombre = "Vento Marketplace SpA",
                sitioWeb = "https://vento.cl",
                correoSoporte = "soporte@vento.cl",
                telefonoSoporte = "+56 2 2840 9900",
                direccionMatriz = "Av. Providencia 1234, Santiago"
            }, "Datos corporativos obtenidos."));
        }

        var data = JsonSerializer.Deserialize<JsonElement>(cfg.ValorJson);
        return Ok(ApiResponse<JsonElement>.Ok(data, "Datos corporativos obtenidos."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("admin/empresa")]
    public async Task<IActionResult> ActualizarDatosEmpresa([FromBody] EmpresaConfigDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return BadRequest(ApiResponse.Fail("Datos inválidos.", "La razón social o nombre corporativo es obligatorio."));
        }

        var json = JsonSerializer.Serialize(dto);
        var cfg = await _context.ConfiguracionesPlataforma.FirstOrDefaultAsync(c => c.Clave == "empresa_corporativa");
        if (cfg is null)
        {
            cfg = new ConfiguracionPlataforma
            {
                Clave = "empresa_corporativa",
                ValorJson = json,
                ActualizadoEn = DateTime.Now
            };
            _context.ConfiguracionesPlataforma.Add(cfg);
        }
        else
        {
            cfg.ValorJson = json;
            cfg.ActualizadoEn = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<EmpresaConfigDto>.Ok(dto, "Configuración corporativa guardada correctamente."));
    }

    private static object MapTicket(TicketSoporte t) => new
    {
        id = t.Codigo,
        codigo = t.Codigo,
        nombre = t.Nombre,
        correo = t.Correo,
        asunto = t.Asunto,
        mensaje = t.Mensaje,
        fecha = t.FechaCreacion.ToString("dd MMM yyyy, HH:mm"),
        estado = t.Estado,
        respuestaAdmin = t.RespuestaAdmin ?? string.Empty
    };
}
