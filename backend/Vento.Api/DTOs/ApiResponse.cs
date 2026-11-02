namespace Vento.Api.DTOs;

/// <summary>
/// Contrato JSON estandarizado exigido por la asignatura (Diap. 35-37 de Contenido backend-1.pdf):
/// { "success": bool, "message": string, "data": T?, "errors": List&lt;string&gt;? }
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Operación realizada correctamente.")
        => new()
        {
            Success = true,
            Message = message,
            Data = data,
            Errors = null
        };

    public static ApiResponse<T> Fail(string message, List<string>? errors = null)
        => new()
        {
            Success = false,
            Message = message,
            Data = default,
            Errors = errors
        };
}

public static class ApiResponse
{
    public static ApiResponse<object?> Fail(string message, params string[] errors)
        => new()
        {
            Success = false,
            Message = message,
            Data = null,
            Errors = errors.Length > 0 ? errors.ToList() : null
        };

    public static ApiResponse<object?> FailList(string message, IEnumerable<string>? errors)
    {
        var list = errors?.Where(e => !string.IsNullOrWhiteSpace(e)).ToList();
        return new ApiResponse<object?>
        {
            Success = false,
            Message = message,
            Data = null,
            Errors = list is { Count: > 0 } ? list : null
        };
    }
}
