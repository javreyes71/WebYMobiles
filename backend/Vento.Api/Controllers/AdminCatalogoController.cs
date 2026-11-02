using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Services;

namespace Vento.Api.Controllers;

/// <summary>
/// Cola de Moderación Estricta y Destacados del Administrador General (`Admin`),
/// manteniendo separación explícita entre Productos Físicos y Servicios Profesionales.
/// </summary>
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/catalogo")]
public class AdminCatalogoController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CatalogoService _catalogoService;

    public AdminCatalogoController(AppDbContext context, CatalogoService catalogoService)
    {
        _context = context;
        _catalogoService = catalogoService;
    }

    [HttpGet("pendientes")]
    public async Task<IActionResult> GetColaModeracion()
    {
        var productosPendientes = await _context.Productos.AsNoTracking()
            .Where(p => p.EstadoModeracion == "Pendiente")
            .OrderByDescending(p => p.UltimaActividad)
            .ToListAsync();

        var serviciosPendientes = await _context.Servicios.AsNoTracking()
            .Where(s => s.EstadoModeracion == "Pendiente")
            .OrderByDescending(s => s.UltimaActividad)
            .ToListAsync();

        var payload = new
        {
            productos = await _catalogoService.MapProductosAsync(productosPendientes),
            servicios = await _catalogoService.MapServiciosAsync(serviciosPendientes)
        };

        return Ok(ApiResponse<object>.Ok(payload, "Cola de moderación obtenida."));
    }

    [HttpPatch("productos/{sku}/moderacion")]
    public async Task<IActionResult> ModerarProducto(string sku, [FromBody] ModeracionItemDto dto)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Sku == sku);
        if (producto is null)
        {
            return NotFound(ApiResponse.Fail("Producto no encontrado."));
        }

        if (!string.IsNullOrWhiteSpace(dto.EstadoModeracion))
        {
            if (dto.EstadoModeracion is not ("Aprobado" or "Rechazado" or "Pendiente" or "Pausado"))
            {
                return BadRequest(ApiResponse.Fail("Estado de moderación inválido."));
            }

            producto.EstadoModeracion = dto.EstadoModeracion;
            producto.MotivoRechazo = dto.EstadoModeracion == "Rechazado"
                ? (string.IsNullOrWhiteSpace(dto.MotivoRechazo) ? "Publicación observada por Moderación." : dto.MotivoRechazo.Trim())
                : null;
        }

        if (dto.Destacado.HasValue)
        {
            producto.Destacado = dto.Destacado.Value;
        }

        await _context.SaveChangesAsync();

        var mapped = (await _catalogoService.MapProductosAsync(new[] { producto })).First();
        return Ok(ApiResponse<ProductoDto>.Ok(mapped, $"Moderación de producto actualizada a '{producto.EstadoModeracion}'."));
    }

    [HttpPatch("servicios/{sku}/moderacion")]
    public async Task<IActionResult> ModerarServicio(string sku, [FromBody] ModeracionItemDto dto)
    {
        var servicio = await _context.Servicios.FirstOrDefaultAsync(s => s.Sku == sku);
        if (servicio is null)
        {
            return NotFound(ApiResponse.Fail("Servicio no encontrado."));
        }

        if (!string.IsNullOrWhiteSpace(dto.EstadoModeracion))
        {
            if (dto.EstadoModeracion is not ("Aprobado" or "Rechazado" or "Pendiente" or "Pausado"))
            {
                return BadRequest(ApiResponse.Fail("Estado de moderación inválido."));
            }

            servicio.EstadoModeracion = dto.EstadoModeracion;
            servicio.MotivoRechazo = dto.EstadoModeracion == "Rechazado"
                ? (string.IsNullOrWhiteSpace(dto.MotivoRechazo) ? "Servicio observado por Moderación." : dto.MotivoRechazo.Trim())
                : null;
        }

        if (dto.Destacado.HasValue)
        {
            servicio.Destacado = dto.Destacado.Value;
        }

        await _context.SaveChangesAsync();

        var mapped = (await _catalogoService.MapServiciosAsync(new[] { servicio })).First();
        return Ok(ApiResponse<ServicioDto>.Ok(mapped, $"Moderación de servicio actualizada a '{servicio.EstadoModeracion}'."));
    }
}
