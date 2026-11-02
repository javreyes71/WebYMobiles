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
/// Catálogo exclusivo de Productos Físicos (/api/productos), estrictamente separado de Servicios.
/// Conectado a las tablas `producto`, `stock`, `caracteristicas`, `contiene`, `vende` y `pertenece` de BD2.
/// </summary>
[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CatalogoService _catalogoService;

    public ProductosController(AppDbContext context, CatalogoService catalogoService)
    {
        _context = context;
        _catalogoService = catalogoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProductos(
        [FromQuery] string? categoria = null,
        [FromQuery] string? busqueda = null,
        [FromQuery] string? vendedorId = null,
        [FromQuery] bool incluirTodos = false)
    {
        var query = _context.Productos.AsNoTracking().AsQueryable();

        var isAdmin = User.IsInRole("Admin");
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (incluirTodos && isAdmin)
        {
            // Admin solicita el catálogo completo para moderación
        }
        else if (!string.IsNullOrWhiteSpace(vendedorId)
                 && !string.IsNullOrWhiteSpace(callerRun)
                 && string.Equals(RutValidator.ToBd2Run(vendedorId), callerRun, StringComparison.OrdinalIgnoreCase))
        {
            var targetRun = RutValidator.ToBd2Run(vendedorId);
            query = query.Where(p => p.OwnerRun == targetRun);
        }
        else
        {
            // Catálogo público: SOLO ítems aprobados por Admin y visibles (trg_03 / trg_11 de BD2)
            query = query.Where(p => p.EstadoModeracion == "Aprobado" && p.Visible);
            if (!string.IsNullOrWhiteSpace(vendedorId))
            {
                var targetRun = RutValidator.ToBd2Run(vendedorId);
                query = query.Where(p => p.OwnerRun == targetRun);
            }
        }

        if (!string.IsNullOrWhiteSpace(categoria) && !string.Equals(categoria, "Todos", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.CategoriaNombre == categoria);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var term = busqueda.Trim().ToLowerInvariant();
            query = query.Where(p =>
                (p.Nombre != null && p.Nombre.ToLower().Contains(term)) ||
                (p.Marca != null && p.Marca.ToLower().Contains(term)) ||
                p.Sku.ToLower().Contains(term));
        }

        var items = await query
            .OrderByDescending(p => p.Destacado)
            .ThenByDescending(p => p.UltimaActividad)
            .Take(120)
            .ToListAsync();

        var dtos = await _catalogoService.MapProductosAsync(items);
        return Ok(ApiResponse<List<ProductoDto>>.Ok(dtos, "Productos obtenidos correctamente."));
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpGet("mis-publicaciones")]
    public async Task<IActionResult> GetMisProductos()
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var query = _context.Productos.AsNoTracking().AsQueryable();
        if (!isAdmin)
        {
            query = query.Where(p => p.OwnerRun == callerRun);
        }

        var items = await query.OrderByDescending(p => p.UltimaActividad).Take(200).ToListAsync();
        var dtos = await _catalogoService.MapProductosAsync(items);
        return Ok(ApiResponse<List<ProductoDto>>.Ok(dtos, "Inventario propio obtenido."));
    }

    [HttpGet("{sku}")]
    public async Task<IActionResult> GetProductoBySku(string sku)
    {
        var prod = await _context.Productos.AsNoTracking().FirstOrDefaultAsync(p => p.Sku == sku);
        if (prod is null)
        {
            return NotFound(ApiResponse.Fail("Producto no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var canViewUnapproved = User.IsInRole("Admin")
            || (!string.IsNullOrWhiteSpace(callerRun) && string.Equals(prod.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase));

        if (!canViewUnapproved && prod.EstadoModeracion != "Aprobado")
        {
            return NotFound(ApiResponse.Fail("El producto aún se encuentra en revisión o no está disponible públicamente."));
        }

        var mapped = (await _catalogoService.MapProductosAsync(new[] { prod })).First();
        return Ok(ApiResponse<ProductoDto>.Ok(mapped, "Producto encontrado."));
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateProducto([FromBody] ProductoCreateUpdateDto dto)
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var isAdmin = User.IsInRole("Admin");

        var ownerRun = isAdmin && !string.IsNullOrWhiteSpace(dto.OwnerId)
            ? RutValidator.ToBd2Run(dto.OwnerId)
            : callerRun;

        var owner = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == ownerRun);
        if (owner is null)
        {
            return BadRequest(ApiResponse.Fail("Vendedor inválido.", "No se encontró el titular de la publicación."));
        }

        // Regla de Moderación Previa Estricta de Cuenta Comercial
        if (!isAdmin && !string.Equals(owner.EstadoAprobacion, "Aprobado", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Cuenta comercial pendiente de aprobación.",
                "Tu perfil de Vendedor de Productos debe ser aprobado por el Administrador antes de publicar."));
        }

        var nombre = (dto.Nombre ?? dto.Title ?? string.Empty).Trim();
        var marca = (dto.Marca ?? dto.Brand ?? "Genérico").Trim();
        var categoria = (dto.Categoria ?? "Zapatos").Trim();
        var precio = dto.Precio ?? dto.Price ?? 0;
        var stock = dto.Stock ?? 0;

        var errors = new List<string>();
        if (nombre.Length < 3 || nombre.Length > 100)
        {
            errors.Add("El nombre del producto debe tener entre 3 y 100 caracteres.");
        }
        if (precio <= 0)
        {
            errors.Add("El precio del producto debe ser mayor a $0 CLP.");
        }
        if (stock < 0)
        {
            errors.Add("El stock inicial no puede ser negativo (restricción chk_stock_cantidad_valida de BD2).");
        }

        var sku = string.IsNullOrWhiteSpace(dto.Sku)
            ? $"VP-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1000000:D6}"
            : dto.Sku.Trim().ToUpperInvariant();

        if (sku.Length > 12)
        {
            sku = sku[..12];
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos del producto inválidos.", errors));
        }

        if (await _context.Productos.AnyAsync(p => p.Sku == sku))
        {
            return Conflict(ApiResponse.Fail("SKU duplicado.", $"sku: ya existe un producto con el código {sku}."));
        }

        var estadoModeracion = isAdmin ? "Aprobado" : "Pendiente";
        var descuento = Math.Clamp(dto.DescuentoPorcentaje ?? 0, 0, 90);
        var attrsJson = JsonSerializer.Serialize(new
        {
            peso = dto.Peso ?? 0.8,
            tallas = dto.Tallas is { Count: > 0 } ? dto.Tallas : new List<string> { "Única" },
            colores = dto.Colores is { Count: > 0 } ? dto.Colores : new List<string> { "Estándar" },
            genero = dto.Genero ?? "Unisex"
        });

        await using var tx = await _context.Database.BeginTransactionAsync();

        if (!await _context.Categorias.AnyAsync(c => c.Nombre == categoria))
        {
            _context.Categorias.Add(new Categoria { Nombre = categoria[..Math.Min(categoria.Length, 50)], Tipo = "Producto" });
            await _context.SaveChangesAsync();
        }

        var stockId = await _catalogoService.NextStockIdAsync();
        _context.Stocks.Add(new Stock { IdStock = stockId, Cantidad = stock });
        _context.Caracteristicas.Add(new Caracteristicas
        {
            IdCaracteristicas = stockId,
            Atributos = attrsJson,
            IdStock = stockId
        });

        var nuevoProducto = new Producto
        {
            Sku = sku,
            Nombre = nombre,
            Marca = marca[..Math.Min(marca.Length, 50)],
            RestriccionEdad = string.Equals(dto.RestriccionEdad, "sí", StringComparison.OrdinalIgnoreCase)
                              || string.Equals(dto.RestriccionEdad, "true", StringComparison.OrdinalIgnoreCase),
            Atributos = attrsJson,
            Visible = stock > 0,
            UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
            OwnerRun = ownerRun,
            EstadoModeracion = estadoModeracion,
            Destacado = false,
            CategoriaNombre = categoria,
            Genero = dto.Genero ?? "Unisex",
            PrecioActual = precio,
            PrecioOriginal = dto.OriginalPrice ?? (descuento > 0 ? Math.Round(precio / (1m - descuento / 100m), 0) : precio),
            DescuentoPorcentaje = descuento,
            OfertaActiva = (dto.OfertaActiva ?? false) || descuento > 0,
            StockActual = stock,
            ImagenPrincipal = dto.Image ?? dto.MainImage,
            Descripcion = (dto.Descripcion ?? dto.Description ?? string.Empty).Trim()
        };

        _context.Productos.Add(nuevoProducto);
        await _context.SaveChangesAsync();

        _context.Contiene.Add(new Contiene { IdCaracteristicas = stockId, SkuProducto = sku });
        _context.Vende.Add(new Vende
        {
            IdUsuario = ownerRun,
            IdProducto = sku,
            IdCaracteristicas = stockId,
            Precio = precio
        });
        _context.Pertenece.Add(new Pertenece { NombreCategoria = categoria, IdProducto = sku });

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var createdDto = (await _catalogoService.MapProductosAsync(new[] { nuevoProducto })).First();
        var msg = isAdmin
            ? "Producto creado y publicado en la tienda."
            : "Producto creado en estado 'Pendiente'. Será visible en /tienda una vez aprobado por el Administrador.";

        return StatusCode(StatusCodes.Status201Created, ApiResponse<ProductoDto>.Ok(createdDto, msg));
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpPut("{sku}")]
    public async Task<IActionResult> UpdateProducto(string sku, [FromBody] ProductoCreateUpdateDto dto)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Sku == sku);
        if (producto is null)
        {
            return NotFound(ApiResponse.Fail("Producto no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        // Control estricto de propiedad por ownerRun (Brecha B2)
        if (!isAdmin && !string.Equals(producto.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Solo el vendedor propietario o un Administrador pueden editar este producto."));
        }

        var nuevoNombre = (dto.Nombre ?? dto.Title ?? producto.Nombre ?? string.Empty).Trim();
        var nuevaMarca = (dto.Marca ?? dto.Brand ?? producto.Marca ?? string.Empty).Trim();
        var nuevaCategoria = (dto.Categoria ?? producto.CategoriaNombre ?? "Zapatos").Trim();
        var nuevoPrecio = dto.Precio ?? dto.Price ?? producto.PrecioActual;
        var nuevaDesc = dto.Descripcion ?? dto.Description ?? producto.Descripcion ?? string.Empty;
        var nuevaImg = dto.Image ?? dto.MainImage ?? producto.ImagenPrincipal;
        var nuevoStock = dto.Stock ?? producto.StockActual;

        if (nuevoNombre.Length < 3 || nuevoPrecio <= 0 || nuevoStock < 0)
        {
            return BadRequest(ApiResponse.Fail(
                "Datos inválidos.",
                "Verifica nombre (>= 3 caracteres), precio (> 0) y stock (>= 0)."));
        }

        // Regla confirmada: cambios en contenido comercial público vuelven a 'Pendiente';
        // ajustes exclusivos de stock o pausar/reactivar se aplican sin re-aprobación.
        var cambioContenidoComercial =
            !string.Equals(nuevoNombre, producto.Nombre, StringComparison.Ordinal) ||
            !string.Equals(nuevaMarca, producto.Marca, StringComparison.Ordinal) ||
            nuevoPrecio != producto.PrecioActual ||
            !string.Equals(nuevaDesc.Trim(), (producto.Descripcion ?? string.Empty).Trim(), StringComparison.Ordinal) ||
            !string.Equals(nuevaImg, producto.ImagenPrincipal, StringComparison.Ordinal);

        producto.Nombre = nuevoNombre;
        producto.Marca = nuevaMarca[..Math.Min(nuevaMarca.Length, 50)];
        producto.CategoriaNombre = nuevaCategoria;
        if (dto.Genero is not null) producto.Genero = dto.Genero;
        producto.PrecioActual = nuevoPrecio;
        if (dto.OriginalPrice.HasValue) producto.PrecioOriginal = dto.OriginalPrice.Value;
        if (dto.DescuentoPorcentaje.HasValue)
        {
            producto.DescuentoPorcentaje = Math.Clamp(dto.DescuentoPorcentaje.Value, 0, 90);
            producto.OfertaActiva = producto.DescuentoPorcentaje > 0;
        }
        producto.StockActual = nuevoStock;
        producto.ImagenPrincipal = nuevaImg;
        producto.Descripcion = nuevaDesc.Trim();
        producto.UltimaActividad = DateOnly.FromDateTime(DateTime.Today);

        if (!isAdmin && cambioContenidoComercial)
        {
            producto.EstadoModeracion = "Pendiente";
        }
        else if (!string.IsNullOrWhiteSpace(dto.EstadoModeracion))
        {
            if (isAdmin)
            {
                producto.EstadoModeracion = dto.EstadoModeracion;
            }
            else if (dto.EstadoModeracion is "Pausado" or "Aprobado"
                     && producto.EstadoModeracion is "Aprobado" or "Pausado")
            {
                producto.EstadoModeracion = dto.EstadoModeracion;
            }
        }

        // Sincronizar stock real en tablas `stock` y `vende` de BD2 (activa trg_08 alerta < 10 y trg_11 visibilidad = 0)
        var carRel = await (
            from c in _context.Contiene
            join ca in _context.Caracteristicas on c.IdCaracteristicas equals ca.IdCaracteristicas
            where c.SkuProducto == sku
            select ca
        ).FirstOrDefaultAsync();

        if (carRel?.IdStock is not null)
        {
            var stockRow = await _context.Stocks.FirstOrDefaultAsync(s => s.IdStock == carRel.IdStock);
            if (stockRow is not null)
            {
                stockRow.Cantidad = nuevoStock;
            }
        }

        var vendeRow = await _context.Vende.FirstOrDefaultAsync(v => v.IdProducto == sku);
        if (vendeRow is not null)
        {
            vendeRow.Precio = nuevoPrecio;
        }

        await _context.SaveChangesAsync();

        var mapped = (await _catalogoService.MapProductosAsync(new[] { producto })).First();
        var msg = !isAdmin && cambioContenidoComercial
            ? "Producto actualizado y enviado nuevamente a revisión del Administrador."
            : "Producto actualizado correctamente.";

        return Ok(ApiResponse<ProductoDto>.Ok(mapped, msg));
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpPatch("{sku}/stock")]
    public async Task<IActionResult> UpdateStockDirecto(string sku, [FromBody] StockPatchDto dto)
    {
        if (dto.Stock < 0)
        {
            return BadRequest(ApiResponse.Fail("Stock inválido.", "La cantidad en inventario no puede ser negativa."));
        }

        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Sku == sku);
        if (producto is null)
        {
            return NotFound(ApiResponse.Fail("Producto no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!User.IsInRole("Admin") && !string.Equals(producto.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail("No tienes permiso sobre este inventario."));
        }

        producto.StockActual = dto.Stock;
        producto.Visible = dto.Stock > 0;

        var stockId = await (
            from c in _context.Contiene
            join ca in _context.Caracteristicas on c.IdCaracteristicas equals ca.IdCaracteristicas
            where c.SkuProducto == sku
            select ca.IdStock
        ).FirstOrDefaultAsync();

        if (stockId.HasValue)
        {
            var stockEntity = await _context.Stocks.FirstOrDefaultAsync(s => s.IdStock == stockId.Value);
            if (stockEntity is not null)
            {
                stockEntity.Cantidad = dto.Stock;
            }
        }

        await _context.SaveChangesAsync();

        var mapped = (await _catalogoService.MapProductosAsync(new[] { producto })).First();
        return Ok(ApiResponse<ProductoDto>.Ok(mapped, "Stock actualizado inmediatamente sin requerir re-aprobación."));
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpDelete("{sku}")]
    public async Task<IActionResult> DeleteProducto(string sku)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Sku == sku);
        if (producto is null)
        {
            return NotFound(ApiResponse.Fail("Producto no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!User.IsInRole("Admin") && !string.Equals(producto.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Solo el vendedor propietario o un Administrador pueden eliminar este producto."));
        }

        _context.Productos.Remove(producto);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
