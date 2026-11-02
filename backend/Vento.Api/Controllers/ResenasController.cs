using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;
using Vento.Api.Utils;

namespace Vento.Api.Controllers;

/// <summary>
/// Reseñas y Valoraciones sobre `reseña`, `reseñar` (Productos) y `critica` (Servicios) de BD2.
/// Verifica automáticamente contra órdenes y cotizaciones reales para otorgar el sello "Compra / Servicio Verificado".
/// </summary>
[ApiController]
[Route("api/resenas")]
public class ResenasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResenasController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CrearResena([FromBody] ResenaCreateDto dto)
    {
        var sku = (dto.ItemId ?? string.Empty).Trim();
        var comentario = (dto.Comentario ?? string.Empty).Trim();

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(sku))
        {
            errors.Add("Debe indicar el SKU del producto o servicio.");
        }
        if (dto.Rating < 1 || dto.Rating > 5)
        {
            errors.Add("La calificación debe ser un número entero entre 1 y 5 estrellas.");
        }
        if (comentario.Length < 5 || comentario.Length > 800)
        {
            errors.Add("El comentario debe tener entre 5 y 800 caracteres.");
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos de reseña inválidos.", errors));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? RutValidator.ToBd2Run(dto.AutorId);
        var autor = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == callerRun);
        if (autor is null)
        {
            return Unauthorized(ApiResponse.Fail("Debes iniciar sesión con una cuenta válida para opinar."));
        }

        var esServicio = string.Equals(dto.Tipo, "Servicio", StringComparison.OrdinalIgnoreCase);
        if (!esServicio)
        {
            var existeProd = await _context.Productos.AnyAsync(p => p.Sku == sku);
            if (!existeProd)
            {
                if (await _context.Servicios.AnyAsync(s => s.Sku == sku))
                {
                    esServicio = true;
                }
                else
                {
                    return NotFound(ApiResponse.Fail("Ítem no encontrado."));
                }
            }
        }
        else if (!await _context.Servicios.AnyAsync(s => s.Sku == sku))
        {
            return NotFound(ApiResponse.Fail("Servicio no encontrado."));
        }

        // Sello automático "Compra Verificada" / "Servicio Verificado"
        var comproItem = await (
            from c in _context.Compras.AsNoTracking()
            join oi in _context.OrdenItemsWeb.AsNoTracking() on c.IdVenta equals oi.IdVenta
            where c.RunUsuario == callerRun && oi.Sku == sku
            select oi.IdItem
        ).AnyAsync();

        var completoCotizacion = esServicio && await _context.Solicitudes.AsNoTracking()
            .AnyAsync(s => s.RunUsuario == callerRun && s.SkuServicio == sku && s.Estado == "Completado");

        var verificada = comproItem || completoCotizacion;
        var nextId = (await _context.Resenas.MaxAsync(r => (int?)r.NumeroResena) ?? 5000) + 1;

        var resena = new Resena
        {
            NumeroResena = nextId,
            Puntaje = dto.Rating,
            Comentario = comentario,
            RunUsuario = callerRun,
            Fecha = DateTime.Now,
            Verificada = verificada
        };

        _context.Resenas.Add(resena);
        await _context.SaveChangesAsync();

        if (esServicio)
        {
            _context.Criticas.Add(new Critica
            {
                IdResena = nextId,
                IdUsuario = callerRun,
                IdServicio = sku
            });
        }
        else
        {
            _context.Resenar.Add(new Resenar
            {
                IdResena = nextId,
                IdUsuario = callerRun,
                IdProducto = sku
            });
        }

        await _context.SaveChangesAsync();

        var responseDto = new ResenaItemDto
        {
            Id = nextId.ToString(),
            Autor = autor.Nombre,
            AutorId = callerRun,
            Verificada = verificada,
            Fecha = resena.Fecha.ToString("dd MMM yyyy"),
            Rating = resena.Puntaje,
            Comentario = comentario
        };

        return StatusCode(StatusCodes.Status201Created, ApiResponse<ResenaItemDto>.Ok(
            responseDto,
            verificada ? "Reseña publicada con sello de Compra/Servicio Verificado." : "Reseña publicada correctamente."));
    }
}
