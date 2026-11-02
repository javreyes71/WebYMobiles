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

            // 6. Catálogo curado de Productos Físicos (tablas producto + stock + caracteristicas + contiene + vende + pertenece)
            if (!await context.Productos.AnyAsync(p => p.Sku == "NK-UPT96-01"))
            {
                var productosSeed = new[]
                {
                    new
                    {
                        StockId = 5001,
                        Sku = "NK-UPT96-01",
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
                        Descripcion = "Amortiguación Air visible de largo completo inspirada en el baloncesto de los años 90."
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
                        Descripcion = "Zapatillas urbanas clásicas inspiradas en el calzado ochentero, ideales para uso diario."
                    },
                    new
                    {
                        StockId = 5003,
                        Sku = "AJ-RET4-005",
                        Nombre = "Air Jordan 4 Retro OG SP Brick by Brick",
                        Marca = "Jordan",
                        Categoria = "Zapatos",
                        Genero = "Hombre",
                        Precio = 189990m,
                        PrecioOriginal = 219990m,
                        Descuento = 14,
                        Stock = 3, // Stock crítico (<= 3 y < 10 activa vista_inventario_critico en BD2)
                        OwnerRun = "11111111-1",
                        EmpresaRun = "76123456-0",
                        Moderacion = "Aprobado",
                        Destacado = true,
                        Descripcion = "Edición limitada coleccionable verificada por SneakerDrop CL con materiales premium."
                    },
                    new
                    {
                        StockId = 5004,
                        Sku = "UT-HOD-009",
                        Nombre = "Polerón Oversize Heavyweight Sur 420g",
                        Marca = "UrbanThreads",
                        Categoria = "Ropa",
                        Genero = "Unisex",
                        Precio = 42990m,
                        PrecioOriginal = 42990m,
                        Descuento = 0,
                        Stock = 8,
                        OwnerRun = "18888888-7",
                        EmpresaRun = "76123456-0",
                        Moderacion = "Pendiente", // En cola de moderación del Admin para demostración inmediata
                        Destacado = false,
                        Descripcion = "Algodón franela cardado de 420 gramos confeccionado en el sur de Chile."
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

                    context.Stocks.Add(new Stock { IdStock = p.StockId, Cantidad = p.Stock });
                    context.Caracteristicas.Add(new Caracteristicas
                    {
                        IdCaracteristicas = p.StockId,
                        Atributos = attrsJson,
                        IdStock = p.StockId
                    });
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

                    context.Contiene.Add(new Contiene { IdCaracteristicas = p.StockId, SkuProducto = p.Sku });
                    context.Vende.Add(new Vende
                    {
                        IdUsuario = p.OwnerRun,
                        IdProducto = p.Sku,
                        IdCaracteristicas = p.StockId,
                        Precio = p.Precio
                    });
                    context.Comercializa.Add(new Comercializa
                    {
                        IdEmpresa = p.EmpresaRun,
                        IdProducto = p.Sku,
                        IdCaracteristicas = p.StockId,
                        Precio = p.Precio
                    });
                    context.Pertenece.Add(new Pertenece { NombreCategoria = p.Categoria, IdProducto = p.Sku });
                }
                await context.SaveChangesAsync();
            }

            // 7. Catálogo curado de Servicios Profesionales (tablas servicio + vincula de BD2)
            if (!await context.Servicios.AnyAsync(s => s.Sku == "SRV-CLN-101"))
            {
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
                        PermiteCotizacion = true,
                        PrecioActual = 24990m,
                        RestriccionEdad = false,
                        Atributos = JsonSerializer.Serialize(new
                        {
                            modalidad = "A domicilio",
                            incluye = new[] { "Retiro y entrega urbana", "Limpieza profunda capellada y suela", "Ozono y escudo hidrofóbico" }
                        }),
                        Visible = true,
                        UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                        OwnerRun = "22222222-2",
                        EstadoModeracion = "Aprobado",
                        Destacado = true,
                        Descripcion = "Servicio especializado para cuero, gamuza, nubuck y malla técnica con insumos biodegradables."
                    },
                    new Servicio
                    {
                        Sku = "SRV-CST-102",
                        Nombre = "Personalización Custom Art en Calzado y Prendas",
                        Marca = "Vento Custom Studio",
                        CategoriaNombre = "Personalización y Diseño",
                        Modalidad = "Remoto",
                        Cobertura = "Todo Chile vía courier",
                        Garantia = "Sellado acrílico garantizado 6 meses",
                        Tiempo = 120,
                        TiempoEstimado = "5 a 7 días hábiles",
                        PermiteCotizacion = true,
                        PrecioActual = 35000m,
                        RestriccionEdad = false,
                        Atributos = JsonSerializer.Serialize(new
                        {
                            modalidad = "Remoto",
                            incluye = new[] { "Boceto digital previo", "Pintura Angelus a mano", "Sellado protector UV" }
                        }),
                        Visible = true,
                        UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                        OwnerRun = "22222222-2",
                        EstadoModeracion = "Aprobado",
                        Destacado = true,
                        Descripcion = "Arte personalizado pintado a mano sobre zapatillas o chaquetas de mezclilla."
                    },
                    new Servicio
                    {
                        Sku = "SRV-LUT-103",
                        Nombre = "Calibración y Mantención Integral de Guitarras Eléctricas",
                        Marca = "SurLuthería",
                        CategoriaNombre = "Luthería y Audio",
                        Modalidad = "Presencial",
                        Cobertura = "Concepción y Talcahuano",
                        Garantia = "30 días de ajuste fino sin costo",
                        Tiempo = 48,
                        TiempoEstimado = "48 horas",
                        PermiteCotizacion = true,
                        PrecioActual = 29990m,
                        RestriccionEdad = false,
                        Atributos = JsonSerializer.Serialize(new
                        {
                            modalidad = "Presencial",
                            incluye = new[] { "Rectificado y pulido de trastes", "Octavación y altura de cuerdas", "Limpieza electrónica" }
                        }),
                        Visible = true,
                        UltimaActividad = DateOnly.FromDateTime(DateTime.Today),
                        OwnerRun = "22222222-2",
                        EstadoModeracion = "Pendiente", // Pendiente para cola de moderación del Admin
                        Destacado = false,
                        Descripcion = "Calibración profesional para guitarras y bajos eléctricos con instrumentos de precisión."
                    }
                };

                context.Servicios.AddRange(serviciosSeed);
                await context.SaveChangesAsync();

                foreach (var srv in serviciosSeed)
                {
                    if (!string.IsNullOrWhiteSpace(srv.CategoriaNombre))
                    {
                        context.Vincula.Add(new Vincula { IdCategoria = srv.CategoriaNombre, IdServicio = srv.Sku });
                    }
                }
                await context.SaveChangesAsync();
            }

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
