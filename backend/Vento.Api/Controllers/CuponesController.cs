using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;

namespace Vento.Api.Controllers;

[ApiController]
[Route("api/cupones")]
public class CuponesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CuponesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCupones([FromQuery] bool incluirInactivos = false)
    {
        var query = _context.Cupones.AsNoTracking().AsQueryable();
        if (!incluirInactivos || !User.IsInRole("Admin"))
        {
            query = query.Where(c => c.Activo);
        }

        var items = await query.OrderByDescending(c => c.FechaCreacion).ToListAsync();
        var dtos = items.Select(MapCupon).ToList();
        return Ok(ApiResponse<object>.Ok(dtos, "Cupones promocionales obtenidos."));
    }

    [HttpGet("validar/{codigo}")]
    public async Task<IActionResult> ValidarCupon(string codigo, [FromQuery] decimal subtotal = 0)
    {
        var code = codigo.Trim().ToUpperInvariant();
        var cupon = await _context.Cupones.AsNoTracking().FirstOrDefaultAsync(c => c.Codigo == code);
        if (cupon is null || !cupon.Activo)
        {
            return NotFound(ApiResponse.Fail("Cupón inválido o inactivo."));
        }

        if (subtotal > 0 && subtotal < cupon.MinimoCompra)
        {
            return BadRequest(ApiResponse.Fail(
                "Mínimo de compra insuficiente.",
                $"Este cupón requiere un subtotal mínimo de ${cupon.MinimoCompra:N0} CLP."));
        }

        return Ok(ApiResponse<object>.Ok(MapCupon(cupon), "Cupón válido y aplicable."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CrearCupon([FromBody] CuponCreateUpdateDto dto)
    {
        var code = (dto.Code ?? dto.Codigo ?? string.Empty).Trim().ToUpperInvariant();
        if (code.Length < 3 || code.Length > 40)
        {
            return BadRequest(ApiResponse.Fail("Código inválido.", "El código del cupón debe tener entre 3 y 40 caracteres."));
        }

        if (await _context.Cupones.AnyAsync(c => c.Codigo == code))
        {
            return Conflict(ApiResponse.Fail("Cupón duplicado.", $"Ya existe un cupón con el código '{code}'."));
        }

        var tipo = (dto.Tipo ?? "porcentaje").Trim().ToLowerInvariant();
        if (tipo is not ("porcentaje" or "fijo" or "envio"))
        {
            return BadRequest(ApiResponse.Fail("Tipo inválido.", "El tipo debe ser 'porcentaje', 'fijo' o 'envio'."));
        }

        var valor = dto.Valor ?? (dto.Rate.HasValue ? Math.Round(dto.Rate.Value * 100m, 0) : 0m);
        if (valor <= 0 || (tipo == "porcentaje" && valor > 90))
        {
            return BadRequest(ApiResponse.Fail("Valor inválido.", "Revisa el porcentaje (1-90%) o monto de descuento."));
        }

        var nuevo = new Cupon
        {
            Codigo = code,
            Tipo = tipo,
            Valor = valor,
            MinimoCompra = Math.Max(0, dto.MinimoCompra ?? 0),
            Activo = dto.Active ?? dto.Activo ?? true,
            Descripcion = (dto.Label ?? dto.Descripcion ?? $"{valor}% OFF Cupón Vento").Trim(),
            FechaCreacion = DateTime.Now
        };

        _context.Cupones.Add(nuevo);
        await _context.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ApiResponse<object>.Ok(MapCupon(nuevo), "Cupón creado correctamente."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{codigo}")]
    public async Task<IActionResult> ActualizarCupon(string codigo, [FromBody] CuponCreateUpdateDto dto)
    {
        var code = codigo.Trim().ToUpperInvariant();
        var cupon = await _context.Cupones.FirstOrDefaultAsync(c => c.Codigo == code);
        if (cupon is null)
        {
            return NotFound(ApiResponse.Fail("Cupón no encontrado."));
        }

        if (dto.Active.HasValue || dto.Activo.HasValue)
        {
            cupon.Activo = dto.Active ?? dto.Activo!.Value;
        }
        if (dto.Valor.HasValue && dto.Valor.Value > 0) cupon.Valor = dto.Valor.Value;
        else if (dto.Rate.HasValue && dto.Rate.Value > 0) cupon.Valor = Math.Round(dto.Rate.Value * 100m, 0);
        if (dto.MinimoCompra.HasValue && dto.MinimoCompra.Value >= 0) cupon.MinimoCompra = dto.MinimoCompra.Value;
        if (!string.IsNullOrWhiteSpace(dto.Label) || !string.IsNullOrWhiteSpace(dto.Descripcion))
        {
            cupon.Descripcion = (dto.Label ?? dto.Descripcion)!.Trim();
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(MapCupon(cupon), "Cupón actualizado correctamente."));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{codigo}")]
    public async Task<IActionResult> EliminarCupon(string codigo)
    {
        var code = codigo.Trim().ToUpperInvariant();
        var cupon = await _context.Cupones.FirstOrDefaultAsync(c => c.Codigo == code);
        if (cupon is null)
        {
            return NotFound(ApiResponse.Fail("Cupón no encontrado."));
        }

        _context.Cupones.Remove(cupon);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static object MapCupon(Cupon c) => new
    {
        code = c.Codigo,
        codigo = c.Codigo,
        tipo = c.Tipo,
        valor = c.Valor,
        rate = c.Tipo == "porcentaje" ? c.Valor / 100m : 0m,
        minimoCompra = c.MinimoCompra,
        active = c.Activo,
        activo = c.Activo,
        label = c.Descripcion ?? c.Codigo,
        descripcion = c.Descripcion ?? c.Codigo
    };
}
