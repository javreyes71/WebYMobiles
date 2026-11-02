using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;

namespace Vento.Api.Controllers;

/// <summary>
/// Endpoints analíticos conectados directamente a las Vistas y Triggers del ramo
/// Base de Datos Avanzadas (`BD2`: `vista_inventario_critico`, `alerta_inventario`,
/// `vista_factura_cliente`, `vista_rendimiento_emprendedor`, `vista_catalogo_unificado`).
/// </summary>
[ApiController]
[Route("api/analitica")]
public class AnaliticaBd2Controller : ControllerBase
{
    private readonly AppDbContext _context;

    public AnaliticaBd2Controller(AppDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "VendedorProducto,Admin")]
    [HttpGet("inventario-critico")]
    public async Task<IActionResult> GetInventarioCritico()
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var vistaCritica = await _context.VistaInventariosCriticos.AsNoTracking()
            .OrderBy(v => v.StockActual)
            .Take(50)
            .ToListAsync();

        if (!isAdmin && !string.IsNullOrWhiteSpace(callerRun))
        {
            var misSkus = await _context.Productos.AsNoTracking()
                .Where(p => p.OwnerRun == callerRun)
                .Select(p => p.Sku)
                .ToListAsync();
            vistaCritica = vistaCritica.Where(v => misSkus.Contains(v.Sku)).ToList();
        }

        var alertasTrigger = await _context.AlertasInventario.AsNoTracking()
            .OrderByDescending(a => a.Fecha)
            .Take(30)
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(new
        {
            vistaInventarioCritico = vistaCritica,
            alertasTriggerTrg08 = alertasTrigger
        }, "Indicadores de inventario crítico (BD2) obtenidos."));
    }

    [Authorize]
    [HttpGet("facturas")]
    public async Task<IActionResult> GetFacturasFiscales()
    {
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var query = _context.VistaFacturasCliente.AsNoTracking().AsQueryable();
        if (!isAdmin)
        {
            query = query.Where(f => f.Run == callerRun);
        }

        var facturas = await query
            .OrderByDescending(f => f.IdVenta)
            .Take(50)
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(facturas, "Facturas fiscales consolidadas (vista_factura_cliente BD2) obtenidas."));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("rendimiento-emprendedores")]
    public async Task<IActionResult> GetRendimientoEmprendedores()
    {
        var rendimiento = await _context.VistaRendimientosEmprendedor.AsNoTracking()
            .OrderByDescending(r => r.FacturacionTrimestral)
            .Take(50)
            .ToListAsync();

        var totalUsuarios = await _context.Usuarios.CountAsync();
        var cuentasPendientes = await _context.Usuarios.CountAsync(u => u.EstadoAprobacion == "Pendiente");
        var productosPendientes = await _context.Productos.CountAsync(p => p.EstadoModeracion == "Pendiente");
        var serviciosPendientes = await _context.Servicios.CountAsync(s => s.EstadoModeracion == "Pendiente");
        var ventasBrutas = await _context.MediosPago.SumAsync(mp => (long?)mp.PrecioTotal) ?? 0L;

        return Ok(ApiResponse<object>.Ok(new
        {
            kpisGlobales = new
            {
                totalUsuarios,
                cuentasPendientes,
                productosPendientes,
                serviciosPendientes,
                ventasBrutasClp = ventasBrutas,
                comisionPlataforma5Porciento = Math.Round(ventasBrutas * 0.05m, 0)
            },
            vistaRendimientoEmprendedor = rendimiento
        }, "Métricas ejecutivas y vista_rendimiento_emprendedor (BD2) obtenidas."));
    }

    [HttpGet("catalogo-unificado")]
    public async Task<IActionResult> GetCatalogoUnificado([FromQuery] string? q = null)
    {
        var query = _context.VistaCatalogosUnificados.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLowerInvariant();
            query = query.Where(c => c.Nombre.ToLower().Contains(term) || c.Codigo.ToLower().Contains(term));
        }

        var resultados = await query.Take(60).ToListAsync();
        return Ok(ApiResponse<object>.Ok(resultados, "Matriz de búsqueda unificada (vista_catalogo_unificado BD2) obtenida."));
    }
}
