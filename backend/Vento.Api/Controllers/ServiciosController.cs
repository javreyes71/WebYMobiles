using System.Security.Claims;
using System.Text.Json;
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
/// Catálogo exclusivo de Servicios Profesionales (/api/servicios), estrictamente separado de Productos.
/// Conectado a las tablas `servicio` y `vincula` de BD2.
/// </summary>
[ApiController]
[Route("api/servicios")]
public class ServiciosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CatalogoService _catalogoService;

    public ServiciosController(AppDbContext context, CatalogoService catalogoService)
    {
        _context = context;
        _catalogoService = catalogoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetServicios(
        [FromQuery] string? categoria = null,
        [FromQuery] string? modalidad = null,
        [FromQuery] string? busqueda = null,
        [FromQuery] string? proveedorId = null,
        [FromQuery] bool incluirTodos = false)
    {
        var query = _context.Servicios.AsNoTracking().AsQueryable();

        var isAdmin = User.IsInRole("Admin");
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (incluirTodos && isAdmin)
        {
            // Admin solicita el portafolio completo para moderación
        }
        else if (!string.IsNullOrWhiteSpace(proveedorId)
                 && !string.IsNullOrWhiteSpace(callerRun)
                 && string.Equals(RutValidator.ToBd2Run(proveedorId), callerRun, StringComparison.OrdinalIgnoreCase))
        {
            var targetRun = RutValidator.ToBd2Run(proveedorId);
            query = query.Where(s => s.OwnerRun == targetRun);
        }
        else
        {
            // Directorio público: SOLO servicios aprobados por Admin y visibles
            query = query.Where(s => s.EstadoModeracion == "Aprobado" && s.Visible);
            if (!string.IsNullOrWhiteSpace(proveedorId))
            {
                var targetRun = RutValidator.ToBd2Run(proveedorId);
                query = query.Where(s => s.OwnerRun == targetRun);
            }
        }

        if (!string.IsNullOrWhiteSpace(categoria) && !string.Equals(categoria, "Todos", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.CategoriaNombre == categoria);
        }

        if (!string.IsNullOrWhiteSpace(modalidad) && !string.Equals(modalidad, "Todas", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.Modalidad == modalidad);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLowerInvariant();
            query = query.Where(s =>
                (s.Nombre != null && s.Nombre.ToLower().Contains(term)) ||
                (s.Marca != null && s.Marca.ToLower().Contains(term)) ||
                s.Sku.ToLower().Contains(term));
        }

        var items = await query
            .OrderByDescending(s => s.Destacado)
            .ThenByDescending(s => s.UltimaActividad)
            .Take(120)
            .ToListAsync();

        var dtos = await _catalogoService.MapServiciosAsync(items);
        return Ok(ApiResponse<List<ServicioDto>>.Ok(dtos, "Servicios obtenidos correctamente."));
    }

    [Authorize(Roles = "ProveedorServicio,Admin")]
    [HttpGet("mis-publicaciones")]
    public async Task<IActionResult> GetMisServicios()
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var query = _context.Servicios.AsNoTracking().AsQueryable();
        if (!isAdmin)
        {
            query = query.Where(s => s.OwnerRun == callerRun);
        }

        var items = await query.OrderByDescending(s => s.UltimaActividad).Take(200).ToListAsync();
        var dtos = await _catalogoService.MapServiciosAsync(items);
        return Ok(ApiResponse<List<ServicioDto>>.Ok(dtos, "Portafolio propio obtenido."));
    }

    [HttpGet("{sku}")]
    public async Task<IActionResult> GetServicioBySku(string sku)
    {
        var srv = await _context.Servicios.AsNoTracking().FirstOrDefaultAsync(s => s.Sku == sku);
        if (srv is null)
        {
            return NotFound(ApiResponse.Fail("Servicio no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var canViewUnapproved = User.IsInRole("Admin")
            || (!string.IsNullOrWhiteSpace(callerRun) && string.Equals(srv.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase));

        if (!canViewUnapproved && srv.EstadoModeracion != "Aprobado")
        {
            return NotFound(ApiResponse.Fail("El servicio aún se encuentra en revisión o no está disponible públicamente."));
        }

        var mapped = (await _catalogoService.MapServiciosAsync(new[] { srv })).First();
        return Ok(ApiResponse<ServicioDto>.Ok(mapped, "Servicio encontrado."));
    }

    [Authorize(Roles = "ProveedorServicio,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateServicio([FromBody] ServicioCreateUpdateDto dto)
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var isAdmin = User.IsInRole("Admin");

        var ownerRun = isAdmin && !string.IsNullOrWhiteSpace(dto.OwnerId)
            ? RutValidator.ToBd2Run(dto.OwnerId)
            : callerRun;

        var owner = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == ownerRun);
        if (owner is null)
        {
            return BadRequest(ApiResponse.Fail("Proveedor inválido.", "No se encontró el proveedor titular."));
        }

        if (!isAdmin && !string.Equals(owner.EstadoAprobacion, "Aprobado", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Cuenta profesional pendiente de aprobación.",
                "Tu perfil de Proveedor de Servicios debe ser aprobado por el Administrador antes de publicar."));
        }

        var nombre = (dto.Nombre ?? dto.Title ?? string.Empty).Trim();
        var categoria = (dto.Categoria ?? "Mantención y Limpieza").Trim();
        var modalidad = (dto.Modalidad ?? "Presencial").Trim();
        var precio = dto.Precio ?? dto.Price ?? 0;

        var errors = new List<string>();
        if (nombre.Length < 3 || nombre.Length > 100)
        {
            errors.Add("El título del servicio debe tener entre 3 y 100 caracteres.");
        }
        if (precio <= 0)
        {
            errors.Add("La tarifa referencial debe ser mayor a $0 CLP.");
        }

        var sku = string.IsNullOrWhiteSpace(dto.Sku)
            ? $"VS-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1000000:D6}"
            : dto.Sku.Trim().ToUpperInvariant();

        if (sku.Length > 12)
        {
            sku = sku[..12];
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos del servicio inválidos.", errors));
        }

        if (await _context.Servicios.AnyAsync(s => s.Sku == sku))
        {
            return Conflict(ApiResponse.Fail("SKU duplicado.", $"sku: ya existe un servicio con el código {sku}."));
        }

        if (!await _context.Categorias.AnyAsync(c => c.Nombre == categoria))
        {
            _context.Categorias.Add(new Categoria { Nombre = categoria[..Math.Min(categoria.Length, 50)], Tipo = "Servicio" });
            await _context.SaveChangesAsync();
        }

        var estadoModeracion = isAdmin ? "Aprobado" : "Pendiente";
        var descuento = Math.Clamp(dto.DescuentoPorcentaje ?? 0, 0, 90);
        var attrsJson = JsonSerializer.Serialize(new
        {
            modalidad,
            incluye = dto.Incluye is { Count: > 0 }
                ? dto.Incluye
                : new List<string> { "Atención profesional certificada", "Garantía de satisfacción Vento" }
        });

        var nuevoServicio = new Servicio
        {
            Sku = sku,
            Nombre = nombre,
            Marca = (dto.Marca ?? dto.Brand ?? owner.NombreTienda ?? owner.Nombre).Trim(),
            RestriccionEdad = string.Equals(dto.RestriccionEdad, "sí", StringComparison.OrdinalIgnoreCase)
                              || string.Equals(dto.RestriccionEdad, "true", StringComparison.OrdinalIgnoreCase),
            Atributos = attrsJson,
            Tiempo = dto.TiempoHoras ?? 48,
            Visible = true,
            UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
            OwnerRun = ownerRun,
            EstadoModeracion = estadoModeracion,
            Destacado = false,
            CategoriaNombre = categoria,
            Modalidad = modalidad,
            Cobertura = (dto.Cobertura ?? "Todo Chile").Trim(),
            Garantia = (dto.Garantia ?? "Garantía profesional incluida").Trim(),
            TiempoEstimado = (dto.TiempoEstimado ?? "48 a 72 horas").Trim(),
            PermiteCotizacion = !string.Equals(dto.PermiteCotizacion, "no", StringComparison.OrdinalIgnoreCase),
            PrecioActual = precio,
            PrecioOriginal = dto.OriginalPrice ?? precio,
            DescuentoPorcentaje = descuento,
            OfertaActiva = (dto.OfertaActiva ?? false) || descuento > 0,
            ImagenPrincipal = dto.Image ?? dto.MainImage,
            Descripcion = (dto.Descripcion ?? dto.Description ?? string.Empty).Trim()
        };

        _context.Servicios.Add(nuevoServicio);
        await _context.SaveChangesAsync();

        _context.Vincula.Add(new Vincula { IdCategoria = categoria, IdServicio = sku });
        await _context.SaveChangesAsync();

        var mapped = (await _catalogoService.MapServiciosAsync(new[] { nuevoServicio })).First();
        var msg = isAdmin
            ? "Servicio creado y publicado en el directorio."
            : "Servicio creado en estado 'Pendiente'. Será visible en /servicios una vez aprobado por el Administrador.";

        return StatusCode(StatusCodes.Status201Created, ApiResponse<ServicioDto>.Ok(mapped, msg));
    }

    [Authorize(Roles = "ProveedorServicio,Admin")]
    [HttpPut("{sku}")]
    public async Task<IActionResult> UpdateServicio(string sku, [FromBody] ServicioCreateUpdateDto dto)
    {
        var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.Sku == sku);
        if (servicio is null)
        {
            return NotFound(ApiResponse.Fail("Servicio no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && !string.Equals(servicio.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Solo el proveedor titular o un Administrador pueden modificar este servicio."));
        }

        var nuevoNombre = (dto.Nombre ?? dto.Title ?? servicio.Nombre ?? string.Empty).Trim();
        var nuevoPrecio = dto.Precio ?? dto.Price ?? servicio.PrecioActual;
        var nuevaModalidad = (dto.Modalidad ?? servicio.Modalidad ?? "Presencial").Trim();
        var nuevaCobertura = (dto.Cobertura ?? servicio.Cobertura ?? "Todo Chile").Trim();
        var nuevaDesc = (dto.Descripcion ?? dto.Description ?? servicio.Descripcion ?? string.Empty).Trim();
        var nuevaImg = dto.Image ?? dto.MainImage ?? servicio.ImagenPrincipal;

        if (nuevoNombre.Length < 3 || nuevoPrecio <= 0)
        {
            return BadRequest(ApiResponse.Fail("Datos inválidos.", "Verifica título (>= 3 caracteres) y tarifa (> 0)."));
        }

        var cambioComercial =
            !string.Equals(nuevoNombre, servicio.Nombre, StringComparison.Ordinal) ||
            nuevoPrecio != servicio.PrecioActual ||
            !string.Equals(nuevaModalidad, servicio.Modalidad, StringComparison.Ordinal) ||
            !string.Equals(nuevaCobertura, servicio.Cobertura, StringComparison.Ordinal) ||
            !string.Equals(nuevaDesc, (servicio.Descripcion ?? string.Empty).Trim(), StringComparison.Ordinal) ||
            !string.Equals(nuevaImg, servicio.ImagenPrincipal, StringComparison.Ordinal);

        servicio.Nombre = nuevoNombre;
        if (dto.Marca is not null || dto.Brand is not null) servicio.Marca = (dto.Marca ?? dto.Brand)!.Trim();
        if (dto.Categoria is not null) servicio.CategoriaNombre = dto.Categoria.Trim();
        servicio.Modalidad = nuevaModalidad;
        servicio.Cobertura = nuevaCobertura;
        if (dto.Garantia is not null) servicio.Garantia = dto.Garantia.Trim();
        if (dto.TiempoEstimado is not null) servicio.TiempoEstimado = dto.TiempoEstimado.Trim();
        if (dto.PermiteCotizacion is not null)
        {
            servicio.PermiteCotizacion = !string.Equals(dto.PermiteCotizacion, "no", StringComparison.OrdinalIgnoreCase);
        }
        servicio.PrecioActual = nuevoPrecio;
        if (dto.OriginalPrice.HasValue) servicio.PrecioOriginal = dto.OriginalPrice.Value;
        servicio.ImagenPrincipal = nuevaImg;
        servicio.Descripcion = nuevaDesc;
        servicio.UltimaActividad = DateOnly.FromDateTime(DateTime.Today);

        if (dto.Incluye is { Count: > 0 })
        {
            servicio.Atributos = JsonSerializer.Serialize(new { modalidad = nuevaModalidad, incluye = dto.Incluye });
        }

        if (!isAdmin && cambioComercial)
        {
            servicio.EstadoModeracion = "Pendiente";
        }
        else if (!string.IsNullOrWhiteSpace(dto.EstadoModeracion))
        {
            if (isAdmin)
            {
                servicio.EstadoModeracion = dto.EstadoModeracion;
            }
            else if (dto.EstadoModeracion is "Pausado" or "Aprobado"
                     && servicio.EstadoModeracion is "Aprobado" or "Pausado")
            {
                servicio.EstadoModeracion = dto.EstadoModeracion;
            }
        }

        await _context.SaveChangesAsync();

        var mapped = (await _catalogoService.MapServiciosAsync(new[] { servicio })).First();
        var msg = !isAdmin && cambioComercial
            ? "Servicio actualizado y enviado nuevamente a revisión del Administrador."
            : "Servicio actualizado correctamente.";

        return Ok(ApiResponse<ServicioDto>.Ok(mapped, msg));
    }

    [Authorize(Roles = "ProveedorServicio,Admin")]
    [HttpDelete("{sku}")]
    public async Task<IActionResult> DeleteServicio(string sku)
    {
        var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.Sku == sku);
        if (servicio is null)
        {
            return NotFound(ApiResponse.Fail("Servicio no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!User.IsInRole("Admin") && !string.Equals(servicio.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Solo el proveedor titular o un Administrador pueden eliminar este servicio."));
        }

        _context.Servicios.Remove(servicio);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
