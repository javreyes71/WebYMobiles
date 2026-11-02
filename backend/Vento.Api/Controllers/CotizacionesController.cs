using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;
using Vento.Api.Services;
using Vento.Api.Utils;

namespace Vento.Api.Controllers;

/// <summary>
/// Flujo bidireccional de Cotizaciones de Servicios Profesionales sobre las tablas `cotizacion` y `solicita` de BD2:
/// Solicitud del Comprador -> Propuesta Formal CLP del Proveedor -> Aceptación y Pago en Checkout -> En Ejecución -> Completado.
/// </summary>
[ApiController]
[Route("api/cotizaciones")]
public class CotizacionesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CotizacionesController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetCotizaciones([FromQuery] string? modo = null)
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var isAdmin = User.IsInRole("Admin");

        var query = _context.Solicitudes.AsNoTracking().AsQueryable();

        if (!isAdmin)
        {
            if (string.Equals(modo, "proveedor", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.ProveedorRun == callerRun);
            }
            else if (string.Equals(modo, "comprador", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.RunUsuario == callerRun);
            }
            else
            {
                query = query.Where(s => s.RunUsuario == callerRun || s.ProveedorRun == callerRun);
            }
        }

        var solicitudes = await query
            .Where(s => s.SkuServicio != null)
            .OrderByDescending(s => s.IdSolicitud)
            .Take(100)
            .ToListAsync();

        var dtos = await MapSolicitudesAsync(solicitudes);
        return Ok(ApiResponse<List<CotizacionDto>>.Ok(dtos, "Cotizaciones obtenidas correctamente."));
    }

    [HttpPost]
    public async Task<IActionResult> CrearCotizacion([FromBody] CotizacionCreateDto dto)
    {
        var errors = new List<string>();
        var skuServicio = (dto.ServicioId ?? string.Empty).Trim();
        var nombreContacto = (dto.NombreContacto ?? string.Empty).Trim();
        var correoContacto = (dto.CorreoContacto ?? string.Empty).Trim().ToLowerInvariant();
        var detalles = (dto.Detalles ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(skuServicio))
        {
            errors.Add("Debe indicar el servicio a cotizar.");
        }
        if (nombreContacto.Length < 2)
        {
            errors.Add("El nombre de contacto es obligatorio.");
        }
        if (!AuthAndUserService.IsValidEmail(correoContacto))
        {
            errors.Add("El correo de contacto no tiene un formato válido.");
        }
        if (detalles.Length < 10)
        {
            errors.Add("Describe tu requerimiento con al menos 10 caracteres.");
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos de cotización inválidos.", errors));
        }

        var servicio = await _context.Servicios.AsNoTracking().FirstOrDefaultAsync(s => s.Sku == skuServicio);
        if (servicio is null)
        {
            return NotFound(ApiResponse.Fail("Servicio no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var buyerRun = !string.IsNullOrWhiteSpace(callerRun)
            ? callerRun
            : (!string.IsNullOrWhiteSpace(dto.CompradorId) ? RutValidator.ToBd2Run(dto.CompradorId) : null);

        if (!string.IsNullOrWhiteSpace(buyerRun) && !await _context.Usuarios.AnyAsync(u => u.Run == buyerRun))
        {
            buyerRun = null;
        }

        var owner = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == servicio.OwnerRun);
        var hoy = DateOnly.FromDateTime(DateTime.Today); // Cumple chk_cotizacion_fecha_actual (<= CURRENT_DATE)

        var nextCotId = (await _context.Cotizaciones.MaxAsync(c => (int?)c.IdCotizacion) ?? 5000) + 1;
        var nextSolId = (await _context.Solicitudes.MaxAsync(s => (int?)s.IdSolicitud) ?? 5000) + 1;

        var cotizacion = new Cotizacion
        {
            IdCotizacion = nextCotId,
            Fecha = hoy,
            FechaLimite = hoy.AddDays(15), // Alineado con trg_19_vigencia_cotizacion de BD2
            RunEmpresa = owner?.RunEmpresa
        };
        _context.Cotizaciones.Add(cotizacion);
        await _context.SaveChangesAsync();

        var solicita = new Solicita
        {
            IdSolicitud = nextSolId,
            IdCotizacion = nextCotId,
            RunUsuario = buyerRun,
            ProveedorRun = servicio.OwnerRun,
            SkuServicio = servicio.Sku,
            Precio = (int)Math.Round(servicio.PrecioActual, 0),
            PrecioBase = (int)Math.Round(servicio.PrecioActual, 0),
            Estado = "Pendiente",
            FechaInicio = hoy,
            FechaFin = hoy.AddDays(15),
            NombreContacto = nombreContacto,
            CorreoContacto = correoContacto,
            TelefonoContacto = dto.TelefonoContacto?.Trim(),
            FechaPreferida = dto.FechaDeseada?.Trim(),
            DescripcionRequerimiento = detalles
        };

        _context.Solicitudes.Add(solicita);
        await _context.SaveChangesAsync();

        var createdDto = (await MapSolicitudesAsync(new[] { solicita })).First();
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CotizacionDto>.Ok(
            createdDto,
            "Solicitud de cotización enviada al proveedor."));
    }

    [Authorize(Roles = "ProveedorServicio,Admin")]
    [HttpPatch("{id}/propuesta")]
    public async Task<IActionResult> EnviarPropuestaFormal(string id, [FromBody] PropuestaProveedorDto dto)
    {
        var solId = ParseSolicitudId(id);
        var solicita = await _context.Solicitudes.FirstOrDefaultAsync(s => s.IdSolicitud == solId);
        if (solicita is null)
        {
            return NotFound(ApiResponse.Fail("Cotización no encontrada."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!User.IsInRole("Admin") && !string.Equals(solicita.ProveedorRun, callerRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Solo el proveedor del servicio puede responder esta cotización."));
        }

        if (dto.Monto <= 0 || string.IsNullOrWhiteSpace(dto.Detalle))
        {
            return BadRequest(ApiResponse.Fail(
                "Propuesta incompleta.",
                "Debes indicar un monto mayor a $0 CLP y el alcance detallado del servicio."));
        }

        var diasValidez = Math.Clamp(dto.ValidezDias ?? 15, 1, 45);
        solicita.Precio = dto.Monto;
        solicita.PrecioBase = dto.Monto;
        solicita.PlazoPropuesta = string.IsNullOrWhiteSpace(dto.Plazo) ? "48 a 72 horas hábiles" : dto.Plazo.Trim();
        solicita.ValidezDias = diasValidez;
        solicita.DetallePropuesta = dto.Detalle.Trim();
        solicita.Estado = "Cotizado";
        solicita.FechaRespuesta = DateTime.Now;
        solicita.FechaFin = (solicita.FechaInicio ?? DateOnly.FromDateTime(DateTime.Today)).AddDays(diasValidez);

        await _context.SaveChangesAsync();

        var mapped = (await MapSolicitudesAsync(new[] { solicita })).First();
        return Ok(ApiResponse<CotizacionDto>.Ok(mapped, "Propuesta formal enviada al comprador."));
    }

    [Authorize]
    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstadoCotizacion(string id, [FromBody] EstadoCotizacionDto dto)
    {
        var solId = ParseSolicitudId(id);
        var solicita = await _context.Solicitudes.FirstOrDefaultAsync(s => s.IdSolicitud == solId);
        if (solicita is null)
        {
            return NotFound(ApiResponse.Fail("Cotización no encontrada."));
        }

        var nuevoEstado = (dto.Estado ?? string.Empty).Trim();
        if (nuevoEstado is not ("Aceptada" or "Rechazada" or "En Ejecución" or "Completado"))
        {
            return BadRequest(ApiResponse.Fail(
                "Estado inválido.",
                "Estados permitidos: 'Aceptada', 'Rechazada', 'En Ejecución' o 'Completado'."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        var isBuyer = string.Equals(solicita.RunUsuario, callerRun, StringComparison.OrdinalIgnoreCase);
        var isProvider = string.Equals(solicita.ProveedorRun, callerRun, StringComparison.OrdinalIgnoreCase);

        if (!isAdmin && nuevoEstado is "Aceptada" or "Rechazada" && !isBuyer)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail("Solo el comprador solicitante puede aceptar o rechazar la propuesta."));
        }

        if (!isAdmin && nuevoEstado is "En Ejecución" or "Completado" && !isProvider && !isBuyer)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail("No tienes permiso para actualizar la ejecución de este servicio."));
        }

        solicita.Estado = nuevoEstado;
        await _context.SaveChangesAsync();

        var mapped = (await MapSolicitudesAsync(new[] { solicita })).First();
        return Ok(ApiResponse<CotizacionDto>.Ok(mapped, $"Estado de cotización actualizado a '{nuevoEstado}'."));
    }

    private static int ParseSolicitudId(string raw)
    {
        var digits = new string((raw ?? string.Empty).Where(char.IsDigit).ToArray());
        return int.TryParse(digits, out var id) ? id : -1;
    }

    private async Task<List<CotizacionDto>> MapSolicitudesAsync(IEnumerable<Solicita> solicitudes)
    {
        var list = solicitudes.ToList();
        if (list.Count == 0) return new List<CotizacionDto>();

        var skus = list.Where(s => !string.IsNullOrWhiteSpace(s.SkuServicio)).Select(s => s.SkuServicio!).Distinct().ToList();
        var servicios = await _context.Servicios.AsNoTracking()
            .Where(s => skus.Contains(s.Sku))
            .ToDictionaryAsync(s => s.Sku);

        var provRuns = list.Where(s => !string.IsNullOrWhiteSpace(s.ProveedorRun)).Select(s => s.ProveedorRun!).Distinct().ToList();
        var provs = await _context.Usuarios.AsNoTracking()
            .Where(u => provRuns.Contains(u.Run))
            .ToDictionaryAsync(u => u.Run);

        var cotIds = list.Where(s => s.IdCotizacion.HasValue).Select(s => s.IdCotizacion!.Value).Distinct().ToList();
        var cots = await _context.Cotizaciones.AsNoTracking()
            .Where(c => cotIds.Contains(c.IdCotizacion))
            .ToDictionaryAsync(c => c.IdCotizacion);

        return list.Select(s =>
        {
            servicios.TryGetValue(s.SkuServicio ?? string.Empty, out var srv);
            provs.TryGetValue(s.ProveedorRun ?? string.Empty, out var prov);
            Cotizacion? cot = null;
            if (s.IdCotizacion.HasValue) cots.TryGetValue(s.IdCotizacion.Value, out cot);

            PropuestaProveedorDto? propuesta = null;
            if (s.Estado is "Cotizado" or "Aceptada" or "En Ejecución" or "Completado" || !string.IsNullOrWhiteSpace(s.DetallePropuesta))
            {
                propuesta = new PropuestaProveedorDto
                {
                    Monto = s.Precio ?? (int)(srv?.PrecioActual ?? 0),
                    Plazo = s.PlazoPropuesta ?? "48 a 72 horas hábiles",
                    Validez = $"{s.ValidezDias} días corridos",
                    ValidezDias = s.ValidezDias,
                    Detalle = s.DetallePropuesta ?? "Propuesta formal emitida por el proveedor."
                };
            }

            return new CotizacionDto
            {
                Id = $"COT-{s.IdSolicitud}",
                IdSolicitud = s.IdSolicitud,
                CompradorId = s.RunUsuario ?? string.Empty,
                ProveedorId = s.ProveedorRun ?? srv?.OwnerRun ?? string.Empty,
                ServicioId = s.SkuServicio ?? string.Empty,
                ServicioNombre = srv?.Nombre ?? s.SkuServicio ?? "Servicio Profesional",
                Proveedor = prov?.NombreTienda ?? prov?.Nombre ?? "Proveedor Vento",
                PrecioReferencial = srv?.PrecioActual ?? (s.PrecioBase ?? 0),
                NombreContacto = s.NombreContacto ?? "Cliente",
                CorreoContacto = s.CorreoContacto ?? string.Empty,
                TelefonoContacto = s.TelefonoContacto ?? string.Empty,
                FechaDeseada = s.FechaPreferida ?? string.Empty,
                FechaCreacion = (cot?.Fecha ?? s.FechaInicio ?? DateOnly.FromDateTime(DateTime.Today)).ToString("yyyy-MM-dd"),
                FechaLimite = cot?.FechaLimite?.ToString("yyyy-MM-dd"),
                Detalles = s.DescripcionRequerimiento ?? string.Empty,
                Estado = s.Estado,
                PropuestaProveedor = propuesta
            };
        }).ToList();
    }
}
