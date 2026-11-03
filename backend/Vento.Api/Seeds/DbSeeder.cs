using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.Models;

namespace Vento.Api.Seeds;

/// <summary>
/// Semilla Modo Dual (Seeds/ de la estructura recomendada en Diap. 25):
/// - Idempotente y 100% compatible con una base BD2 poblada con los 1.000 registros de insertsll.txt
///   (utiliza identificadores >= 5001 y SKUs con guion para cero colisión de claves primarias).
/// - Crea las 5 cuentas RBAC de demostración con hash BCrypt real, geografía base, catálogo curado,
///   cupones promocionales, órdenes, cotización inicial y tickets de soporte.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        try
        {
            if (!await context.Database.CanConnectAsync())
            {
                logger.LogWarning("Omitiendo semilla inicial: PostgreSQL aún no accesible con la cadena de conexión configurada.");
                return;
            }

            // 1. Regiones, Provincias y Comunas base (IDs >= 5001 para no colisionar con 1..1000 de insertsll.txt)
            if (!await context.Regiones.AnyAsync(r => r.IdRegion == 5001))
            {
                context.Regiones.AddRange(
                    new Region { IdRegion = 5001, Nombre = "Región Metropolitana de Santiago", Superficie = 15403 },
                    new Region { IdRegion = 5002, Nombre = "Región del Biobío", Superficie = 23890 },
                    new Region { IdRegion = 5003, Nombre = "Región de La Araucanía", Superficie = 31842 },
                    new Region { IdRegion = 5004, Nombre = "Región de Los Lagos", Superficie = 48583 }
                );
                await context.SaveChangesAsync();
            }

            if (!await context.Provincias.AnyAsync(p => p.IdProvincia == 5001))
            {
                context.Provincias.AddRange(
                    new Provincia { IdProvincia = 5001, Nombre = "Santiago", Superficie = 2030, IdRegion = 5001 },
                    new Provincia { IdProvincia = 5002, Nombre = "Concepción", Superficie = 3439, IdRegion = 5002 },
                    new Provincia { IdProvincia = 5003, Nombre = "Cautín", Superficie = 18409, IdRegion = 5003 },
                    new Provincia { IdProvincia = 5004, Nombre = "Osorno", Superficie = 9224, IdRegion = 5004 }
                );
                await context.SaveChangesAsync();
            }

            if (!await context.Comunas.AnyAsync(c => c.IdComuna == 5001))
            {
                context.Comunas.AddRange(
                    new Comuna { IdComuna = 5001, Nombre = "Providencia", Superficie = 14, IdProvincia = 5001 },
                    new Comuna { IdComuna = 5002, Nombre = "Concepción", Superficie = 222, IdProvincia = 5002 },
                    new Comuna { IdComuna = 5003, Nombre = "Temuco", Superficie = 464, IdProvincia = 5003 },
                    new Comuna { IdComuna = 5004, Nombre = "Osorno", Superficie = 951, IdProvincia = 5004 }
                );
                await context.SaveChangesAsync();
            }

            // 2. Empresas asociadas (RUTs Módulo 11 válidos para trg_14 de BD2)
            var empresasDemo = new[]
            {
                new Empresa { RunEmpresa = "76543210-3", Nombre = "Vento Oficial SpA", PaginaWeb = "https://vento.cl" },
                new Empresa { RunEmpresa = "76123456-0", Nombre = "SneakerDrop Chile Ltda.", PaginaWeb = "https://sneakerdrop.cl" },
                new Empresa { RunEmpresa = "76987654-5", Nombre = "Starken Logística Chile", PaginaWeb = "https://starken.cl" }
            };

            foreach (var emp in empresasDemo)
            {
                if (!await context.Empresas.AnyAsync(e => e.RunEmpresa == emp.RunEmpresa))
                {
                    context.Empresas.Add(emp);
                }
            }
            await context.SaveChangesAsync();

            // 3. Las 5 cuentas de demostración RBAC con BCrypt (alineadas 1:1 con Frontend)
            var usuariosDemo = new[]
            {
                new
                {
                    Usuario = new Usuario
                    {
                        Run = "12345678-5",
                        Nombre = "Administrador Vento",
                        ClaveAcceso = BCrypt.Net.BCrypt.HashPassword("admin1234"),
                        FechaNacimiento = new DateOnly(1995, 5, 15),
                        FechaRegistro = DateOnly.FromDateTime(DateTime.Today.AddMonths(-6)),
                        TipoCliente = true,
                        TipoEmprendedor = true,
                        RunEmpresa = "76543210-3",
                        Rol = "Admin",
                        EstadoCuenta = "Activo",
                        EstadoAprobacion = "Aprobado",
                        Verificado = true,
                        NombreTienda = "Vento Oficial Store",
                        BiografiaTienda = "Tienda oficial verificada de Vento Marketplace Chile.",
                        CiudadBase = "Santiago, Región Metropolitana"
                    },
                    Correo = "admin@vento.cl",
                    Telefono = "987654321"
                },
                new
                {
                    Usuario = new Usuario
                    {
                        Run = "11111111-1",
                        Nombre = "Javier Reyes",
                        ClaveAcceso = BCrypt.Net.BCrypt.HashPassword("vento1234"),
                        FechaNacimiento = new DateOnly(1999, 8, 20),
                        FechaRegistro = DateOnly.FromDateTime(DateTime.Today.AddMonths(-4)),
                        TipoCliente = true,
                        TipoEmprendedor = true,
                        RunEmpresa = "76123456-0",
                        Rol = "VendedorProducto",
                        EstadoCuenta = "Activo",
                        EstadoAprobacion = "Aprobado",
                        Verificado = true,
                        NombreTienda = "SneakerDrop CL",
                        BiografiaTienda = "Especialistas en calzado urbano y lanzamientos limitados verificados con despacho a todo Chile.",
                        CiudadBase = "Concepción, Región del Biobío"
                    },
                    Correo = "javier@vento.cl",
                    Telefono = "912345678"
                },
                new
                {
                    Usuario = new Usuario
                    {
                        Run = "22222222-2",
                        Nombre = "María Silva",
                        ClaveAcceso = BCrypt.Net.BCrypt.HashPassword("servicio1234"),
                        FechaNacimiento = new DateOnly(1998, 3, 12),
                        FechaRegistro = DateOnly.FromDateTime(DateTime.Today.AddMonths(-4)),
                        TipoCliente = true,
                        TipoEmprendedor = true,
                        RunEmpresa = "76543210-3",
                        Rol = "ProveedorServicio",
                        EstadoCuenta = "Activo",
                        EstadoAprobacion = "Aprobado",
                        Verificado = true,
                        NombreTienda = "SneakerCare & Custom Studio",
                        BiografiaTienda = "Restauración, custom art, asesoría streetwear y luthería profesional con insumos certificados.",
                        CiudadBase = "Concepción, Región del Biobío",
                        Especialidad = "Restauración, Custom Art & Cuidado Textil",
                        ExperienciaAnios = 6
                    },
                    Correo = "maria@vento.cl",
                    Telefono = "955552222"
                },
                new
                {
                    Usuario = new Usuario
                    {
                        Run = "15555555-6",
                        Nombre = "Pedro Pascal",
                        ClaveAcceso = BCrypt.Net.BCrypt.HashPassword("compra1234"),
                        FechaNacimiento = new DateOnly(1997, 11, 4),
                        FechaRegistro = DateOnly.FromDateTime(DateTime.Today.AddMonths(-2)),
                        TipoCliente = true,
                        TipoEmprendedor = false,
                        Rol = "Comprador",
                        EstadoCuenta = "Activo",
                        EstadoAprobacion = "NoAplica",
                        Verificado = false
                    },
                    Correo = "pedro@vento.cl",
                    Telefono = "977774444"
                },
                new
                {
                    Usuario = new Usuario
                    {
                        Run = "18888888-7",
                        Nombre = "Camila Ríos",
                        ClaveAcceso = BCrypt.Net.BCrypt.HashPassword("pendiente1234"),
                        FechaNacimiento = new DateOnly(2000, 2, 18),
                        FechaRegistro = DateOnly.FromDateTime(DateTime.Today.AddDays(-3)),
                        TipoCliente = true,
                        TipoEmprendedor = true,
                        Rol = "VendedorProducto",
                        RolSolicitado = "VendedorProducto",
                        EstadoCuenta = "Activo",
                        EstadoAprobacion = "Pendiente",
                        Verificado = false,
                        NombreTienda = "UrbanThreads Sur",
                        BiografiaTienda = "Confección independiente de streetwear en el sur de Chile.",
                        CiudadBase = "Osorno, Región de Los Lagos"
                    },
                    Correo = "camila@vento.cl",
                    Telefono = "966668888"
                }
            };

            foreach (var item in usuariosDemo)
            {
                if (!await context.Usuarios.AnyAsync(u => u.Run == item.Usuario.Run))
                {
                    context.Usuarios.Add(item.Usuario);
                    await context.SaveChangesAsync();
                }

                if (!await context.Correos.AnyAsync(c => c.DireccionCorreo == item.Correo))
                {
                    context.Correos.Add(new Correo
                    {
                        DireccionCorreo = item.Correo,
                        RunUsuario = item.Usuario.Run,
                        RunEmpresa = item.Usuario.RunEmpresa
                    });
                }

                if (!await context.Telefonos.AnyAsync(t => t.Numero == item.Telefono))
                {
                    context.Telefonos.Add(new Telefono
                    {
                        Numero = item.Telefono,
                        Prefijo = 56,
                        RunUsuario = item.Usuario.Run
                    });
                }
            }
            await context.SaveChangesAsync();

            // 4. Direcciones de despacho iniciales (tabla direccion BD2)
            if (!await context.Direcciones.AnyAsync(d => d.IdDireccion == 5001))
            {
                context.Direcciones.AddRange(
                    new Direccion
                    {
                        IdDireccion = 5001,
                        CodigoPostal = 4780000,
                        Calle = "Av. Alemania",
                        Numero = 420,
                        Complemento = "Depto 602",
                        Alias = "Casa Principal",
                        RegionCodigo = "IX",
                        ComunaNombre = "Temuco",
                        EsPredeterminada = true,
                        RunUsuario = "15555555-6",
                        IdComuna = 5003
                    },
                    new Direccion
                    {
                        IdDireccion = 5002,
                        CodigoPostal = 7500000,
                        Calle = "Av. Providencia",
                        Numero = 1945,
                        Complemento = "Of. 304",
                        Alias = "Oficina Estudio",
                        RegionCodigo = "RM",
                        ComunaNombre = "Providencia",
                        EsPredeterminada = false,
                        RunUsuario = "15555555-6",
                        IdComuna = 5001
                    }
                );
                await context.SaveChangesAsync();
            }

            // 5. Categorías separadas de Productos y Servicios (tabla categoria BD2)
            var categoriasDemo = new[]
            {
                new Categoria { Nombre = "Zapatos", Tipo = "Producto" },
                new Categoria { Nombre = "Ropa", Tipo = "Producto" },
                new Categoria { Nombre = "Accesorios", Tipo = "Producto" },
                new Categoria { Nombre = "Instrumentos", Tipo = "Producto" },
                new Categoria { Nombre = "Mantención y Limpieza", Tipo = "Servicio" },
                new Categoria { Nombre = "Personalización y Diseño", Tipo = "Servicio" },
                new Categoria { Nombre = "Servicios musicales", Tipo = "Servicio" },
                new Categoria { Nombre = "Eventos y Sonido", Tipo = "Servicio" },
                new Categoria { Nombre = "Asesoría de Imagen", Tipo = "Servicio" },
                new Categoria { Nombre = "Luthería y Audio", Tipo = "Servicio" },
                new Categoria { Nombre = "Asesoría y Autenticación", Tipo = "Servicio" }
            };

            foreach (var cat in categoriasDemo)
            {
                if (!await context.Categorias.AnyAsync(c => c.Nombre == cat.Nombre))
                {
                    context.Categorias.Add(cat);
                }
            }
            await context.SaveChangesAsync();

            // 6. Catálogo curado completo de Productos Físicos (8 productos originales de mockProducts)
            var productosSeed = new[]
            {
                new
                {
                    StockId = 5001,
                    Sku = "NK-UPT96-001",
                    Nombre = "Zapatilla Nike Air More Uptempo '96",
                    Marca = "Nike",
                    Categoria = "Zapatos",
                    Genero = "Hombre",
                    Precio = 63990m,
                    PrecioOriginal = 80000m,
                    Descuento = 20,
                    Stock = 12,
                    OwnerRun = "12345678-5",
                    EmpresaRun = "76543210-3",
                    Moderacion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Con un diseño inconfundible y llamativo, las Nike Air More Uptempo '96 rinden homenaje al estilo del baloncesto de la década de 1990 con amortiguación Air visible de largo completo."
                },
                new
                {
                    StockId = 5002,
                    Sku = "NK-URB-002",
                    Nombre = "Zapatilla Urbana Court Vision Low",
                    Marca = "Nike",
                    Categoria = "Zapatos",
                    Genero = "Unisex",
                    Precio = 64990m,
                    PrecioOriginal = 75000m,
                    Descuento = 13,
                    Stock = 15,
                    OwnerRun = "11111111-1",
                    EmpresaRun = "76123456-0",
                    Moderacion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Zapatillas urbanas clásicas inspiradas en el calzado ochentero, ideales para el uso diario. Combinan comodidad, durabilidad y estilo versátil."
                },
                new
                {
                    StockId = 5003,
                    Sku = "NK-AF1-003",
                    Nombre = "Zapatilla Nike Air Force 1 '07",
                    Marca = "Nike",
                    Categoria = "Zapatos",
                    Genero = "Hombre",
                    Precio = 119990m,
                    PrecioOriginal = 140000m,
                    Descuento = 14,
                    Stock = 9,
                    OwnerRun = "12345678-5",
                    EmpresaRun = "76543210-3",
                    Moderacion = "Aprobado",
                    Destacado = true,
                    Descripcion = "El resplandor vive en Nike Air Force 1, el ícono del baloncesto que le da un toque renovado a los revestimientos cosidos, colores limpios y amortiguación Nike Air."
                },
                new
                {
                    StockId = 5004,
                    Sku = "NK-DNK-004",
                    Nombre = "Zapatilla Nike Dunk Low Mujer",
                    Marca = "Nike",
                    Categoria = "Zapatos",
                    Genero = "Mujer",
                    Precio = 99990m,
                    PrecioOriginal = 120000m,
                    Descuento = 17,
                    Stock = 3,
                    OwnerRun = "11111111-1",
                    EmpresaRun = "76123456-0",
                    Moderacion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Creadas para la cancha y adaptadas al streetwear actual, las Nike Dunk Low vuelven con cuero impecable y combinación de colores clásicos."
                },
                new
                {
                    StockId = 5005,
                    Sku = "JD-AJ4-005",
                    Nombre = "Air Jordan 4 Retro OG SP Brick by Brick",
                    Marca = "Jordan",
                    Categoria = "Zapatos",
                    Genero = "Hombre",
                    Precio = 139990m,
                    PrecioOriginal = 169990m,
                    Descuento = 18,
                    Stock = 2,
                    OwnerRun = "11111111-1",
                    EmpresaRun = "76123456-0",
                    Moderacion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Inspiradas en los ladrillos rojos de NYC, las Air Jordan 4 Brick by Brick reflejan las raíces BMX de Nigel Sylvester. Capellada en cuero Firewood Orange con entresuela Sail y paneles de malla clásicos AJ4."
                },
                new
                {
                    StockId = 5006,
                    Sku = "NK-FTB-006",
                    Nombre = "Zapatilla de Fútbol Nike Mercurial Club",
                    Marca = "Nike",
                    Categoria = "Zapatos",
                    Genero = "Unisex",
                    Precio = 47990m,
                    PrecioOriginal = 55000m,
                    Descuento = 13,
                    Stock = 14,
                    OwnerRun = "11111111-1",
                    EmpresaRun = "76123456-0",
                    Moderacion = "Aprobado",
                    Destacado = false,
                    Descripcion = "Lleva tu juego al siguiente nivel con estas zapatillas de fútbol diseñadas para máxima tracción, velocidad explosiva y control preciso del balón."
                },
                new
                {
                    StockId = 5007,
                    Sku = "VT-ROP-007",
                    Nombre = "Polerón Urbano Oversize Heavyweight Vento",
                    Marca = "Vento",
                    Categoria = "Ropa",
                    Genero = "Unisex",
                    Precio = 39990m,
                    PrecioOriginal = 49990m,
                    Descuento = 20,
                    Stock = 20,
                    OwnerRun = "12345678-5",
                    EmpresaRun = "76543210-3",
                    Moderacion = "Aprobado",
                    Destacado = false,
                    Descripcion = "Polerón confeccionado en algodón orgánico de alto gramaje (420 GSM), corte relajado urbano y costuras reforzadas. Ideal para combinar con tus sneakers favoritas."
                },
                new
                {
                    StockId = 5008,
                    Sku = "VT-ROP-008",
                    Nombre = "Chaqueta Cortaviento Street Reflective Edición Limitada",
                    Marca = "Vento",
                    Categoria = "Ropa",
                    Genero = "Unisex",
                    Precio = 54990m,
                    PrecioOriginal = 54990m,
                    Descuento = 0,
                    Stock = 8,
                    OwnerRun = "18888888-7",
                    EmpresaRun = "76123456-0",
                    Moderacion = "Pendiente",
                    Destacado = false,
                    Descripcion = "Chaqueta cortaviento impermeable con paneles reflectantes 3M, cierre termosellado y confección técnica para clima cambiante."
                }
            };

            foreach (var p in productosSeed)
            {
                var attrsJson = JsonSerializer.Serialize(new
                {
                    peso = 0.85,
                    color = "Negro/Blanco",
                    tallas = new[] { "8 US", "9 US", "10 US", "11 US" },
                    genero = p.Genero
                });

                // 1. Persistir Stock primero en PostgreSQL para satisfacer fk_caracteristicas_stock
                if (!await context.Stocks.AnyAsync(s => s.IdStock == p.StockId))
                {
                    context.Stocks.Add(new Stock { IdStock = p.StockId, Cantidad = p.Stock });
                    await context.SaveChangesAsync();
                }

                // 2. Persistir Caracteristicas (clave foranea hacia Stock)
                if (!await context.Caracteristicas.AnyAsync(c => c.IdCaracteristicas == p.StockId))
                {
                    context.Caracteristicas.Add(new Caracteristicas
                    {
                        IdCaracteristicas = p.StockId,
                        Atributos = attrsJson,
                        IdStock = p.StockId
                    });
                    await context.SaveChangesAsync();
                }

                // 3. Persistir Producto en catalogo general
                if (!await context.Productos.AnyAsync(pr => pr.Sku == p.Sku))
                {
                    context.Productos.Add(new Producto
                    {
                        Sku = p.Sku,
                        Nombre = p.Nombre,
                        Marca = p.Marca,
                        RestriccionEdad = false,
                        Atributos = attrsJson,
                        Visible = true,
                        UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                        OwnerRun = p.OwnerRun,
                        EstadoModeracion = p.Moderacion,
                        Destacado = p.Destacado,
                        CategoriaNombre = p.Categoria,
                        Genero = p.Genero,
                        PrecioActual = p.Precio,
                        PrecioOriginal = p.PrecioOriginal,
                        DescuentoPorcentaje = p.Descuento,
                        OfertaActiva = p.Descuento > 0,
                        StockActual = p.Stock,
                        Descripcion = p.Descripcion
                    });
                    await context.SaveChangesAsync();
                }

                // 4. Persistir relaciones asociativas BD2 (Contiene, Vende, Comercializa, Pertenece)
                if (!await context.Contiene.AnyAsync(c => c.IdCaracteristicas == p.StockId && c.SkuProducto == p.Sku))
                {
                    context.Contiene.Add(new Contiene { IdCaracteristicas = p.StockId, SkuProducto = p.Sku });
                }
                if (!await context.Vende.AnyAsync(v => v.IdUsuario == p.OwnerRun && v.IdProducto == p.Sku))
                {
                    context.Vende.Add(new Vende
                    {
                        IdUsuario = p.OwnerRun,
                        IdProducto = p.Sku,
                        IdCaracteristicas = p.StockId,
                        Precio = p.Precio
                    });
                }
                if (!await context.Comercializa.AnyAsync(c => c.IdEmpresa == p.EmpresaRun && c.IdProducto == p.Sku))
                {
                    context.Comercializa.Add(new Comercializa
                    {
                        IdEmpresa = p.EmpresaRun,
                        IdProducto = p.Sku,
                        IdCaracteristicas = p.StockId,
                        Precio = p.Precio
                    });
                }
                if (!await context.Pertenece.AnyAsync(pe => pe.NombreCategoria == p.Categoria && pe.IdProducto == p.Sku))
                {
                    context.Pertenece.Add(new Pertenece { NombreCategoria = p.Categoria, IdProducto = p.Sku });
                }
                await context.SaveChangesAsync();
            }

            // 7. Catálogo curado completo de Servicios Profesionales (7 servicios originales de mockServices)
            var serviciosSeed = new[]
            {
                new Servicio
                {
                    Sku = "SRV-CLN-101",
                    Nombre = "Limpieza y Restauración Premium de Sneakers",
                    Marca = "SneakerCare Lab",
                    CategoriaNombre = "Mantención y Limpieza",
                    Modalidad = "A domicilio",
                    Cobertura = "Región Metropolitana y Biobío",
                    Garantia = "15 días de garantía sobre acabado",
                    Tiempo = 72,
                    TiempoEstimado = "48 a 72 horas",
                    PermiteCotizacion = false,
                    PrecioActual = 24990m,
                    RestriccionEdad = false,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "A domicilio",
                        incluye = new[] { "Retiro y entrega a domicilio", "Limpieza profunda capellada, entresuela y cordones", "Ozono y escudo repelente" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "22222222-2",
                    EstadoModeracion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Servicio especializado para zapatillas de cuero, gamuza, nubuck y malla técnica con productos biodegradables certificados."
                },
                new Servicio
                {
                    Sku = "SRV-CST-102",
                    Nombre = "Personalización Custom Art en Calzado y Prendas",
                    Marca = "Vento Custom Studio",
                    CategoriaNombre = "Personalización y Diseño",
                    Modalidad = "Online",
                    Cobertura = "Todo Chile vía courier",
                    Garantia = "Sellado acrílico garantizado 6 meses",
                    Tiempo = 120,
                    TiempoEstimado = "5 a 7 días hábiles",
                    PermiteCotizacion = true,
                    PrecioActual = 35000m,
                    RestriccionEdad = false,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "Online",
                        incluye = new[] { "Reunión de diseño y mockup previo", "Pintura Angelus a mano", "Sellado impermeable UV" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "22222222-2",
                    EstadoModeracion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Transformamos tus zapatillas o chaquetas en piezas únicas hechas a medida con pintura Angelus y sellado UV impermeable."
                },
                new Servicio
                {
                    Sku = "SRV-MUS-103",
                    Nombre = "Producción Musical, Mezcla y Mastering Profesional",
                    Marca = "Music On",
                    CategoriaNombre = "Servicios musicales",
                    Modalidad = "Online",
                    Cobertura = "100% Online / Estudio Santiago",
                    Garantia = "Hasta 3 rondas de revisión incluidas",
                    Tiempo = 96,
                    TiempoEstimado = "3 a 5 días hábiles",
                    PermiteCotizacion = true,
                    PrecioActual = 55000m,
                    RestriccionEdad = false,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "Online",
                        incluye = new[] { "Mezcla multipista y masterización LUFS", "3 rondas de revisiones incluidas", "Entrega de máster WAV 24-bit e instrumental" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "12345678-5",
                    EstadoModeracion = "Aprobado",
                    Destacado = true,
                    Descripcion = "Potencia tus lanzamientos musicales con mezcla multipista y masterización profesional con estándar internacional LUFS."
                },
                new Servicio
                {
                    Sku = "SRV-EVT-104",
                    Nombre = "DJ Set Urbano y Amplificación para Eventos",
                    Marca = "Music On",
                    CategoriaNombre = "Eventos y Sonido",
                    Modalidad = "Presencial",
                    Cobertura = "Región Metropolitana y Valparaíso",
                    Garantia = "Contrato de respaldo técnico en terreno",
                    Tiempo = 6,
                    TiempoEstimado = "4 a 6 horas por evento",
                    PermiteCotizacion = true,
                    PrecioActual = 140000m,
                    RestriccionEdad = true,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "Presencial",
                        incluye = new[] { "Sonido activo de alta fidelidad y cabina DJ", "Montaje, prueba y desmontaje", "Curaduría musical personalizada" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "12345678-5",
                    EstadoModeracion = "Aprobado",
                    Destacado = false,
                    Descripcion = "Servicio integral de musicalización e iluminación para lanzamientos, tiendas y eventos corporativos con equipamiento profesional."
                },
                new Servicio
                {
                    Sku = "SRV-ASE-105",
                    Nombre = "Asesoría de Imagen Streetwear & Personal Shopper",
                    Marca = "Estilo Vento",
                    CategoriaNombre = "Asesoría de Imagen",
                    Modalidad = "Online",
                    Cobertura = "Online para todo Chile",
                    Garantia = "Seguimiento por 14 días post-sesión",
                    Tiempo = 2,
                    TiempoEstimado = "90 minutos",
                    PermiteCotizacion = false,
                    PrecioActual = 29990m,
                    RestriccionEdad = false,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "Online",
                        incluye = new[] { "Sesión personalizada 1 a 1 por videollamada", "Dossier PDF con paleta de color y tallajes", "Lista curada de prendas y calzado" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "22222222-2",
                    EstadoModeracion = "Aprobado",
                    Destacado = false,
                    Descripcion = "Construye un armario funcional con identidad propia. Diagnóstico de estilo, paleta de colores y guía curada de compras."
                },
                new Servicio
                {
                    Sku = "SRV-LUT-106",
                    Nombre = "Calibración y Mantención de Guitarras y Bajos",
                    Marca = "Taller Luthier Sur",
                    CategoriaNombre = "Luthería y Audio",
                    Modalidad = "Presencial",
                    Cobertura = "Concepción y Talcahuano",
                    Garantia = "30 días de ajuste sin costo",
                    Tiempo = 48,
                    TiempoEstimado = "48 horas",
                    PermiteCotizacion = false,
                    PrecioActual = 32990m,
                    RestriccionEdad = false,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "Presencial",
                        incluye = new[] { "Ajuste de mástil, altura de cuerdas y octavación", "Limpieza y nutrición de diapasón más pulido", "Revisión y limpieza electrónica" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "22222222-2",
                    EstadoModeracion = "Aprobado",
                    Destacado = false,
                    Descripcion = "Servicio técnico especializado de luthería para instrumentos eléctricos y acústicos con octavación y calibración de precisión."
                },
                new Servicio
                {
                    Sku = "SRV-AUT-107",
                    Nombre = "Autenticación Legit Check Presencial de Sneakers Coleccionables",
                    Marca = "SneakerCare Lab",
                    CategoriaNombre = "Asesoría y Autenticación",
                    Modalidad = "Presencial",
                    Cobertura = "Concepción / Online con fotos macro",
                    Garantia = "Certificado digital foliado",
                    Tiempo = 24,
                    TiempoEstimado = "24 horas hábiles",
                    PermiteCotizacion = true,
                    PrecioActual = 19990m,
                    RestriccionEdad = false,
                    Atributos = JsonSerializer.Serialize(new
                    {
                        modalidad = "Presencial",
                        incluye = new[] { "Inspección macro de costuras y etiquetas", "Verificación bajo luz UV", "Emisión de certificado foliado" }
                    }),
                    Visible = true,
                    UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                    OwnerRun = "22222222-2",
                    EstadoModeracion = "Pendiente",
                    Destacado = false,
                    Descripcion = "Revisión exhaustiva de costuras, códigos QR, tipografías, etiquetas y luz UV para verificar autenticidad de pares limitados."
                }
            };

            foreach (var srv in serviciosSeed)
            {
                if (!await context.Servicios.AnyAsync(s => s.Sku == srv.Sku))
                {
                    context.Servicios.Add(srv);
                }
            }
            await context.SaveChangesAsync();

            foreach (var srv in serviciosSeed)
            {
                if (!string.IsNullOrWhiteSpace(srv.CategoriaNombre))
                {
                    if (!await context.Vincula.AnyAsync(v => v.IdCategoria == srv.CategoriaNombre && v.IdServicio == srv.Sku))
                    {
                        context.Vincula.Add(new Vincula { IdCategoria = srv.CategoriaNombre, IdServicio = srv.Sku });
                    }
                }
            }
            await context.SaveChangesAsync();

            // 8. Cotización inicial interactiva (tablas cotizacion + solicita de BD2)
            if (!await context.Cotizaciones.AnyAsync(c => c.IdCotizacion == 5001))
            {
                var hoy = DateOnly.FromDateTime(DateTime.Today);
                context.Cotizaciones.Add(new Cotizacion
                {
                    IdCotizacion = 5001,
                    Fecha = hoy.AddDays(-2),
                    FechaLimite = hoy.AddDays(13),
                    RunEmpresa = "76543210-3"
                });
                await context.SaveChangesAsync();

                context.Solicitudes.Add(new Solicita
                {
                    IdSolicitud = 5001,
                    IdCotizacion = 5001,
                    RunUsuario = "15555555-6",
                    ProveedorRun = "22222222-2",
                    SkuServicio = "SRV-CLN-101",
                    Precio = 22990,
                    PrecioBase = 22990,
                    Estado = "Cotizado",
                    FechaInicio = hoy.AddDays(-2),
                    FechaFin = hoy.AddDays(13),
                    NombreContacto = "Pedro Pascal",
                    CorreoContacto = "pedro@vento.cl",
                    TelefonoContacto = "+56 9 7777 4444",
                    FechaPreferida = hoy.AddDays(5).ToString("yyyy-MM-dd"),
                    DescripcionRequerimiento = "Restauración de gamuza y limpieza profunda de suela para Jordan 4.",
                    PlazoPropuesta = "3 días hábiles",
                    ValidezDias = 15,
                    DetallePropuesta = "Incluye retiro a domicilio, limpieza ultrasónica, renovación de gamuza y protección impermeable.",
                    FechaRespuesta = DateTime.Now.AddDays(-1)
                });
                await context.SaveChangesAsync();
            }

            // 9. Cupones promocionales dinámicos, Ticket de Soporte y Configuración Corporativa
            if (!await context.Cupones.AnyAsync())
            {
                context.Cupones.AddRange(
                    new Cupon
                    {
                        Codigo = "VENTO10",
                        Tipo = "porcentaje",
                        Valor = 10,
                        MinimoCompra = 20000,
                        Activo = true,
                        Descripcion = "10% de descuento sobre el subtotal en compras desde $20.000 CLP"
                    },
                    new Cupon
                    {
                        Codigo = "BIENVENIDA",
                        Tipo = "fijo",
                        Valor = 5000,
                        MinimoCompra = 25000,
                        Activo = true,
                        Descripcion = "$5.000 CLP de descuento directo en tu primera compra"
                    },
                    new Cupon
                    {
                        Codigo = "ENVIOGRATIS",
                        Tipo = "envio",
                        Valor = 100,
                        MinimoCompra = 15000,
                        Activo = true,
                        Descripcion = "Despacho gratuito nacional en productos seleccionados"
                    }
                );
                await context.SaveChangesAsync();
            }

            if (!await context.TicketsSoporte.AnyAsync())
            {
                context.TicketsSoporte.Add(new TicketSoporte
                {
                    Codigo = "TCK-1001",
                    RunUsuario = "15555555-6",
                    Nombre = "Pedro Pascal",
                    Correo = "pedro@vento.cl",
                    Asunto = "Consulta sobre despacho a regiones del sur",
                    Mensaje = "Hola equipo Vento, ¿cuánto demora Starken hacia Temuco en lanzamientos limitados?",
                    Estado = "Abierto",
                    FechaCreacion = DateTime.Now.AddDays(-1)
                });
                await context.SaveChangesAsync();
            }

            if (!await context.ConfiguracionesPlataforma.AnyAsync(c => c.Clave == "empresa_corporativa"))
            {
                context.ConfiguracionesPlataforma.Add(new ConfiguracionPlataforma
                {
                    Clave = "empresa_corporativa",
                    ValorJson = JsonSerializer.Serialize(new
                    {
                        razonSocial = "Vento Marketplace SpA",
                        rutEmpresa = "76.543.210-3",
                        giro = "Comercio electrónico minorista y directorio de servicios profesionales",
                        correoSoporte = "soporte@vento.cl",
                        telefonoSoporte = "+56 2 2840 9900",
                        direccionMatriz = "Av. Providencia 1234, Of. 801, Santiago, Chile",
                        envioGratisDesde = 50000,
                        costoEnvioBase = 4990,
                        comisionPlataformaPorcentaje = 5
                    })
                });
                await context.SaveChangesAsync();
            }

            logger.LogInformation("Semilla Modo Dual Vento + BD2 verificada correctamente.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No fue posible completar la semilla automática (verifique haber ejecutado 01..04 en PostgreSQL).");
        }
    }
}
