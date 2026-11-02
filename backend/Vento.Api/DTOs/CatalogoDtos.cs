namespace Vento.Api.DTOs;

public class ProductoCreateUpdateDto
{
    public string? Sku { get; set; }
    public string? Nombre { get; set; }
    public string? Title { get; set; }
    public string? Marca { get; set; }
    public string? Brand { get; set; }
    public string? Categoria { get; set; }
    public string? Genero { get; set; }
    public decimal? Precio { get; set; }
    public decimal? Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int? DescuentoPorcentaje { get; set; }
    public bool? OfertaActiva { get; set; }
    public int? Stock { get; set; }
    public string? RestriccionEdad { get; set; }
    public List<string>? Tallas { get; set; }
    public List<string>? Colores { get; set; }
    public double? Peso { get; set; }
    public string? Image { get; set; }
    public string? MainImage { get; set; }
    public string? Descripcion { get; set; }
    public string? Description { get; set; }
    public string? EstadoModeracion { get; set; }
    public string? OwnerId { get; set; }
}

public class ServicioCreateUpdateDto
{
    public string? Sku { get; set; }
    public string? Nombre { get; set; }
    public string? Title { get; set; }
    public string? Marca { get; set; }
    public string? Brand { get; set; }
    public string? Categoria { get; set; }
    public string? Modalidad { get; set; }
    public string? Cobertura { get; set; }
    public string? Garantia { get; set; }
    public string? TiempoEstimado { get; set; }
    public int? TiempoHoras { get; set; }
    public string? PermiteCotizacion { get; set; }
    public decimal? Precio { get; set; }
    public decimal? Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int? DescuentoPorcentaje { get; set; }
    public bool? OfertaActiva { get; set; }
    public string? RestriccionEdad { get; set; }
    public List<string>? Incluye { get; set; }
    public string? Image { get; set; }
    public string? MainImage { get; set; }
    public string? Descripcion { get; set; }
    public string? Description { get; set; }
    public string? EstadoModeracion { get; set; }
    public string? OwnerId { get; set; }
}

public class ModeracionItemDto
{
    /// <summary>
    /// 'Aprobado' | 'Rechazado' | 'Pausado' | 'Pendiente'
    /// </summary>
    public string? EstadoModeracion { get; set; }
    public string? MotivoRechazo { get; set; }
    public bool? Destacado { get; set; }
}

public class StockPatchDto
{
    public int Stock { get; set; }
}

public class ResenaItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Autor { get; set; } = string.Empty;
    public string AutorId { get; set; } = string.Empty;
    public bool Verificada { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comentario { get; set; } = string.Empty;
}

public class ProductoDto
{
    public string Id { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Producto";
    public string OwnerId { get; set; } = string.Empty;
    public string VendedorId { get; set; } = string.Empty;
    public string VendedorNombre { get; set; } = string.Empty;
    public string VendedorTipo { get; set; } = "Emprendedor";
    public bool Verificado { get; set; }
    public string EstadoModeracion { get; set; } = "Pendiente";
    public bool AprobadoPorAdmin { get; set; }
    public string? MotivoRechazo { get; set; }
    public bool Destacado { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Categoria { get; set; } = "General";
    public string Genero { get; set; } = "Unisex";
    public decimal Precio { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int DescuentoPorcentaje { get; set; }
    public bool OfertaActiva { get; set; }
    public bool FreeShipping { get; set; }
    public int Stock { get; set; }
    public bool Visible { get; set; }
    public string RestriccionEdad { get; set; } = "no";
    public List<string> Tallas { get; set; } = new();
    public List<string> Colores { get; set; } = new();
    public double Rating { get; set; } = 4.8;
    public string Image { get; set; } = string.Empty;
    public string MainImage { get; set; } = string.Empty;
    public List<string> Thumbnails { get; set; } = new();
    public string Descripcion { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<ResenaItemDto> Reviews { get; set; } = new();
}

public class ServicioDto
{
    public string Id { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Servicio";
    public string OwnerId { get; set; } = string.Empty;
    public string ProveedorId { get; set; } = string.Empty;
    public string VendedorNombre { get; set; } = string.Empty;
    public string VendedorTipo { get; set; } = "Emprendedor";
    public bool Verificado { get; set; }
    public string EstadoModeracion { get; set; } = "Pendiente";
    public bool AprobadoPorAdmin { get; set; }
    public string? MotivoRechazo { get; set; }
    public bool Destacado { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Servicios";
    public string Modalidad { get; set; } = "Presencial";
    public string Cobertura { get; set; } = "Todo Chile";
    public string Garantia { get; set; } = "Garantía estándar Vento";
    public string TiempoEstimado { get; set; } = "48 a 72 horas";
    public string PermiteCotizacion { get; set; } = "sí";
    public decimal Precio { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int DescuentoPorcentaje { get; set; }
    public bool OfertaActiva { get; set; }
    public bool Visible { get; set; }
    public string RestriccionEdad { get; set; } = "no";
    public List<string> Incluye { get; set; } = new();
    public double Rating { get; set; } = 4.9;
    public string Image { get; set; } = string.Empty;
    public string MainImage { get; set; } = string.Empty;
    public List<string> Thumbnails { get; set; } = new();
    public string Descripcion { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<ResenaItemDto> Reviews { get; set; } = new();
}
