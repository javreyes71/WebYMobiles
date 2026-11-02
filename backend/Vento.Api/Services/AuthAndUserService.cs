using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;
using Vento.Api.Utils;

namespace Vento.Api.Services;

public partial class AuthAndUserService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthAndUserService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        var clean = email.Trim();
        return !clean.Contains("..") && EmailRegex().IsMatch(clean);
    }

    /// <summary>
    /// Verifica hash BCrypt y soporta migración transparente en primer login para cuentas
    /// legadas de insertsll.txt de BD2 (ej. 'clave0001') hacia BCrypt costo 11.
    /// </summary>
    public async Task<bool> VerifyAndUpgradePasswordAsync(Usuario usuario, string plainPassword)
    {
        if (string.IsNullOrEmpty(usuario.ClaveAcceso) || string.IsNullOrEmpty(plainPassword))
        {
            return false;
        }

        if (usuario.ClaveAcceso.StartsWith("$2a$")
            || usuario.ClaveAcceso.StartsWith("$2b$")
            || usuario.ClaveAcceso.StartsWith("$2y$"))
        {
            return BCrypt.Net.BCrypt.Verify(plainPassword, usuario.ClaveAcceso);
        }

        if (string.Equals(usuario.ClaveAcceso, plainPassword, StringComparison.Ordinal))
        {
            usuario.ClaveAcceso = BCrypt.Net.BCrypt.HashPassword(plainPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        return false;
    }

    public string GenerateJwtToken(Usuario usuario, string correo)
    {
        var jwtKey = _config["Jwt:Key"] ?? "Clave_Fallback_Solo_Desarrollo_Minimo_32_Bytes_2026!";
        var jwtIssuer = _config["Jwt:Issuer"] ?? "Vento.Api";
        var jwtAudience = _config["Jwt:Audience"] ?? "Vento.Frontend";
        var expiresHours = _config.GetValue<int>("Jwt:ExpiresHours", 12);

        var roles = BuildRolesList(usuario);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Run),
            new(ClaimTypes.NameIdentifier, usuario.Run),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, correo),
            new("estado_cuenta", usuario.EstadoCuenta),
            new("estado_aprobacion", usuario.EstadoAprobacion)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiresHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static List<string> BuildRolesList(Usuario usuario)
    {
        var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Comprador" };

        if (string.Equals(usuario.Rol, "Ambos", StringComparison.OrdinalIgnoreCase))
        {
            roles.Add("VendedorProducto");
            roles.Add("ProveedorServicio");
        }
        else if (!string.IsNullOrWhiteSpace(usuario.Rol))
        {
            roles.Add(usuario.Rol);
        }

        return roles.ToList();
    }

    public async Task<UsuarioDto> MapToDtoAsync(Usuario usuario, string? jwtToken = null)
    {
        var correo = await _context.Correos
            .AsNoTracking()
            .Where(c => c.RunUsuario == usuario.Run)
            .Select(c => c.DireccionCorreo)
            .FirstOrDefaultAsync() ?? string.Empty;

        var telefonoObj = await _context.Telefonos
            .AsNoTracking()
            .Where(t => t.RunUsuario == usuario.Run)
            .FirstOrDefaultAsync();

        var direccionesDb = await _context.Direcciones
            .AsNoTracking()
            .Where(d => d.RunUsuario == usuario.Run)
            .OrderByDescending(d => d.EsPredeterminada)
            .ThenBy(d => d.IdDireccion)
            .ToListAsync();

        var direccionesDto = direccionesDb.Select(d => new DireccionDto
        {
            Id = d.IdDireccion.ToString(),
            Alias = d.Alias ?? "Principal",
            Calle = string.IsNullOrWhiteSpace(d.Complemento)
                ? $"{d.Calle} {d.Numero}".Trim()
                : $"{d.Calle} {d.Numero}, {d.Complemento}".Trim(),
            Numero = d.Numero,
            Complemento = d.Complemento,
            Region = d.RegionCodigo ?? "RM",
            Comuna = d.ComunaNombre ?? "Santiago",
            CodigoPostal = d.CodigoPostal,
            EsPredeterminada = d.EsPredeterminada
        }).ToList();

        var primaryRole = string.Equals(usuario.Rol, "Ambos", StringComparison.OrdinalIgnoreCase)
            ? "VendedorProducto"
            : usuario.Rol;

        var rolesHabilitados = BuildRolesList(usuario);
        var aprobaciones = new Dictionary<string, string>();
        foreach (var r in rolesHabilitados.Where(r => r != "Comprador"))
        {
            aprobaciones[r] = usuario.EstadoAprobacion;
        }
        if (!string.IsNullOrWhiteSpace(usuario.RolSolicitado))
        {
            if (usuario.RolSolicitado == "Ambos")
            {
                aprobaciones["VendedorProducto"] = usuario.EstadoAprobacion;
                aprobaciones["ProveedorServicio"] = usuario.EstadoAprobacion;
            }
            else
            {
                aprobaciones[usuario.RolSolicitado] = usuario.EstadoAprobacion;
            }
        }

        var telefonoFormatted = telefonoObj is null
            ? string.Empty
            : $"+{telefonoObj.Prefijo ?? 56} {telefonoObj.Numero}";

        return new UsuarioDto
        {
            Id = usuario.Run,
            Run = usuario.Run,
            Rut = RutValidator.FormatDisplay(usuario.Run),
            RutNormalized = RutValidator.CleanAlphanumeric(usuario.Run),
            Nombre = usuario.Nombre,
            Correo = correo,
            Telefono = telefonoFormatted,
            Direccion = direccionesDto.FirstOrDefault()?.Calle ?? string.Empty,
            FechaNacimiento = usuario.FechaNacimiento?.ToString("yyyy-MM-dd") ?? string.Empty,
            TipoCuenta = primaryRole,
            Rol = primaryRole,
            RolSolicitado = usuario.RolSolicitado,
            RolesHabilitados = rolesHabilitados,
            EstadoCuenta = usuario.EstadoCuenta,
            EstadoAprobacion = usuario.EstadoAprobacion,
            AprobacionesPorRol = aprobaciones,
            MotivoRechazoCuenta = usuario.MotivoRechazoCuenta,
            Verificado = usuario.Verificado,
            NombreTienda = usuario.NombreTienda ?? string.Empty,
            BiografiaTienda = usuario.BiografiaTienda ?? string.Empty,
            CiudadBase = usuario.CiudadBase ?? string.Empty,
            Especialidad = usuario.Especialidad ?? string.Empty,
            ExperienciaAnios = usuario.ExperienciaAnios,
            DescuentoProximaCompra = usuario.DescuentoProxima,
            Direcciones = direccionesDto,
            Token = jwtToken
        };
    }

    public async Task<int> NextDireccionIdAsync()
    {
        var max = await _context.Direcciones.MaxAsync(d => (int?)d.IdDireccion) ?? 5000;
        return Math.Max(max, 5000) + 1;
    }

    [GeneratedRegex(@"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")]
    private static partial Regex EmailRegex();
}
