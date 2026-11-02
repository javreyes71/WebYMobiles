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
/// Gestión transaccional de Órdenes de Compra, Stock y Despachos Logísticos.
/// Respeta todas las restricciones CHECK y Triggers de BD2:
/// - chk_venta_iva_valido (total_iva = precio_sin_iva * 0.19) y trg_12 / trg_13
/// - chk_despacho_estado_valido ('En Preparación', 'Despachado', 'En reparto', 'Entregado') y trg_02
/// - Control de stock 409 Conflict + trg_08 alerta inventario crítico (< 10) + trg_11 ocultar stock 0
/// </summary>
[ApiController]
[Route("api/ordenes")]
public class OrdenesController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdenesController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet("mias")]
    public async Task<IActionResult> GetMisOrdenes()
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var comprasIds = await _context.Compras.AsNoTracking()
            .Where(c => c.RunUsuario == callerRun)
            .Select(c => c.IdVenta)
            .ToListAsync();

        var ordenes = await BuildOrdenDtosAsync(comprasIds);
        return Ok(ApiResponse<List<OrdenDto>>.Ok(ordenes, "Mis pedidos obtenidos correctamente."));
    }

    [Authorize(Roles = "VendedorProducto,ProveedorServicio,Admin")]
    [HttpGet("vendedor")]
    public async Task<IActionResult> GetOrdenesVendedor()
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var isAdmin = User.IsInRole("Admin");

        List<int> ventaIds;
        if (isAdmin)
        {
            ventaIds = await _context.Ventas.AsNoTracking()
                .OrderByDescending(v => v.IdVenta)
                .Take(100)
                .Select(v => v.IdVenta)
                .ToListAsync();
        }
        else
        {
            ventaIds = await _context.OrdenItemsWeb.AsNoTracking()
                .Where(i => i.OwnerRun == callerRun)
                .Select(i => i.IdVenta)
                .Distinct()
                .ToListAsync();
        }

        var ordenes = await BuildOrdenDtosAsync(ventaIds, isAdmin ? null : callerRun);
        return Ok(ApiResponse<List<OrdenDto>>.Ok(ordenes, "Bandeja de ventas y despachos obtenida."));
    }

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrdenById(int id)
    {
        var list = await BuildOrdenDtosAsync(new List<int> { id });
        var orden = list.FirstOrDefault();
        if (orden is null)
        {
            return NotFound(ApiResponse.Fail("Orden de compra no encontrada."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isSellerInOrder = orden.Items.Any(i => string.Equals(i.OwnerId, callerRun, StringComparison.OrdinalIgnoreCase));
        if (!User.IsInRole("Admin")
            && !string.Equals(orden.CompradorId, callerRun, StringComparison.OrdinalIgnoreCase)
            && !isSellerInOrder)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail("No tienes permiso para ver esta orden."));
        }

        return Ok(ApiResponse<OrdenDto>.Ok(orden, "Detalle de orden obtenido."));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CrearOrden([FromBody] OrdenCreateDto dto)
    {
        if (dto.Items is null || dto.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Carrito vacío.", "La orden debe incluir al menos un ítem válido."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var buyerRun = !string.IsNullOrWhiteSpace(callerRun)
            ? callerRun
            : RutValidator.ToBd2Run(dto.CompradorId);

        var comprador = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == buyerRun);
        if (comprador is null)
        {
            return BadRequest(ApiResponse.Fail("Comprador inválido.", "No se encontró el usuario comprador en la base de datos."));
        }

        if (dto.Items.Any(i => i.Quantity <= 0))
        {
            return BadRequest(ApiResponse.Fail("Cantidad inválida.", "Todas las cantidades deben ser mayores a cero."));
        }

        await using var tx = await _context.Database.BeginTransactionAsync();

        var resolvedLines = new List<OrdenItemWeb>();
        var totalUnidades = 0;
        var subtotalBruto = 0m;
        int? linkedSolicitudId = null;

        foreach (var line in dto.Items)
        {
            var sku = (line.Sku ?? line.Id ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(sku))
            {
                return BadRequest(ApiResponse.Fail("Ítem inválido.", "Cada línea debe indicar el SKU o identificador del ítem."));
            }

            var isService = string.Equals(line.Tipo, "Servicio", StringComparison.OrdinalIgnoreCase);
            var prod = !isService
                ? await _context.Productos.FirstOrDefaultAsync(p => p.Sku == sku)
                : null;

            if (prod is null)
            {
                var srv = await _context.Servicios.FirstOrDefaultAsync(s => s.Sku == sku);
                if (srv is null)
                {
                    return NotFound(ApiResponse.Fail("Ítem no encontrado.", $"No existe el producto o servicio '{sku}'."));
                }

                // Restricción de edad (< 18 años) coherente con trg_06 de BD2
                if (srv.RestriccionEdad == true && comprador.FechaNacimiento.HasValue)
                {
                    var hoy = DateOnly.FromDateTime(DateTime.Today);
                    var edad = hoy.Year - comprador.FechaNacimiento.Value.Year;
                    if (comprador.FechaNacimiento.Value > hoy.AddYears(-edad)) edad--;
                    if (edad < 18)
                    {
                        return BadRequest(ApiResponse.Fail(
                            "Restricción de edad activa.",
                            $"El usuario {comprador.Run} es menor de edad y no puede contratar el servicio {srv.Sku}."));
                    }
                }

                decimal unitPrice = srv.PrecioActual;
                if (!string.IsNullOrWhiteSpace(line.QuoteId))
                {
                    var digits = new string(line.QuoteId.Where(char.IsDigit).ToArray());
                    if (int.TryParse(digits, out var solId))
                    {
                        var sol = await _context.Solicitudes.FirstOrDefaultAsync(s => s.IdSolicitud == solId);
                        if (sol is not null && sol.Precio.HasValue && sol.Precio.Value > 0)
                        {
                            unitPrice = sol.Precio.Value;
                            linkedSolicitudId = sol.IdSolicitud;
                            sol.Estado = "En Ejecución";
                        }
                    }
                }
                else if (line.Price.HasValue && line.Price.Value > 0)
                {
                    unitPrice = line.Price.Value;
                }

                var ownerSrv = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == srv.OwnerRun);
                resolvedLines.Add(new OrdenItemWeb
                {
                    TipoItem = "Servicio",
                    Sku = srv.Sku,
                    Titulo = srv.Nombre ?? srv.Sku,
                    OwnerRun = srv.OwnerRun,
                    VendedorNombre = ownerSrv?.NombreTienda ?? ownerSrv?.Nombre ?? "Proveedor Vento",
                    Cantidad = line.Quantity,
                    PrecioUnitario = unitPrice,
                    EstadoDespachoItem = "En Ejecución"
                });

                totalUnidades += line.Quantity;
                subtotalBruto += unitPrice * line.Quantity;
            }
            else
            {
                if (prod.EstadoModeracion != "Aprobado")
                {
                    return Conflict(ApiResponse.Fail(
                        "Producto no disponible.",
                        $"El producto '{prod.Nombre}' aún no está aprobado para venta pública."));
                }

                // Verificación y descuento atómico de stock (409 Conflict si es insuficiente)
                var carStock = await (
                    from c in _context.Contiene
                    join ca in _context.Caracteristicas on c.IdCaracteristicas equals ca.IdCaracteristicas
                    join s in _context.Stocks on ca.IdStock equals s.IdStock
                    where c.SkuProducto == prod.Sku
                    select s
                ).FirstOrDefaultAsync();

                var stockDisponible = carStock?.Cantidad ?? prod.StockActual;
                if (stockDisponible < line.Quantity)
                {
                    return Conflict(ApiResponse.Fail(
                        "Stock insuficiente.",
                        $"Stock insuficiente para '{prod.Nombre}'. Disponible: {stockDisponible}, solicitado: {line.Quantity}."));
                }

                var nuevoStock = stockDisponible - line.Quantity;
                prod.StockActual = nuevoStock;
                prod.Visible = nuevoStock > 0;
                prod.UltimaActividad = DateOnly.FromDateTime(DateTime.Today);
                if (carStock is not null)
                {
                    carStock.Cantidad = nuevoStock;
                }

                var ownerProd = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == prod.OwnerRun);
                resolvedLines.Add(new OrdenItemWeb
                {
                    TipoItem = "Producto",
                    Sku = prod.Sku,
                    Titulo = prod.Nombre ?? prod.Sku,
                    OwnerRun = prod.OwnerRun,
                    VendedorNombre = ownerProd?.NombreTienda ?? ownerProd?.Nombre ?? "Tienda Vento",
                    Cantidad = line.Quantity,
                    PrecioUnitario = prod.PrecioActual,
                    EstadoDespachoItem = "En Preparación"
                });

                totalUnidades += line.Quantity;
                subtotalBruto += prod.PrecioActual * line.Quantity;
            }
        }

        // Evaluación de cupón promocional activo
        var descuentoMonto = 0m;
        var envioGratisPorCupon = false;
        string? cuponAplicado = null;

        if (!string.IsNullOrWhiteSpace(dto.CuponCodigo))
        {
            var code = dto.CuponCodigo.Trim().ToUpperInvariant();
            var cupon = await _context.Cupones.AsNoTracking().FirstOrDefaultAsync(c => c.Codigo == code && c.Activo);
            if (cupon is null)
            {
                return BadRequest(ApiResponse.Fail("Cupón inválido.", $"El cupón '{code}' no existe o está inactivo."));
            }
            if (subtotalBruto < cupon.MinimoCompra)
            {
                return BadRequest(ApiResponse.Fail(
                    "Mínimo de compra no alcanzado.",
                    $"El cupón '{code}' exige una compra mínima de ${cupon.MinimoCompra:N0} CLP."));
            }

            cuponAplicado = code;
            if (cupon.Tipo == "porcentaje")
            {
                descuentoMonto = Math.Round(subtotalBruto * (cupon.Valor / 100m), 0);
            }
            else if (cupon.Tipo == "fijo")
            {
                descuentoMonto = Math.Min(subtotalBruto, cupon.Valor);
            }
            else if (cupon.Tipo == "envio")
            {
                envioGratisPorCupon = true;
            }
        }

        var tieneProductosFisicos = resolvedLines.Any(l => l.TipoItem == "Producto");
        var costoEnvio = !tieneProductosFisicos || subtotalBruto >= 50000m || envioGratisPorCupon ? 0 : 4990;
        var totalFinalBruto = Math.Max(0m, subtotalBruto - descuentoMonto + costoEnvio);

        // Cálculo fiscal exacto compatible con chk_venta_iva_valido (19%) y trg_12 / trg_13 de BD2
        var netoEntero = (int)Math.Round(totalFinalBruto / 1.19m, 0);
        var ivaDecimal = Math.Round(netoEntero * 0.19m, 2);
        var ivaEntero = (int)Math.Round(ivaDecimal, 0);
        var totalMedioPago = netoEntero + ivaEntero;

        var nextVentaId = (await _context.Ventas.MaxAsync(v => (int?)v.IdVenta) ?? 10090) + 1;
        var nextHistId = (await _context.HistorialesCompra.MaxAsync(h => (int?)h.IdHistorial) ?? 5000) + 1;
        var nextDespId = (await _context.Despachos.MaxAsync(d => (int?)d.IdDespacho) ?? 5000) + 1;
        var hoyDate = DateOnly.FromDateTime(DateTime.Today);

        _context.HistorialesCompra.Add(new HistorialCompra
        {
            IdHistorial = nextHistId,
            FechaInicio = hoyDate,
            FechaFin = null
        });

        var venta = new Venta
        {
            IdVenta = nextVentaId,
            Cantidad = totalUnidades,
            PrecioSinIva = netoEntero,
            TotalIva = ivaDecimal,
            Total = netoEntero + ivaDecimal,
            Fecha = DateTime.Now,
            CuponCodigo = cuponAplicado,
            DescuentoMonto = descuentoMonto,
            CostoEnvio = costoEnvio,
            CotizacionSolicitudId = linkedSolicitudId
        };
        _context.Ventas.Add(venta);
        await _context.SaveChangesAsync();

        var codigoTrf = $"TRF-{nextVentaId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 10000:D4}";
        _context.MediosPago.Add(new MedioPago
        {
            CodigoTransferencia = codigoTrf,
            Metodo = string.IsNullOrWhiteSpace(dto.MedioPago) ? "Tarjeta" : dto.MedioPago.Trim(),
            Fecha = hoyDate,
            Ultimos4DigitosTarjeta = dto.Ultimos4DigitosTarjeta,
            IdVenta = nextVentaId,
            Cantidad = totalUnidades,
            PrecioSinIva = netoEntero,
            TotalIva = ivaEntero,
            PrecioTotal = totalMedioPago
        });

        _context.Compras.Add(new Compra
        {
            RunUsuario = buyerRun,
            IdVenta = nextVentaId
        });

        var estadoInicialDespacho = tieneProductosFisicos ? "En Preparación" : "Entregado";
        var dirTexto = string.IsNullOrWhiteSpace(dto.DireccionDespacho)
            ? "Retiro / Servicio Digital"
            : $"{dto.DireccionDespacho}, {dto.Comuna ?? "Santiago"}";

        _context.Despachos.Add(new Despacho
        {
            IdDespacho = nextDespId,
            Precio = costoEnvio,
            Fecha = hoyDate,
            Estado = estadoInicialDespacho,
            IdHistorialCompra = nextHistId,
            DireccionTexto = dirTexto[..Math.Min(dirTexto.Length, 255)]
        });
        await _context.SaveChangesAsync();

        // Vínculo relacional `considera` de BD2 (habilita `vista_factura_cliente`)
        var buyerDirId = await _context.Direcciones
            .Where(d => d.RunUsuario == buyerRun)
            .Select(d => (int?)d.IdDireccion)
            .FirstOrDefaultAsync();

        if (!buyerDirId.HasValue)
        {
            var nextDirId = (await _context.Direcciones.MaxAsync(d => (int?)d.IdDireccion) ?? 5000) + 1;
            var defaultComuna = await _context.Comunas.Select(c => (int?)c.IdComuna).FirstOrDefaultAsync();
            _context.Direcciones.Add(new Direccion
            {
                IdDireccion = nextDirId,
                Calle = dirTexto[..Math.Min(dirTexto.Length, 100)],
                Numero = 1,
                Alias = "Despacho Checkout",
                ComunaNombre = dto.Comuna ?? "Santiago",
                RegionCodigo = dto.Region ?? "RM",
                EsPredeterminada = true,
                RunUsuario = buyerRun,
                IdComuna = defaultComuna
            });
            await _context.SaveChangesAsync();
            buyerDirId = nextDirId;
        }

        _context.Considera.Add(new Considera
        {
            IdVenta = nextVentaId,
            CodigoPostal = buyerDirId.Value,
            CodigoTransferencia = codigoTrf,
            IdDespacho = nextDespId,
            NumeroSeguimiento = null
        });

        foreach (var item in resolvedLines)
        {
            item.IdVenta = nextVentaId;
            _context.OrdenItemsWeb.Add(item);
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var createdOrder = (await BuildOrdenDtosAsync(new List<int> { nextVentaId })).First();
        return StatusCode(StatusCodes.Status201Created, ApiResponse<OrdenDto>.Ok(
            createdOrder,
            $"Orden #{nextVentaId} confirmada exitosamente."));
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpPatch("{id:int}/despacho")]
    public async Task<IActionResult> ActualizarDespacho(int id, [FromBody] DespachoUpdateDto dto)
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var itemsOrden = await _context.OrdenItemsWeb.Where(i => i.IdVenta == id).ToListAsync();
        if (itemsOrden.Count == 0 && !await _context.Ventas.AnyAsync(v => v.IdVenta == id))
        {
            return NotFound(ApiResponse.Fail("Orden no encontrada."));
        }

        if (!isAdmin && itemsOrden.All(i => !string.Equals(i.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase)))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Esta orden no contiene productos pertenecientes a tu tienda."));
        }

        // Normaliza 'Enviado' -> 'Despachado' para respetar chk_despacho_estado_valido de BD2
        var rawEstado = (dto.Estado ?? "Despachado").Trim();
        var bd2Estado = rawEstado switch
        {
            "Enviado" => "Despachado",
            "Confirmado" => "En Preparación",
            _ => rawEstado
        };

        if (bd2Estado is not ("En Preparación" or "Despachado" or "En reparto" or "Entregado"))
        {
            return BadRequest(ApiResponse.Fail(
                "Estado de despacho inválido.",
                "Valores permitidos por BD2: 'En Preparación', 'Despachado', 'En reparto' o 'Entregado'."));
        }

        var considera = await _context.Considera.FirstOrDefaultAsync(c => c.IdVenta == id);
        if (considera?.IdDespacho is not null)
        {
            var despacho = await _context.Despachos.FirstOrDefaultAsync(d => d.IdDespacho == considera.IdDespacho);
            if (despacho is not null)
            {
                despacho.Estado = bd2Estado;
                if (!string.IsNullOrWhiteSpace(dto.Courier)) despacho.CourierNombre = dto.Courier.Trim();
                if (!string.IsNullOrWhiteSpace(dto.TrackingCodigo)) despacho.CodigoSeguimiento = dto.TrackingCodigo.Trim();
                if (dto.Ancho.HasValue) despacho.Ancho = dto.Ancho.Value;
                if (dto.Alto.HasValue) despacho.Alto = dto.Alto.Value;
                if (dto.Fondo.HasValue) despacho.Fondo = dto.Fondo.Value;

                if (bd2Estado == "Entregado" && despacho.IdHistorialCompra.HasValue)
                {
                    var hist = await _context.HistorialesCompra.FirstOrDefaultAsync(h => h.IdHistorial == despacho.IdHistorialCompra.Value);
                    if (hist is not null) hist.FechaFin = DateOnly.FromDateTime(DateTime.Today);
                }

                if (!string.IsNullOrWhiteSpace(dto.TrackingCodigo))
                {
                    var seg = dto.TrackingCodigo.Trim()[..Math.Min(dto.TrackingCodigo.Trim().Length, 50)];
                    if (!await _context.EmpresasTransporteDespacho.AnyAsync(e => e.NumeroSeguimiento == seg))
                    {
                        var transpEmpresa = await _context.Empresas.Select(e => e.RunEmpresa).FirstOrDefaultAsync();
                        _context.EmpresasTransporteDespacho.Add(new EmpresaTransporteDespacho
                        {
                            NumeroSeguimiento = seg,
                            IdDespacho = despacho.IdDespacho,
                            RunEmpresa = transpEmpresa
                        });
                        await _context.SaveChangesAsync();
                    }
                    considera.NumeroSeguimiento = seg;
                }
            }
        }

        foreach (var item in itemsOrden.Where(i => isAdmin || string.Equals(i.OwnerRun, callerRun, StringComparison.OrdinalIgnoreCase)))
        {
            item.EstadoDespachoItem = bd2Estado;
        }

        await _context.SaveChangesAsync();

        var updated = (await BuildOrdenDtosAsync(new List<int> { id })).First();
        return Ok(ApiResponse<OrdenDto>.Ok(updated, $"Despacho actualizado a '{bd2Estado}'."));
    }

    private async Task<List<OrdenDto>> BuildOrdenDtosAsync(List<int> ventaIds, string? filterSellerRun = null)
    {
        if (ventaIds.Count == 0) return new List<OrdenDto>();

        var ventas = await _context.Ventas.AsNoTracking()
            .Where(v => ventaIds.Contains(v.IdVenta))
            .OrderByDescending(v => v.IdVenta)
            .ToListAsync();

        var compras = await _context.Compras.AsNoTracking()
            .Where(c => ventaIds.Contains(c.IdVenta))
            .ToListAsync();

        var buyerRuns = compras.Select(c => c.RunUsuario).Distinct().ToList();
        var buyers = await _context.Usuarios.AsNoTracking()
            .Where(u => buyerRuns.Contains(u.Run))
            .ToDictionaryAsync(u => u.Run);

        var consideras = await _context.Considera.AsNoTracking()
            .Where(c => ventaIds.Contains(c.IdVenta))
            .ToListAsync();

        var despachoIds = consideras.Where(c => c.IdDespacho.HasValue).Select(c => c.IdDespacho!.Value).Distinct().ToList();
        var despachos = await _context.Despachos.AsNoTracking()
            .Where(d => despachoIds.Contains(d.IdDespacho))
            .ToDictionaryAsync(d => d.IdDespacho);

        var itemsWeb = await _context.OrdenItemsWeb.AsNoTracking()
            .Where(i => ventaIds.Contains(i.IdVenta))
            .ToListAsync();

        return ventas.Select(v =>
        {
            var compra = compras.FirstOrDefault(c => c.IdVenta == v.IdVenta);
            buyers.TryGetValue(compra?.RunUsuario ?? string.Empty, out var buyer);
            var cons = consideras.FirstOrDefault(c => c.IdVenta == v.IdVenta);
            Despacho? desp = null;
            if (cons?.IdDespacho is not null) despachos.TryGetValue(cons.IdDespacho.Value, out desp);

            var lines = itemsWeb
                .Where(i => i.IdVenta == v.IdVenta && (filterSellerRun is null || string.Equals(i.OwnerRun, filterSellerRun, StringComparison.OrdinalIgnoreCase)))
                .Select(i => new OrdenItemDto
                {
                    Id = i.Sku,
                    Sku = i.Sku,
                    OwnerId = i.OwnerRun ?? string.Empty,
                    VendedorNombre = i.VendedorNombre ?? "Tienda Vento",
                    Tipo = i.TipoItem,
                    Title = i.Titulo,
                    Quantity = i.Cantidad,
                    Price = i.PrecioUnitario,
                    EstadoDespachoItem = i.EstadoDespachoItem
                }).ToList();

            var subtotal = lines.Count > 0
                ? lines.Sum(l => l.Price * l.Quantity)
                : v.PrecioSinIva + v.TotalIva;

            var envio = desp?.Precio ?? v.CostoEnvio;
            var total = v.Total ?? (v.PrecioSinIva + v.TotalIva + envio);

            return new OrdenDto
            {
                Id = v.IdVenta.ToString(),
                CompradorId = compra?.RunUsuario ?? string.Empty,
                CompradorNombre = buyer?.Nombre ?? compra?.RunUsuario ?? "Cliente",
                CompradorRut = RutValidator.FormatDisplay(compra?.RunUsuario),
                Fecha = (v.Fecha ?? DateTime.Now).ToString("dd MMM yyyy, HH:mm"),
                ValorNeto = v.PrecioSinIva,
                ImpuestoIva = v.TotalIva,
                Subtotal = subtotal,
                Descuento = v.DescuentoMonto,
                Envio = envio,
                Total = total,
                CuponCodigo = v.CuponCodigo,
                Estado = desp?.Estado ?? "En Preparación",
                Courier = desp?.CourierNombre ?? string.Empty,
                TrackingCodigo = desp?.CodigoSeguimiento ?? cons?.NumeroSeguimiento ?? string.Empty,
                DireccionDespacho = desp?.DireccionTexto ?? string.Empty,
                ItemsCount = lines.Sum(l => l.Quantity),
                Items = lines
            };
        }).ToList();
    }
}
