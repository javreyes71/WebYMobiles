using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;

namespace Vento.Api.Services;

public class CatalogoService
{
    private readonly AppDbContext _context;

    public CatalogoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> NextStockIdAsync()
    {
        var maxStock = await _context.Stocks.MaxAsync(s => (int?)s.IdStock) ?? 5000;
        var maxCar = await _context.Caracteristicas.MaxAsync(c => (int?)c.IdCaracteristicas) ?? 5000;
        return Math.Max(Math.Max(maxStock, maxCar), 5000) + 1;
    }

    public async Task<List<ProductoDto>> MapProductosAsync(IEnumerable<Producto> productos)
    {
        var list = productos.ToList();
        if (list.Count == 0) return new List<ProductoDto>();

        var ownerRuns = list.Where(p => !string.IsNullOrWhiteSpace(p.OwnerRun)).Select(p => p.OwnerRun!).Distinct().ToList();
        var owners = await _context.Usuarios.AsNoTracking()
            .Where(u => ownerRuns.Contains(u.Run))
            .ToDictionaryAsync(u => u.Run);

        var skus = list.Select(p => p.Sku).ToList();
        var stockLookup = await (
            from c in _context.Contiene.AsNoTracking()
            join ca in _context.Caracteristicas.AsNoTracking() on c.IdCaracteristicas equals ca.IdCaracteristicas
            join s in _context.Stocks.AsNoTracking() on ca.IdStock equals s.IdStock
            where skus.Contains(c.SkuProducto)
            select new { c.SkuProducto, s.Cantidad }
        ).ToListAsync();

        var stockBySku = stockLookup
            .GroupBy(x => x.SkuProducto)
            .ToDictionary(g => g.Key, g => g.First().Cantidad);

        var reviewsRaw = await (
            from rel in _context.Resenar.AsNoTracking()
            join res in _context.Resenas.AsNoTracking() on rel.IdResena equals res.NumeroResena
            join u in _context.Usuarios.AsNoTracking() on rel.IdUsuario equals u.Run into uj
            from u in uj.DefaultIfEmpty()
            where skus.Contains(rel.IdProducto)
            orderby res.Fecha descending
            select new
            {
                rel.IdProducto,
                Review = new ResenaItemDto
                {
                    Id = res.NumeroResena.ToString(),
                    Autor = u != null ? u.Nombre : rel.IdUsuario,
                    AutorId = rel.IdUsuario,
                    Verificada = res.Verificada,
                    Fecha = res.Fecha.ToString("dd MMM yyyy"),
                    Rating = res.Puntaje,
                    Comentario = res.Comentario ?? string.Empty
                }
            }
        ).ToListAsync();

        var reviewsBySku = reviewsRaw
            .GroupBy(x => x.IdProducto)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Review).Take(20).ToList());

        return list.Select(p =>
        {
            owners.TryGetValue(p.OwnerRun ?? string.Empty, out var owner);
            var stock = stockBySku.TryGetValue(p.Sku, out var st) ? st : p.StockActual;
            var revs = reviewsBySku.TryGetValue(p.Sku, out var rList) ? rList : new List<ResenaItemDto>();
            var avgRating = revs.Count > 0 ? Math.Round(revs.Average(r => r.Rating), 1) : 4.8;

            var (tallas, colores) = ParseProductoAtributos(p.Atributos);
            var img = string.IsNullOrWhiteSpace(p.ImagenPrincipal)
                ? CreateSvgPlaceholder(p.Nombre ?? p.Sku, p.Marca ?? "Vento Tienda", "#3b82f6", "#1e293b")
                : p.ImagenPrincipal;

            var vendedorNombre = owner is not null
                ? (!string.IsNullOrWhiteSpace(owner.NombreTienda) ? owner.NombreTienda : owner.Nombre)
                : "Vento Marketplace";

            return new ProductoDto
            {
                Id = p.Sku,
                Sku = p.Sku,
                Tipo = "Producto",
                OwnerId = p.OwnerRun ?? string.Empty,
                VendedorId = p.OwnerRun ?? string.Empty,
                VendedorNombre = vendedorNombre,
                VendedorTipo = owner?.Rol == "Admin" ? "Empresa" : "Emprendedor",
                Verificado = owner?.Verificado ?? false,
                EstadoModeracion = p.EstadoModeracion,
                AprobadoPorAdmin = p.EstadoModeracion == "Aprobado",
                MotivoRechazo = p.MotivoRechazo,
                Destacado = p.Destacado,
                Nombre = p.Nombre ?? p.Sku,
                Title = p.Nombre ?? p.Sku,
                Marca = p.Marca ?? "Genérico",
                Brand = p.Marca ?? "Genérico",
                Categoria = p.CategoriaNombre ?? "Zapatos",
                Genero = p.Genero ?? "Unisex",
                Precio = p.PrecioActual,
                Price = p.PrecioActual,
                OriginalPrice = p.PrecioOriginal,
                DescuentoPorcentaje = p.DescuentoPorcentaje,
                OfertaActiva = p.OfertaActiva,
                FreeShipping = p.PrecioActual >= 50000,
                Stock = stock,
                Visible = p.Visible,
                RestriccionEdad = p.RestriccionEdad == true ? "sí" : "no",
                Tallas = tallas,
                Colores = colores,
                Rating = avgRating,
                Image = img,
                MainImage = img,
                Thumbnails = new List<string> { img },
                Descripcion = p.Descripcion ?? $"Artículo {p.Nombre} disponible en Vento Marketplace.",
                Description = p.Descripcion ?? $"Artículo {p.Nombre} disponible en Vento Marketplace.",
                Reviews = revs
            };
        }).ToList();
    }

    public async Task<List<ServicioDto>> MapServiciosAsync(IEnumerable<Servicio> servicios)
    {
        var list = servicios.ToList();
        if (list.Count == 0) return new List<ServicioDto>();

        var ownerRuns = list.Where(s => !string.IsNullOrWhiteSpace(s.OwnerRun)).Select(s => s.OwnerRun!).Distinct().ToList();
        var owners = await _context.Usuarios.AsNoTracking()
            .Where(u => ownerRuns.Contains(u.Run))
            .ToDictionaryAsync(u => u.Run);

        var skus = list.Select(s => s.Sku).ToList();
        var reviewsRaw = await (
            from rel in _context.Criticas.AsNoTracking()
            join res in _context.Resenas.AsNoTracking() on rel.IdResena equals res.NumeroResena
            join u in _context.Usuarios.AsNoTracking() on rel.IdUsuario equals u.Run into uj
            from u in uj.DefaultIfEmpty()
            where skus.Contains(rel.IdServicio)
            orderby res.Fecha descending
            select new
            {
                rel.IdServicio,
                Review = new ResenaItemDto
                {
                    Id = res.NumeroResena.ToString(),
                    Autor = u != null ? u.Nombre : rel.IdUsuario,
                    AutorId = rel.IdUsuario,
                    Verificada = res.Verificada,
                    Fecha = res.Fecha.ToString("dd MMM yyyy"),
                    Rating = res.Puntaje,
                    Comentario = res.Comentario ?? string.Empty
                }
            }
        ).ToListAsync();

        var reviewsBySku = reviewsRaw
            .GroupBy(x => x.IdServicio)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Review).Take(20).ToList());

        return list.Select(s =>
        {
            owners.TryGetValue(s.OwnerRun ?? string.Empty, out var owner);
            var revs = reviewsBySku.TryGetValue(s.Sku, out var rList) ? rList : new List<ResenaItemDto>();
            var avgRating = revs.Count > 0 ? Math.Round(revs.Average(r => r.Rating), 1) : 4.9;
            var incluye = ParseServicioIncluye(s.Atributos);

            var img = string.IsNullOrWhiteSpace(s.ImagenPrincipal)
                ? CreateSvgPlaceholder(s.Nombre ?? s.Sku, s.Modalidad ?? "Servicio Profesional", "#38bdf8", "#0c4a6e")
                : s.ImagenPrincipal;

            var proveedorNombre = owner is not null
                ? (!string.IsNullOrWhiteSpace(owner.NombreTienda) ? owner.NombreTienda : owner.Nombre)
                : "Proveedor Verificado Vento";

            return new ServicioDto
            {
                Id = s.Sku,
                Sku = s.Sku,
                Tipo = "Servicio",
                OwnerId = s.OwnerRun ?? string.Empty,
                ProveedorId = s.OwnerRun ?? string.Empty,
                VendedorNombre = proveedorNombre,
                VendedorTipo = owner?.Rol == "Admin" ? "Empresa" : "Emprendedor",
                Verificado = owner?.Verificado ?? false,
                EstadoModeracion = s.EstadoModeracion,
                AprobadoPorAdmin = s.EstadoModeracion == "Aprobado",
                MotivoRechazo = s.MotivoRechazo,
                Destacado = s.Destacado,
                Nombre = s.Nombre ?? s.Sku,
                Title = s.Nombre ?? s.Sku,
                Marca = s.Marca ?? proveedorNombre,
                Brand = s.Marca ?? proveedorNombre,
                Categoria = s.CategoriaNombre ?? "Mantención y Limpieza",
                Modalidad = s.Modalidad ?? "Presencial",
                Cobertura = s.Cobertura ?? "Todo Chile",
                Garantia = s.Garantia ?? "Garantía profesional incluida",
                TiempoEstimado = s.TiempoEstimado ?? (s.Tiempo.HasValue ? $"{s.Tiempo.Value} horas" : "48 a 72 horas"),
                PermiteCotizacion = s.PermiteCotizacion ? "sí" : "no",
                Precio = s.PrecioActual,
                Price = s.PrecioActual,
                OriginalPrice = s.PrecioOriginal,
                DescuentoPorcentaje = s.DescuentoPorcentaje,
                OfertaActiva = s.OfertaActiva,
                Visible = s.Visible,
                RestriccionEdad = s.RestriccionEdad == true ? "sí" : "no",
                Incluye = incluye,
                Rating = avgRating,
                Image = img,
                MainImage = img,
                Thumbnails = new List<string>(),
                Descripcion = s.Descripcion ?? $"Servicio profesional {s.Nombre}.",
                Description = s.Descripcion ?? $"Servicio profesional {s.Nombre}.",
                Reviews = revs
            };
        }).ToList();
    }

    private static (List<string> tallas, List<string> colores) ParseProductoAtributos(string? json)
    {
        var tallas = new List<string>();
        var colores = new List<string>();
        if (string.IsNullOrWhiteSpace(json)) return (new List<string> { "Única" }, new List<string> { "Estándar" });

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.TryGetProperty("tallas", out var tallasEl) && tallasEl.ValueKind == JsonValueKind.Array)
            {
                tallas.AddRange(tallasEl.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => x.Length > 0));
            }
            else if (root.TryGetProperty("talla", out var tallaSingle) && tallaSingle.ValueKind == JsonValueKind.String)
            {
                tallas.Add(tallaSingle.GetString()!);
            }

            if (root.TryGetProperty("colores", out var colEl) && colEl.ValueKind == JsonValueKind.Array)
            {
                colores.AddRange(colEl.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => x.Length > 0));
            }
            else if (root.TryGetProperty("color", out var colSingle) && colSingle.ValueKind == JsonValueKind.String)
            {
                colores.Add(colSingle.GetString()!);
            }
        }
        catch
        {
            // Ignora JSON no estándar
        }

        if (tallas.Count == 0) tallas.Add("Única");
        if (colores.Count == 0) colores.Add("Estándar");
        return (tallas, colores);
    }

    private static List<string> ParseServicioIncluye(string? json)
    {
        var list = new List<string>();
        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("incluye", out var incEl) && incEl.ValueKind == JsonValueKind.Array)
                {
                    list.AddRange(incEl.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => x.Length > 0));
                }
            }
            catch
            {
                // Ignora JSON no estándar
            }
        }

        if (list.Count == 0)
        {
            list.Add("Diagnóstico y evaluación profesional previa");
            list.Add("Garantía de satisfacción respaldada por Vento");
        }
        return list;
    }

    private static string CreateSvgPlaceholder(string title, string subtitle, string accent, string bg)
    {
        var safeTitle = System.Net.WebUtility.HtmlEncode(title.Length > 28 ? title[..28] + "..." : title);
        var safeSub = System.Net.WebUtility.HtmlEncode(subtitle);
        var svg = $"<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='800' height='500' fill='{bg}' rx='16'/><circle cx='680' cy='110' r='130' fill='{accent}' opacity='0.2'/><text x='56' y='240' font-family='Inter,Arial,sans-serif' font-size='32' font-weight='800' fill='#ffffff'>{safeTitle}</text><text x='56' y='290' font-family='Inter,Arial,sans-serif' font-size='20' fill='#cbd5e1'>{safeSub}</text></svg>";
        return $"data:image/svg+xml;utf8,{Uri.EscapeDataString(svg)}";
    }
}
