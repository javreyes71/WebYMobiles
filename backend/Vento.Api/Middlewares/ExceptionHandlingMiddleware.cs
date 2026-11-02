using System.Net;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Vento.Api.DTOs;

namespace Vento.Api.Middlewares;

/// <summary>
/// Middleware centralizado de excepciones (Diap. 37 de Contenido backend-1.pdf).
/// Traduce además excepciones lanzadas por los 23 Triggers y 9 restricciones CHECK de BD2
/// al sobre JSON estandarizado { success, message, data, errors } sin exponer trazas internas.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DbUpdateException dbEx) when (dbEx.InnerException is PostgresException pgEx)
        {
            await HandlePostgresExceptionAsync(context, pgEx);
        }
        catch (PostgresException pgEx)
        {
            await HandlePostgresExceptionAsync(context, pgEx);
        }
        catch (UnauthorizedAccessException uaEx)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                ApiResponse.Fail(uaEx.Message, uaEx.Message));
        }
        catch (ArgumentException argEx)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                ApiResponse.Fail("Datos inválidos.", argEx.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falla inesperada procesando {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ApiResponse<object?>
            {
                Success = false,
                Message = "Error interno del servidor.",
                Data = null,
                Errors = null
            });
        }
    }

    private async Task HandlePostgresExceptionAsync(HttpContext context, PostgresException pgEx)
    {
        _logger.LogWarning(pgEx, "Regla PostgreSQL BD2 activada ({SqlState}): {MessageText}", pgEx.SqlState, pgEx.MessageText);

        var (statusCode, mainMessage, detail) = pgEx.SqlState switch
        {
            // P0001 = RAISE EXCEPTION en Triggers PL/pgSQL de BD2 (stock insuficiente, menor de edad, oferta superpuesta, boleta bloqueada, etc.)
            "P0001" when pgEx.MessageText.Contains("insuficiente", StringComparison.OrdinalIgnoreCase)
                      || pgEx.MessageText.Contains("ya posee una oferta", StringComparison.OrdinalIgnoreCase)
                      || pgEx.MessageText.Contains("ya esta entregada", StringComparison.OrdinalIgnoreCase)
                      || pgEx.MessageText.Contains("No se puede eliminar", StringComparison.OrdinalIgnoreCase)
                => (StatusCodes.Status409Conflict, pgEx.MessageText, pgEx.MessageText),

            "P0001" => (StatusCodes.Status400BadRequest, "Regla de negocio validada en base de datos.", pgEx.MessageText),

            // 23505 = unique_violation (RUT, SKU o correo duplicado)
            "23505" => (StatusCodes.Status409Conflict, "El registro ya existe en la plataforma.", "Conflicto de clave única en base de datos."),

            // 23514 = check_violation (chk_stock_cantidad_valida, chk_venta_iva_valido, chk_despacho_estado_valido, etc.)
            "23514" => (StatusCodes.Status400BadRequest, "Los datos incumplen una restricción de dominio de la base de datos.", $"Restricción activada: {pgEx.ConstraintName ?? "validación de dominio"}."),

            // 23503 = foreign_key_violation
            "23503" => (StatusCodes.Status400BadRequest, "Referencia relacional inválida.", "Uno de los recursos asociados no existe."),

            _ => (StatusCodes.Status500InternalServerError, "Error de persistencia en el servidor.", string.Empty)
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ApiResponse<object?>
        {
            Success = false,
            Message = mainMessage,
            Data = null,
            Errors = string.IsNullOrWhiteSpace(detail) ? null : new List<string> { detail }
        });
    }
}
