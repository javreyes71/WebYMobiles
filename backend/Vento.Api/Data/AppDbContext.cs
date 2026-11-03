using Microsoft.EntityFrameworkCore;
using Vento.Api.Models;

namespace Vento.Api.Data;

/// <summary>
/// Contexto de persistencia Entity Framework Core + Npgsql (Diap. 29-31 de Contenido backend-1.pdf).
/// Mapea directamente el modelo relacional de Base de Datos Avanzadas (BD2) y sus vistas analíticas.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Tablas base BD2 + extensiones Web RBAC
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Correo> Correos => Set<Correo>();
    public DbSet<Telefono> Telefonos => Set<Telefono>();
    public DbSet<Region> Regiones => Set<Region>();
    public DbSet<Provincia> Provincias => Set<Provincia>();
    public DbSet<Comuna> Comunas => Set<Comuna>();
    public DbSet<Direccion> Direcciones => Set<Direccion>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<Caracteristicas> Caracteristicas => Set<Caracteristicas>();
    public DbSet<Contiene> Contiene => Set<Contiene>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<Vende> Vende => Set<Vende>();
    public DbSet<Comercializa> Comercializa => Set<Comercializa>();
    public DbSet<Pertenece> Pertenece => Set<Pertenece>();
    public DbSet<Vincula> Vincula => Set<Vincula>();
    public DbSet<Oferta> Ofertas => Set<Oferta>();
    public DbSet<Promociona> Promociona => Set<Promociona>();
    public DbSet<HistorialCompra> HistorialesCompra => Set<HistorialCompra>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<MedioPago> MediosPago => Set<MedioPago>();
    public DbSet<Despacho> Despachos => Set<Despacho>();
    public DbSet<EmpresaTransporteDespacho> EmpresasTransporteDespacho => Set<EmpresaTransporteDespacho>();
    public DbSet<Considera> Considera => Set<Considera>();
    public DbSet<OrdenItemWeb> OrdenItemsWeb => Set<OrdenItemWeb>();
    public DbSet<Cotizacion> Cotizaciones => Set<Cotizacion>();
    public DbSet<Solicita> Solicitudes => Set<Solicita>();
    public DbSet<Resena> Resenas => Set<Resena>();
    public DbSet<Resenar> Resenar => Set<Resenar>();
    public DbSet<Critica> Criticas => Set<Critica>();
    public DbSet<AlertaInventario> AlertasInventario => Set<AlertaInventario>();
    public DbSet<Cupon> Cupones => Set<Cupon>();
    public DbSet<TicketSoporte> TicketsSoporte => Set<TicketSoporte>();
    public DbSet<ConfiguracionPlataforma> ConfiguracionesPlataforma => Set<ConfiguracionPlataforma>();

    // Vistas lógicas e indicadores de negocio de BD2 (vistas.txt)
    public DbSet<VistaFacturaCliente> VistaFacturasCliente => Set<VistaFacturaCliente>();
    public DbSet<VistaInventarioCritico> VistaInventariosCriticos => Set<VistaInventarioCritico>();
    public DbSet<VistaRendimientoEmprendedor> VistaRendimientosEmprendedor => Set<VistaRendimientoEmprendedor>();
    public DbSet<VistaCatalogoUnificado> VistaCatalogosUnificados => Set<VistaCatalogoUnificado>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Claves primarias compuestas exactas de BD2 (create_table.txt)
        modelBuilder.Entity<Contiene>()
            .HasKey(c => new { c.IdCaracteristicas, c.SkuProducto });

        modelBuilder.Entity<Vende>()
            .HasKey(v => new { v.IdUsuario, v.IdProducto });

        modelBuilder.Entity<Comercializa>()
            .HasKey(c => new { c.IdEmpresa, c.IdProducto });

        modelBuilder.Entity<Pertenece>()
            .HasKey(p => new { p.NombreCategoria, p.IdProducto });

        modelBuilder.Entity<Vincula>()
            .HasKey(v => new { v.IdCategoria, v.IdServicio });

        modelBuilder.Entity<Promociona>()
            .HasKey(p => new { p.IdOferta, p.SkuServicio, p.SkuProducto });

        modelBuilder.Entity<Compra>()
            .HasKey(c => new { c.RunUsuario, c.IdVenta });

        modelBuilder.Entity<Considera>()
            .HasKey(c => new { c.IdVenta, c.CodigoPostal, c.CodigoTransferencia });

        modelBuilder.Entity<Resenar>()
            .HasKey(r => new { r.IdResena, r.IdUsuario, r.IdProducto });

        modelBuilder.Entity<Critica>()
            .HasKey(c => new { c.IdResena, c.IdUsuario, c.IdServicio });

        // Valores no generados automáticamente en PKs enteras de BD2 (compatibilidad total con insertsll.txt)
        modelBuilder.Entity<Region>().Property(r => r.IdRegion).ValueGeneratedNever();
        modelBuilder.Entity<Provincia>().Property(p => p.IdProvincia).ValueGeneratedNever();
        modelBuilder.Entity<Comuna>().Property(c => c.IdComuna).ValueGeneratedNever();
        modelBuilder.Entity<Direccion>().Property(d => d.IdDireccion).ValueGeneratedNever();
        modelBuilder.Entity<Stock>().Property(s => s.IdStock).ValueGeneratedNever();
        modelBuilder.Entity<Caracteristicas>().Property(c => c.IdCaracteristicas).ValueGeneratedNever();
        modelBuilder.Entity<Oferta>().Property(o => o.IdOferta).ValueGeneratedNever();
        modelBuilder.Entity<HistorialCompra>().Property(h => h.IdHistorial).ValueGeneratedNever();
        modelBuilder.Entity<Venta>().Property(v => v.IdVenta).ValueGeneratedNever();
        modelBuilder.Entity<Despacho>().Property(d => d.IdDespacho).ValueGeneratedNever();
        modelBuilder.Entity<Cotizacion>().Property(c => c.IdCotizacion).ValueGeneratedNever();
        modelBuilder.Entity<Solicita>().Property(s => s.IdSolicitud).ValueGeneratedNever();
        modelBuilder.Entity<Resena>().Property(r => r.NumeroResena).ValueGeneratedNever();

        // Relaciones explícitas de integridad referencial BD2
        modelBuilder.Entity<Caracteristicas>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(c => c.IdStock)
            .IsRequired(false);

        // Vistas sin clave primaria de BD2
        modelBuilder.Entity<VistaFacturaCliente>().HasNoKey().ToView("vista_factura_cliente");
        modelBuilder.Entity<VistaInventarioCritico>().HasNoKey().ToView("vista_inventario_critico");
        modelBuilder.Entity<VistaRendimientoEmprendedor>().HasNoKey().ToView("vista_rendimiento_emprendedor");
        modelBuilder.Entity<VistaCatalogoUnificado>().HasNoKey().ToView("vista_catalogo_unificado");
    }
}
