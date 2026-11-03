using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vento.Api.Models;

// =============================================================================
// ENTIDADES PERSISTIDAS ALINEADAS 1:1 CON BASE DE DATOS AVANZADAS (BD2)
// + EXTENSIÓN NO DESTRUCTIVA DE 4 PERFILES RBAC Y MODERACIÓN WEB
// =============================================================================

[Table("empresa")]
public class Empresa
{
    [Key]
    [Column("run_empresa")]
    [MaxLength(12)]
    public string RunEmpresa { get; set; } = string.Empty;

    [Column("nombre")]
    [MaxLength(100)]
    public string? Nombre { get; set; }

    [Column("pagina_web")]
    [MaxLength(255)]
    public string? PaginaWeb { get; set; }
}

[Table("usuario")]
public class Usuario
{
    [Key]
    [Column("run")]
    [MaxLength(12)]
    public string Run { get; set; } = string.Empty;

    [Required]
    [Column("nombre")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    /// <summary>
    /// Almacena el hash BCrypt de la contraseña (NUNCA se incluye en UsuarioDto, Diap. 28).
    /// </summary>
    [Column("clave_acceso")]
    [MaxLength(255)]
    public string? ClaveAcceso { get; set; }

    [Column("fecha_nacimiento")]
    public DateOnly? FechaNacimiento { get; set; }

    [Column("fecha_registro")]
    public DateOnly? FechaRegistro { get; set; }

    [Column("tipo_cliente")]
    public bool? TipoCliente { get; set; } = true;

    [Column("tipo_emprendedor")]
    public bool? TipoEmprendedor { get; set; } = false;

    [Column("run_empresa")]
    [MaxLength(12)]
    public string? RunEmpresa { get; set; }

    // Columnas de Triggers BD2 (trg_22 / trg_23)
    [Column("descuento_proxima")]
    public decimal DescuentoProxima { get; set; } = 0;

    [Column("descuento_desde")]
    public DateOnly? DescuentoDesde { get; set; }

    // Extensión Web RBAC 4 Perfiles y Moderación Estricta
    [Column("rol")]
    [MaxLength(30)]
    public string Rol { get; set; } = "Comprador";

    [Column("rol_solicitado")]
    [MaxLength(30)]
    public string? RolSolicitado { get; set; }

    [Column("estado_cuenta")]
    [MaxLength(20)]
    public string EstadoCuenta { get; set; } = "Activo";

    [Column("estado_aprobacion")]
    [MaxLength(20)]
    public string EstadoAprobacion { get; set; } = "NoAplica";

    [Column("motivo_rechazo_cuenta")]
    public string? MotivoRechazoCuenta { get; set; }

    [Column("verificado")]
    public bool Verificado { get; set; } = false;

    [Column("nombre_tienda")]
    [MaxLength(120)]
    public string? NombreTienda { get; set; }

    [Column("biografia_tienda")]
    public string? BiografiaTienda { get; set; }

    [Column("ciudad_base")]
    [MaxLength(100)]
    public string? CiudadBase { get; set; }

    [Column("especialidad")]
    [MaxLength(120)]
    public string? Especialidad { get; set; }

    [Column("experiencia_anios")]
    public int ExperienciaAnios { get; set; } = 0;
}

[Table("correo")]
public class Correo
{
    [Key]
    [Column("direccion_correo")]
    [MaxLength(255)]
    public string DireccionCorreo { get; set; } = string.Empty;

    [Column("run_usuario")]
    [MaxLength(12)]
    public string? RunUsuario { get; set; }

    [Column("run_empresa")]
    [MaxLength(12)]
    public string? RunEmpresa { get; set; }
}

[Table("telefono")]
public class Telefono
{
    [Key]
    [Column("numero")]
    [MaxLength(15)]
    public string Numero { get; set; } = string.Empty;

    [Column("prefijo")]
    public int? Prefijo { get; set; } = 56;

    [Column("run_usuario")]
    [MaxLength(12)]
    public string? RunUsuario { get; set; }
}

[Table("region")]
public class Region
{
    [Key]
    [Column("id_region")]
    public int IdRegion { get; set; }

    [Column("nombre")]
    [MaxLength(100)]
    public string? Nombre { get; set; }

    [Column("superficie")]
    public int Superficie { get; set; }
}

[Table("provincia")]
public class Provincia
{
    [Key]
    [Column("id_provincia")]
    public int IdProvincia { get; set; }

    [Column("nombre")]
    [MaxLength(50)]
    public string? Nombre { get; set; }

    [Column("superficie")]
    public int Superficie { get; set; }

    [Column("id_region")]
    public int? IdRegion { get; set; }
}

[Table("comuna")]
public class Comuna
{
    [Key]
    [Column("id_comuna")]
    public int IdComuna { get; set; }

    [Column("nombre")]
    [MaxLength(50)]
    public string? Nombre { get; set; }

    [Column("superficie")]
    public int Superficie { get; set; }

    [Column("id_provincia")]
    public int? IdProvincia { get; set; }
}

[Table("direccion")]
public class Direccion
{
    [Key]
    [Column("id_direccion")]
    public int IdDireccion { get; set; }

    [Column("codigo_postal")]
    public int? CodigoPostal { get; set; }

    [Column("calle")]
    [MaxLength(100)]
    public string? Calle { get; set; }

    [Column("numero")]
    public int? Numero { get; set; }

    [Column("run_usuario")]
    [MaxLength(12)]
    public string? RunUsuario { get; set; }

    [Column("run_empresa")]
    [MaxLength(12)]
    public string? RunEmpresa { get; set; }

    [Column("id_comuna")]
    public int? IdComuna { get; set; }

    // Extensión Libreta de Direcciones Web
    [Column("alias")]
    [MaxLength(60)]
    public string? Alias { get; set; } = "Principal";

    [Column("complemento")]
    [MaxLength(120)]
    public string? Complemento { get; set; }

    [Column("region_codigo")]
    [MaxLength(10)]
    public string? RegionCodigo { get; set; }

    [Column("comuna_nombre")]
    [MaxLength(80)]
    public string? ComunaNombre { get; set; }

    [Column("es_predeterminada")]
    public bool EsPredeterminada { get; set; } = false;
}

[Table("categoria")]
public class Categoria
{
    [Key]
    [Column("nombre")]
    [MaxLength(50)]
    public string Nombre { get; set; } = string.Empty;

    [Column("tipo")]
    [MaxLength(30)]
    public string? Tipo { get; set; }
}

[Table("stock")]
public class Stock
{
    [Key]
    [Column("id_stock")]
    public int IdStock { get; set; }

    [Column("cantidad")]
    public int Cantidad { get; set; }
}

[Table("caracteristicas")]
public class Caracteristicas
{
    [Key]
    [Column("id_caracteristicas")]
    public int IdCaracteristicas { get; set; }

    [Column("atributos", TypeName = "json")]
    public string? Atributos { get; set; }

    [Column("id_stock")]
    public int? IdStock { get; set; }
}

[Table("contiene")]
public class Contiene
{
    [Column("id_caracteristicas")]
    public int IdCaracteristicas { get; set; }

    [Column("sku_producto")]
    [MaxLength(50)]
    public string SkuProducto { get; set; } = string.Empty;
}

[Table("producto")]
public class Producto
{
    [Key]
    [Column("sku")]
    [MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Column("nombre")]
    [MaxLength(100)]
    public string? Nombre { get; set; }

    [Column("restriccion_edad")]
    public bool? RestriccionEdad { get; set; } = false;

    [Column("atributos", TypeName = "json")]
    public string? Atributos { get; set; }

    [Column("marca")]
    [MaxLength(50)]
    public string? Marca { get; set; }

    [Column("id_cotizacion")]
    public int? IdCotizacion { get; set; }

    [Column("visible")]
    public bool Visible { get; set; } = true;

    [Column("ultima_actividad")]
    public DateOnly? UltimaActividad { get; set; }

    // Extensión Catálogo y Moderación Estricta Web
    [Column("owner_run")]
    [MaxLength(12)]
    public string? OwnerRun { get; set; }

    [Column("estado_moderacion")]
    [MaxLength(20)]
    public string EstadoModeracion { get; set; } = "Pendiente";

    [Column("motivo_rechazo")]
    public string? MotivoRechazo { get; set; }

    [Column("destacado")]
    public bool Destacado { get; set; } = false;

    [Column("categoria_nombre")]
    [MaxLength(60)]
    public string? CategoriaNombre { get; set; }

    [Column("genero")]
    [MaxLength(30)]
    public string? Genero { get; set; } = "Unisex";

    [Column("precio_actual")]
    public decimal PrecioActual { get; set; }

    [Column("precio_original")]
    public decimal? PrecioOriginal { get; set; }

    [Column("descuento_porcentaje")]
    public int DescuentoPorcentaje { get; set; } = 0;

    [Column("oferta_activa")]
    public bool OfertaActiva { get; set; } = false;

    [Column("stock_actual")]
    public int StockActual { get; set; } = 0;

    [Column("imagen_principal")]
    public string? ImagenPrincipal { get; set; }

    [Column("descripcion")]
    public string? Descripcion { get; set; }
}

[Table("servicio")]
public class Servicio
{
    [Key]
    [Column("sku")]
    [MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Column("nombre")]
    [MaxLength(100)]
    public string? Nombre { get; set; }

    [Column("restriccion_edad")]
    public bool? RestriccionEdad { get; set; } = false;

    [Column("atributos", TypeName = "json")]
    public string? Atributos { get; set; }

    [Column("tiempo")]
    public int? Tiempo { get; set; }

    [Column("id_cotizacion")]
    public int? IdCotizacion { get; set; }

    [Column("visible")]
    public bool Visible { get; set; } = true;

    [Column("ultima_actividad")]
    public DateOnly? UltimaActividad { get; set; }

    // Extensión Servicios y Moderación Estricta Web
    [Column("owner_run")]
    [MaxLength(12)]
    public string? OwnerRun { get; set; }

    [Column("estado_moderacion")]
    [MaxLength(20)]
    public string EstadoModeracion { get; set; } = "Pendiente";

    [Column("motivo_rechazo")]
    public string? MotivoRechazo { get; set; }

    [Column("destacado")]
    public bool Destacado { get; set; } = false;

    [Column("marca")]
    [MaxLength(80)]
    public string? Marca { get; set; }

    [Column("categoria_nombre")]
    [MaxLength(60)]
    public string? CategoriaNombre { get; set; }

    [Column("modalidad")]
    [MaxLength(40)]
    public string? Modalidad { get; set; } = "Presencial";

    [Column("cobertura")]
    [MaxLength(120)]
    public string? Cobertura { get; set; }

    [Column("garantia")]
    [MaxLength(120)]
    public string? Garantia { get; set; }

    [Column("tiempo_estimado")]
    [MaxLength(60)]
    public string? TiempoEstimado { get; set; }

    [Column("permite_cotizacion")]
    public bool PermiteCotizacion { get; set; } = true;

    [Column("precio_actual")]
    public decimal PrecioActual { get; set; }

    [Column("precio_original")]
    public decimal? PrecioOriginal { get; set; }

    [Column("descuento_porcentaje")]
    public int DescuentoPorcentaje { get; set; } = 0;

    [Column("oferta_activa")]
    public bool OfertaActiva { get; set; } = false;

    [Column("imagen_principal")]
    public string? ImagenPrincipal { get; set; }

    [Column("descripcion")]
    public string? Descripcion { get; set; }
}

[Table("vende")]
public class Vende
{
    [Column("id_usuario")]
    [MaxLength(12)]
    public string IdUsuario { get; set; } = string.Empty;

    [Column("id_producto")]
    [MaxLength(50)]
    public string IdProducto { get; set; } = string.Empty;

    [Column("id_caracteristicas")]
    public int? IdCaracteristicas { get; set; }

    [Column("precio", TypeName = "money")]
    public decimal Precio { get; set; }
}

[Table("comercializa")]
public class Comercializa
{
    [Column("id_empresa")]
    [MaxLength(12)]
    public string IdEmpresa { get; set; } = string.Empty;

    [Column("id_producto")]
    [MaxLength(50)]
    public string IdProducto { get; set; } = string.Empty;

    [Column("id_caracteristicas")]
    public int? IdCaracteristicas { get; set; }

    [Column("precio", TypeName = "money")]
    public decimal Precio { get; set; }
}

[Table("pertenece")]
public class Pertenece
{
    [Column("nombre_categoria")]
    [MaxLength(50)]
    public string NombreCategoria { get; set; } = string.Empty;

    [Column("id_producto")]
    [MaxLength(50)]
    public string IdProducto { get; set; } = string.Empty;
}

[Table("vincula")]
public class Vincula
{
    [Column("id_servicio")]
    [MaxLength(50)]
    public string IdServicio { get; set; } = string.Empty;

    [Column("id_categoria")]
    [MaxLength(50)]
    public string IdCategoria { get; set; } = string.Empty;
}

[Table("oferta")]
public class Oferta
{
    [Key]
    [Column("id_oferta")]
    public int IdOferta { get; set; }

    [Column("descuento")]
    public decimal Descuento { get; set; }
}

[Table("promociona")]
public class Promociona
{
    [Column("id_oferta")]
    public int IdOferta { get; set; }

    [Column("sku_servicio")]
    [MaxLength(50)]
    public string SkuServicio { get; set; } = string.Empty;

    [Column("sku_producto")]
    [MaxLength(50)]
    public string SkuProducto { get; set; } = string.Empty;

    [Column("fecha_inicio")]
    public DateOnly? FechaInicio { get; set; }

    [Column("fecha_fin")]
    public DateOnly? FechaFin { get; set; }
}

[Table("historial_compra")]
public class HistorialCompra
{
    [Key]
    [Column("id_historial")]
    public int IdHistorial { get; set; }

    [Column("fecha_inicio")]
    public DateOnly? FechaInicio { get; set; }

    [Column("fecha_fin")]
    public DateOnly? FechaFin { get; set; }
}

[Table("venta")]
public class Venta
{
    [Key]
    [Column("id_venta")]
    public int IdVenta { get; set; }

    [Column("cantidad")]
    public int Cantidad { get; set; }

    [Column("precio_sin_iva")]
    public decimal PrecioSinIva { get; set; }

    [Column("total_iva")]
    public decimal TotalIva { get; set; }

    [Column("total")]
    public decimal? Total { get; set; }

    [Column("fecha", TypeName = "timestamp without time zone")]
    public DateTime? Fecha { get; set; }

    [Column("cupon_codigo")]
    [MaxLength(40)]
    public string? CuponCodigo { get; set; }

    [Column("descuento_monto")]
    public decimal DescuentoMonto { get; set; } = 0;

    [Column("costo_envio")]
    public decimal CostoEnvio { get; set; } = 0;

    [Column("cotizacion_solicitud_id")]
    public int? CotizacionSolicitudId { get; set; }
}

[Table("compra")]
public class Compra
{
    [Column("run_usuario")]
    [MaxLength(12)]
    public string RunUsuario { get; set; } = string.Empty;

    [Column("id_venta")]
    public int IdVenta { get; set; }

    [Column("descuento")]
    public decimal Descuento { get; set; } = 0;

    [Column("nota")]
    public string? Nota { get; set; }
}

[Table("medio_pago")]
public class MedioPago
{
    [Key]
    [Column("codigo_transferencia")]
    [MaxLength(50)]
    public string CodigoTransferencia { get; set; } = string.Empty;

    [Column("medio_pago")]
    [MaxLength(30)]
    public string? Metodo { get; set; }

    [Column("fecha")]
    public DateOnly? Fecha { get; set; }

    [Column("ultimos_4_digitos_tarjeta")]
    [MaxLength(4)]
    public string? Ultimos4DigitosTarjeta { get; set; }

    [Column("id_venta")]
    public int? IdVenta { get; set; }

    [Column("cantidad")]
    public int Cantidad { get; set; }

    [Column("total_iva")]
    public int TotalIva { get; set; }

    [Column("precio_sin_iva")]
    public int PrecioSinIva { get; set; }

    [Column("precio_total")]
    public int PrecioTotal { get; set; }
}

[Table("despacho")]
public class Despacho
{
    [Key]
    [Column("id_despacho")]
    public int IdDespacho { get; set; }

    [Column("precio")]
    public int Precio { get; set; }

    [Column("fecha")]
    public DateOnly? Fecha { get; set; }

    /// <summary>
    /// Alineado con chk_despacho_estado_valido de BD2:
    /// 'En Preparación' | 'Despachado' | 'En reparto' | 'Entregado'
    /// </summary>
    [Column("estado")]
    [MaxLength(20)]
    public string Estado { get; set; } = "En Preparación";

    [Column("id_historial_compra")]
    public int? IdHistorialCompra { get; set; }

    [Column("ancho")]
    public decimal? Ancho { get; set; }

    [Column("alto")]
    public decimal? Alto { get; set; }

    [Column("fondo")]
    public decimal? Fondo { get; set; }

    [Column("costo_envio_proyectado")]
    public decimal? CostoEnvioProyectado { get; set; }

    [Column("courier_nombre")]
    [MaxLength(60)]
    public string? CourierNombre { get; set; }

    [Column("codigo_seguimiento")]
    [MaxLength(60)]
    public string? CodigoSeguimiento { get; set; }

    [Column("direccion_texto")]
    [MaxLength(255)]
    public string? DireccionTexto { get; set; }
}

[Table("empresa_transporte_despacho")]
public class EmpresaTransporteDespacho
{
    [Key]
    [Column("numero_seguimiento")]
    [MaxLength(50)]
    public string NumeroSeguimiento { get; set; } = string.Empty;

    [Column("id_despacho")]
    public int? IdDespacho { get; set; }

    [Column("run_empresa")]
    [MaxLength(12)]
    public string? RunEmpresa { get; set; }
}

[Table("considera")]
public class Considera
{
    [Column("id_venta")]
    public int IdVenta { get; set; }

    [Column("codigo_postal")]
    public int CodigoPostal { get; set; }

    [Column("codigo_transferencia")]
    [MaxLength(50)]
    public string CodigoTransferencia { get; set; } = string.Empty;

    [Column("id_despacho")]
    public int? IdDespacho { get; set; }

    [Column("numero_seguimiento")]
    [MaxLength(50)]
    public string? NumeroSeguimiento { get; set; }
}

[Table("orden_item_web")]
public class OrdenItemWeb
{
    [Key]
    [Column("id_item")]
    public int IdItem { get; set; }

    [Column("id_venta")]
    public int IdVenta { get; set; }

    [Column("tipo_item")]
    [MaxLength(20)]
    public string TipoItem { get; set; } = "Producto";

    [Column("sku")]
    [MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Column("titulo")]
    [MaxLength(160)]
    public string Titulo { get; set; } = string.Empty;

    [Column("owner_run")]
    [MaxLength(12)]
    public string? OwnerRun { get; set; }

    [Column("vendedor_nombre")]
    [MaxLength(120)]
    public string? VendedorNombre { get; set; }

    [Column("cantidad")]
    public int Cantidad { get; set; }

    [Column("precio_unitario")]
    public decimal PrecioUnitario { get; set; }

    [Column("estado_despacho_item")]
    [MaxLength(30)]
    public string EstadoDespachoItem { get; set; } = "En Preparación";
}

[Table("cotizacion")]
public class Cotizacion
{
    [Key]
    [Column("id_cotizacion")]
    public int IdCotizacion { get; set; }

    [Column("fecha")]
    public DateOnly? Fecha { get; set; }

    [Column("run_empresa")]
    [MaxLength(12)]
    public string? RunEmpresa { get; set; }

    [Column("fecha_limite")]
    public DateOnly? FechaLimite { get; set; }
}

[Table("solicita")]
public class Solicita
{
    [Key]
    [Column("id_solicitud")]
    public int IdSolicitud { get; set; }

    [Column("id_cotizacion")]
    public int? IdCotizacion { get; set; }

    [Column("run_usuario")]
    [MaxLength(12)]
    public string? RunUsuario { get; set; }

    [Column("precio")]
    public int? Precio { get; set; }

    [Column("estado")]
    [MaxLength(20)]
    public string Estado { get; set; } = "Pendiente";

    [Column("fecha_inicio")]
    public DateOnly? FechaInicio { get; set; }

    [Column("fecha_fin")]
    public DateOnly? FechaFin { get; set; }

    [Column("precio_base")]
    public int? PrecioBase { get; set; }

    [Column("semanas_reajuste")]
    public int SemanasReajuste { get; set; } = 0;

    [Column("sku_servicio")]
    [MaxLength(50)]
    public string? SkuServicio { get; set; }

    [Column("proveedor_run")]
    [MaxLength(12)]
    public string? ProveedorRun { get; set; }

    [Column("nombre_contacto")]
    [MaxLength(100)]
    public string? NombreContacto { get; set; }

    [Column("correo_contacto")]
    [MaxLength(255)]
    public string? CorreoContacto { get; set; }

    [Column("telefono_contacto")]
    [MaxLength(30)]
    public string? TelefonoContacto { get; set; }

    [Column("fecha_preferida")]
    [MaxLength(40)]
    public string? FechaPreferida { get; set; }

    [Column("descripcion_requerimiento")]
    public string? DescripcionRequerimiento { get; set; }

    [Column("plazo_propuesta")]
    [MaxLength(80)]
    public string? PlazoPropuesta { get; set; }

    [Column("validez_dias")]
    public int ValidezDias { get; set; } = 15;

    [Column("detalle_propuesta")]
    public string? DetallePropuesta { get; set; }

    [Column("fecha_respuesta", TypeName = "timestamp without time zone")]
    public DateTime? FechaRespuesta { get; set; }
}

[Table("reseña")]
public class Resena
{
    [Key]
    [Column("numero_reseña")]
    public int NumeroResena { get; set; }

    [Column("puntaje")]
    public int Puntaje { get; set; }

    [Column("comentario")]
    public string? Comentario { get; set; }

    [Column("run_usuario")]
    [MaxLength(12)]
    public string? RunUsuario { get; set; }

    [Column("fecha", TypeName = "timestamp without time zone")]
    public DateTime Fecha { get; set; } = DateTime.Now;

    [Column("verificada")]
    public bool Verificada { get; set; } = false;
}

[Table("reseñar")]
public class Resenar
{
    [Column("id_reseña")]
    public int IdResena { get; set; }

    [Column("id_usuario")]
    [MaxLength(12)]
    public string IdUsuario { get; set; } = string.Empty;

    [Column("id_producto")]
    [MaxLength(50)]
    public string IdProducto { get; set; } = string.Empty;
}

[Table("critica")]
public class Critica
{
    [Column("id_reseña")]
    public int IdResena { get; set; }

    [Column("id_usuario")]
    [MaxLength(12)]
    public string IdUsuario { get; set; } = string.Empty;

    [Column("id_servicio")]
    [MaxLength(50)]
    public string IdServicio { get; set; } = string.Empty;
}

[Table("alerta_inventario")]
public class AlertaInventario
{
    [Key]
    [Column("id_alerta")]
    public long IdAlerta { get; set; }

    [Column("id_stock")]
    public int? IdStock { get; set; }

    [Column("sku_producto")]
    [MaxLength(50)]
    public string? SkuProducto { get; set; }

    [Column("cantidad")]
    public int? Cantidad { get; set; }

    [Column("mensaje")]
    public string? Mensaje { get; set; }

    [Column("fecha", TypeName = "timestamp without time zone")]
    public DateTime? Fecha { get; set; }
}

[Table("cupon")]
public class Cupon
{
    [Key]
    [Column("codigo")]
    [MaxLength(40)]
    public string Codigo { get; set; } = string.Empty;

    [Column("tipo")]
    [MaxLength(20)]
    public string Tipo { get; set; } = "porcentaje";

    [Column("valor")]
    public decimal Valor { get; set; }

    [Column("minimo_compra")]
    public decimal MinimoCompra { get; set; } = 0;

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [Column("descripcion")]
    [MaxLength(200)]
    public string? Descripcion { get; set; }

    [Column("fecha_creacion", TypeName = "timestamp without time zone")]
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
}

[Table("ticket_soporte")]
public class TicketSoporte
{
    [Key]
    [Column("id_ticket")]
    public int IdTicket { get; set; }

    [Column("codigo")]
    [MaxLength(30)]
    public string Codigo { get; set; } = string.Empty;

    [Column("run_usuario")]
    [MaxLength(12)]
    public string? RunUsuario { get; set; }

    [Column("nombre")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Column("correo")]
    [MaxLength(255)]
    public string Correo { get; set; } = string.Empty;

    [Column("asunto")]
    [MaxLength(160)]
    public string Asunto { get; set; } = string.Empty;

    [Column("mensaje")]
    public string Mensaje { get; set; } = string.Empty;

    [Column("estado")]
    [MaxLength(20)]
    public string Estado { get; set; } = "Abierto";

    [Column("respuesta_admin")]
    public string? RespuestaAdmin { get; set; }

    [Column("fecha_creacion", TypeName = "timestamp without time zone")]
    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    [Column("fecha_respuesta", TypeName = "timestamp without time zone")]
    public DateTime? FechaRespuesta { get; set; }
}

[Table("configuracion_plataforma")]
public class ConfiguracionPlataforma
{
    [Key]
    [Column("clave")]
    [MaxLength(60)]
    public string Clave { get; set; } = string.Empty;

    [Column("valor_json")]
    public string ValorJson { get; set; } = "{}";

    [Column("actualizado_en", TypeName = "timestamp without time zone")]
    public DateTime ActualizadoEn { get; set; } = DateTime.Now;
}

// =============================================================================
// VISTAS ANALÍTICAS DE BD2 (vistas.txt) EXPUESTAS EN DASHBOARDS
// =============================================================================

public class VistaFacturaCliente
{
    [Column("run")]
    public string Run { get; set; } = string.Empty;

    [Column("cliente")]
    public string Cliente { get; set; } = string.Empty;

    [Column("id_venta")]
    public int IdVenta { get; set; }

    [Column("valor_neto")]
    public decimal ValorNeto { get; set; }

    [Column("impuesto_iva")]
    public decimal ImpuestoIva { get; set; }

    [Column("descuento")]
    public decimal Descuento { get; set; }

    [Column("recargo_envio")]
    public int RecargoEnvio { get; set; }

    [Column("total_factura")]
    public decimal TotalFactura { get; set; }
}

public class VistaInventarioCritico
{
    [Column("sku")]
    public string Sku { get; set; } = string.Empty;

    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [Column("stock_actual")]
    public int StockActual { get; set; }
}

public class VistaRendimientoEmprendedor
{
    [Column("run")]
    public string Run { get; set; } = string.Empty;

    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [Column("facturacion_trimestral")]
    public long FacturacionTrimestral { get; set; }

    [Column("rango")]
    public string Rango { get; set; } = string.Empty;
}

public class VistaCatalogoUnificado
{
    [Column("codigo")]
    public string Codigo { get; set; } = string.Empty;

    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [Column("tipo")]
    public string Tipo { get; set; } = string.Empty;

    [Column("detalle")]
    public string? Detalle { get; set; }

    [Column("restriccion_edad")]
    public bool? RestriccionEdad { get; set; }
}

public class VistaGeoEmpresas
{
    [Column("run_empresa")]
    public string RunEmpresa { get; set; } = string.Empty;

    [Column("empresa")]
    public string Empresa { get; set; } = string.Empty;

    [Column("giro")]
    public string Giro { get; set; } = string.Empty;

    [Column("superficie_total_comunas")]
    public long SuperficieTotalComunas { get; set; }
}

public class VistaCategoriasJerarquia
{
    [Column("categoria_padre")]
    public string CategoriaPadre { get; set; } = string.Empty;

    [Column("subcategoria")]
    public string Subcategoria { get; set; } = string.Empty;
}
