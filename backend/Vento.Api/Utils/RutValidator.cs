using System.Text.RegularExpressions;

namespace Vento.Api.Utils;

/// <summary>
/// Validador reusable de RUT chileno (Módulo 11) en C#.
/// Se ejecuta ANTES de persistir en PostgreSQL para garantizar respuesta HTTP 400 Bad Request
/// ante RUTs inválidos en Postman/React (dado que trg_14 de BD2 auto-corrige el dígito verificador).
/// </summary>
public static partial class RutValidator
{
    private static readonly Dictionary<string, string> DemoNumericRunAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["1"] = "12345678-5",
        ["2"] = "11111111-1",
        ["3"] = "22222222-2",
        ["4"] = "15555555-6",
        ["5"] = "18888888-7"
    };

    public static string CleanAlphanumeric(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        return NonRutCharsRegex().Replace(raw, string.Empty).ToUpperInvariant();
    }

    /// <summary>
    /// Valida estructura y dígito verificador Módulo 11.
    /// </summary>
    public static bool IsValid(string? rawRut)
    {
        var clean = CleanAlphanumeric(rawRut);
        if (clean.Length < 8 || clean.Length > 9) return false;

        var body = clean[..^1];
        var dv = clean[^1];

        if (!DigitsOnlyRegex().IsMatch(body)) return false;

        var expectedDv = CalculateDv(body);
        return dv == expectedDv;
    }

    public static char CalculateDv(string bodyDigits)
    {
        var sum = 0;
        var factor = 2;

        for (var i = bodyDigits.Length - 1; i >= 0; i--)
        {
            sum += (bodyDigits[i] - '0') * factor;
            factor = factor == 7 ? 2 : factor + 1;
        }

        var remainder = 11 - (sum % 11);
        return remainder switch
        {
            11 => '0',
            10 => 'K',
            _ => (char)('0' + remainder)
        };
    }

    /// <summary>
    /// Convierte cualquier RUT válido al formato canónico de BD2 (VARCHAR(12) sin puntos y con guion: "12345678-5").
    /// </summary>
    public static string ToBd2Run(string? rawRutOrId)
    {
        if (string.IsNullOrWhiteSpace(rawRutOrId)) return string.Empty;
        var trimmed = rawRutOrId.Trim();
        if (DemoNumericRunAliases.TryGetValue(trimmed, out var mappedRun))
        {
            return mappedRun;
        }

        var clean = CleanAlphanumeric(trimmed);
        if (clean.Length < 2) return trimmed;
        return $"{clean[..^1]}-{clean[^1]}";
    }

    /// <summary>
    /// Formatea un RUN de BD2 para exhibición en interfaz chilena ("12.345.678-5").
    /// </summary>
    public static string FormatDisplay(string? rawRut)
    {
        var clean = CleanAlphanumeric(rawRut);
        if (clean.Length < 2) return rawRut ?? string.Empty;

        var body = clean[..^1];
        var dv = clean[^1];
        if (!long.TryParse(body, out var num)) return $"{body}-{dv}";
        return $"{num:N0}".Replace(',', '.') + $"-{dv}";
    }

    [GeneratedRegex(@"[^0-9kK]")]
    private static partial Regex NonRutCharsRegex();

    [GeneratedRegex(@"^[0-9]+$")]
    private static partial Regex DigitsOnlyRegex();
}
