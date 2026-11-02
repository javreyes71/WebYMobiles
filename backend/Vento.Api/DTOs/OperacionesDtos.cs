namespace Vento.Api.DTOs;

public class OrdenItemCreateDto
{
    public string? Id { get; set; }
    public string? Sku { get; set; }
    public string? Tipo { get; set; }
    public string? Title { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal? Price { get; set; }
    public string? QuoteId { get; set; }
}

public class OrdenCreateDto
{
    public string? CompradorId { get; set; }
    public List<OrdenItemCreateDto> Items { get; set; } = new();
    public string? CuponCodigo { get; set; }
    public string? DireccionDespacho { get; set; }
    public string? Comuna { get; set; }
    public string? Region { get; set; }
    public string? MedioPago { get; set; }
    public string? Ultimos4DigitosTarjeta { get; set; }
}

public class DespachoUpdateDto
{
    /// <summary>
    /// Alineado con chk_despacho_estado_valido de BD2:
    /// 'En Preparación' | 'Despachado' (o 'Enviado') | 'En reparto' | 'Entregado'
    /// </summary>
    public string? Estado { get; set; }
    public string? Courier { get; set; }
    public string? TrackingCodigo { get; set; }
    public decimal? Ancho { get; set; }
    public decimal? Alto { get; set; }
    public decimal? Fondo { get; set; }
}

public class OrdenItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public string VendedorNombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Producto";
    public string Title { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string EstadoDespachoItem { get; set; } = "En Preparación";
}

public class OrdenDto
{
    public string Id { get; set; } = string.Empty;
    public string CompradorId { get; set; } = string.Empty;
    public string CompradorNombre { get; set; } = string.Empty;
    public string CompradorRut { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public decimal ValorNeto { get; set; }
    public decimal ImpuestoIva { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Envio { get; set; }
    public decimal Total { get; set; }
    public string? CuponCodigo { get; set; }
    public string Estado { get; set; } = "En Preparación";
    public string Courier { get; set; } = string.Empty;
    public string TrackingCodigo { get; set; } = string.Empty;
    public string DireccionDespacho { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public List<OrdenItemDto> Items { get; set; } = new();
}

public class CotizacionCreateDto
{
    public string? CompradorId { get; set; }
    public string? ServicioId { get; set; }
    public string? NombreContacto { get; set; }
    public string? CorreoContacto { get; set; }
    public string? TelefonoContacto { get; set; }
    public string? FechaDeseada { get; set; }
    public string? ModalidadPreferida { get; set; }
    public string? Detalles { get; set; }
}

public class PropuestaProveedorDto
{
    public int Monto { get; set; }
    public string? Plazo { get; set; }
    public string? Validez { get; set; }
    public int? ValidezDias { get; set; }
    public string? Detalle { get; set; }
}

public class EstadoCotizacionDto
{
    /// <summary>
    /// 'Aceptada' | 'Rechazada' | 'En Ejecución' | 'Completado'
    /// </summary>
    public string? Estado { get; set; }
}

public class CotizacionDto
{
    public string Id { get; set; } = string.Empty;
    public int IdSolicitud { get; set; }
    public string CompradorId { get; set; } = string.Empty;
    public string ProveedorId { get; set; } = string.Empty;
    public string ServicioId { get; set; } = string.Empty;
    public string ServicioNombre { get; set; } = string.Empty;
    public string Proveedor { get; set; } = string.Empty;
    public decimal PrecioReferencial { get; set; }
    public string NombreContacto { get; set; } = string.Empty;
    public string CorreoContacto { get; set; } = string.Empty;
    public string TelefonoContacto { get; set; } = string.Empty;
    public string FechaDeseada { get; set; } = string.Empty;
    public string FechaCreacion { get; set; } = string.Empty;
    public string? FechaLimite { get; set; }
    public string Detalles { get; set; } = string.Empty;
    public string Estado { get; set; } = "Pendiente";
    public PropuestaProveedorDto? PropuestaProveedor { get; set; }
}

public class CuponCreateUpdateDto
{
    public string? Code { get; set; }
    public string? Codigo { get; set; }
    public string? Tipo { get; set; }
    public decimal? Valor { get; set; }
    public decimal? Rate { get; set; }
    public decimal? MinimoCompra { get; set; }
    public bool? Active { get; set; }
    public bool? Activo { get; set; }
    public string? Label { get; set; }
    public string? Descripcion { get; set; }
}

public class ResenaCreateDto
{
    public string? Tipo { get; set; } // 'Producto' | 'Servicio'
    public string? ItemId { get; set; } // SKU
    public string? AutorId { get; set; }
    public int Rating { get; set; }
    public string? Comentario { get; set; }
}

public class TicketCreateDto
{
    public string? Nombre { get; set; }
    public string? Correo { get; set; }
    public string? Asunto { get; set; }
    public string? Mensaje { get; set; }
}

public class TicketRespuestaDto
{
    public string? RespuestaAdmin { get; set; }
    public string? Estado { get; set; }
}

public class EmpresaConfigDto
{
    public string? Rut { get; set; }
    public string? Nombre { get; set; }
    public string? SitioWeb { get; set; }
    public string? CorreoSoporte { get; set; }
    public string? TelefonoSoporte { get; set; }
    public string? DireccionMatriz { get; set; }
    public string? Logo { get; set; }
}
