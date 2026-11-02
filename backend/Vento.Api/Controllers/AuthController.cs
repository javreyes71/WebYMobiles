using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Models;
using Vento.Api.Services;
using Vento.Api.Utils;

namespace Vento.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AuthAndUserService _authService;

    public AuthController(AppDbContext context, AuthAndUserService authService)
    {
        _context = context;
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(dto.Rut) || !RutValidator.IsValid(dto.Rut))
        {
            errors.Add("Ingresa un RUT chileno válido (ej: 12.345.678-5).");
        }
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 4)
        {
            errors.Add("Ingresa tu contraseña para continuar.");
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos de inicio de sesión inválidos.", errors));
        }

        var run = RutValidator.ToBd2Run(dto.Rut);
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);

        if (usuario is null)
        {
            return Unauthorized(ApiResponse.Fail(
                "Cuenta no registrada.",
                "No existe ningún usuario registrado con este RUT."));
        }

        var passwordOk = await _authService.VerifyAndUpgradePasswordAsync(usuario, dto.Password!);
        if (!passwordOk)
        {
            return Unauthorized(ApiResponse.Fail(
                "Credenciales incorrectas.",
                "La contraseña ingresada no coincide con la cuenta registrada."));
        }

        if (string.Equals(usuario.EstadoCuenta, "Suspendido", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Cuenta suspendida.",
                "Tu cuenta se encuentra suspendida por Administración. Contacta a soporte para más información."));
        }

        var correo = await _context.Correos
            .AsNoTracking()
            .Where(c => c.RunUsuario == usuario.Run)
            .Select(c => c.DireccionCorreo)
            .FirstOrDefaultAsync() ?? string.Empty;

        var token = _authService.GenerateJwtToken(usuario, correo);
        var userDto = await _authService.MapToDtoAsync(usuario, token);

        return Ok(ApiResponse<UsuarioDto>.Ok(userDto, $"Bienvenido/a, {userDto.Nombre}."));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UsuarioCreateDto dto)
    {
        return await RegisterInternalAsync(dto, callerIsAdmin: User.IsInRole("Admin"));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var run = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(run))
        {
            return Unauthorized(ApiResponse.Fail("Sesión no válida.", "No se pudo identificar al usuario autenticado."));
        }

        var usuario = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        if (string.Equals(usuario.EstadoCuenta, "Suspendido", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail("Cuenta suspendida."));
        }

        var dto = await _authService.MapToDtoAsync(usuario);
        return Ok(ApiResponse<UsuarioDto>.Ok(dto, "Sesión verificada."));
    }

    [HttpPost("recuperar")]
    public async Task<IActionResult> RecuperarPassword([FromBody] RecuperarPasswordDto dto)
    {
        var value = (dto.Identifier ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return BadRequest(ApiResponse.Fail(
                "Ingresa tu correo o RUT para recuperar tu contraseña.",
                "El campo identifier es obligatorio."));
        }

        if (value.Contains('@'))
        {
            if (!AuthAndUserService.IsValidEmail(value))
            {
                return BadRequest(ApiResponse.Fail(
                    "Formato de correo inválido.",
                    "Ingresa un correo electrónico con formato válido (ej: usuario@dominio.cl)."));
            }
        }
        else if (!RutValidator.IsValid(value))
        {
            return BadRequest(ApiResponse.Fail(
                "RUT inválido.",
                "Ingresa un RUT chileno válido en Módulo 11 o un correo electrónico."));
        }

        // Consulta parametrizada sin revelar enumeración sensible de cuentas
        var normalizedEmail = value.ToLowerInvariant();
        var maybeRun = value.Contains('@') ? string.Empty : RutValidator.ToBd2Run(value);
        _ = await _context.Usuarios.AsNoTracking().AnyAsync(u => u.Run == maybeRun)
            || await _context.Correos.AsNoTracking().AnyAsync(c => c.DireccionCorreo.ToLower() == normalizedEmail);

        return Ok(ApiResponse<object>.Ok(
            new { identifier = value },
            "Si los datos corresponden a una cuenta activa, hemos enviado las instrucciones de recuperación al correo registrado."));
    }

    [HttpPost("cambiar-password")]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
        {
            return BadRequest(ApiResponse.Fail(
                "Datos inválidos.",
                "La nueva contraseña debe tener al menos 8 caracteres."));
        }

        var targetRun = !string.IsNullOrWhiteSpace(dto.UserId)
            ? RutValidator.ToBd2Run(dto.UserId)
            : User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(targetRun))
        {
            return BadRequest(ApiResponse.Fail("Datos inválidos.", "Debe indicar el identificador del usuario."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(callerRun)
            && !User.IsInRole("Admin")
            && !string.Equals(callerRun, targetRun, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "No autorizado.",
                "No puedes cambiar la contraseña de otro usuario."));
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == targetRun);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        if (!User.IsInRole("Admin"))
        {
            var validCurrent = await _authService.VerifyAndUpgradePasswordAsync(usuario, dto.CurrentPassword ?? string.Empty);
            if (!validCurrent)
            {
                return Unauthorized(ApiResponse.Fail(
                    "Contraseña actual incorrecta.",
                    "La contraseña actual ingresada no coincide."));
            }
        }

        usuario.ClaveAcceso = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object?>.Ok(null, "Contraseña actualizada correctamente."));
    }

    internal async Task<IActionResult> RegisterInternalAsync(UsuarioCreateDto dto, bool callerIsAdmin)
    {
        var requestedProfile = (dto.Rol ?? dto.TipoCuenta ?? "Comprador").Trim();

        // Regla de negocio explícita (Diap. 34 Contenido backend-1.pdf): prohibido autoasignarse Admin
        if (!callerIsAdmin && string.Equals(requestedProfile, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Operación no permitida.",
                "Un usuario no puede autoasignarse permisos de Administrador."));
        }

        var errors = new List<string>();
        var nombre = (dto.Nombre ?? string.Empty).Trim();
        var correo = (dto.Correo ?? string.Empty).Trim().ToLowerInvariant();
        var direccionTexto = (dto.Direccion ?? string.Empty).Trim();

        if (nombre.Length < 2 || nombre.Length > 100)
        {
            errors.Add("El nombre debe tener entre 2 y 100 caracteres.");
        }
        if (string.IsNullOrWhiteSpace(dto.Rut) || !RutValidator.IsValid(dto.Rut))
        {
            errors.Add("El RUT ingresado no es válido (validación Módulo 11).");
        }
        if (!AuthAndUserService.IsValidEmail(correo))
        {
            errors.Add("El correo no tiene un formato válido.");
        }
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
        {
            errors.Add("La contraseña debe tener al menos 8 caracteres.");
        }
        if (!string.IsNullOrWhiteSpace(dto.ConfirmPassword) && dto.Password != dto.ConfirmPassword)
        {
            errors.Add("Las contraseñas no coinciden.");
        }

        DateOnly? fechaNac = null;
        if (!string.IsNullOrWhiteSpace(dto.FechaNacimiento))
        {
            if (!DateOnly.TryParse(dto.FechaNacimiento, out var parsedDob)
                || parsedDob < new DateOnly(1940, 1, 1)
                || parsedDob > DateOnly.FromDateTime(DateTime.Today))
            {
                errors.Add("La fecha de nacimiento debe estar entre 1940-01-01 y la fecha actual.");
            }
            else
            {
                fechaNac = parsedDob;
            }
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos inválidos.", errors));
        }

        var run = RutValidator.ToBd2Run(dto.Rut);

        if (await _context.Usuarios.AnyAsync(u => u.Run == run))
        {
            return Conflict(ApiResponse.Fail(
                "El RUT ya se encuentra registrado.",
                "rut: ya existe un usuario con ese RUT."));
        }

        if (await _context.Correos.AnyAsync(c => c.DireccionCorreo.ToLower() == correo))
        {
            return Conflict(ApiResponse.Fail(
                "El correo ya está registrado.",
                "correo: ya existe un usuario con ese correo."));
        }

        var normalizedRole = requestedProfile switch
        {
            "Admin" when callerIsAdmin => "Admin",
            "VendedorProducto" or "Vendedor" => "VendedorProducto",
            "ProveedorServicio" or "Empresa" => "ProveedorServicio",
            "Ambos" => "Ambos",
            _ => "Comprador"
        };

        var isCommercial = normalizedRole is "VendedorProducto" or "ProveedorServicio" or "Ambos";
        var estadoAprobacion = normalizedRole == "Comprador"
            ? "NoAplica"
            : callerIsAdmin ? "Aprobado" : "Pendiente";

        var nuevoUsuario = new Usuario
        {
            Run = run,
            Nombre = nombre,
            ClaveAcceso = BCrypt.Net.BCrypt.HashPassword(dto.Password!),
            FechaNacimiento = fechaNac ?? new DateOnly(1998, 1, 1),
            FechaRegistro = DateOnly.FromDateTime(DateTime.Today),
            TipoCliente = true,
            TipoEmprendedor = isCommercial || normalizedRole == "Admin",
            Rol = normalizedRole,
            RolSolicitado = isCommercial && estadoAprobacion == "Pendiente" ? normalizedRole : null,
            EstadoCuenta = "Activo",
            EstadoAprobacion = estadoAprobacion,
            Verificado = callerIsAdmin && (isCommercial || normalizedRole == "Admin"),
            NombreTienda = isCommercial ? ((dto.NombreTienda ?? string.Empty).Trim().Length > 0 ? dto.NombreTienda!.Trim() : nombre) : dto.NombreTienda?.Trim(),
            BiografiaTienda = dto.BiografiaTienda?.Trim(),
            CiudadBase = dto.CiudadBase?.Trim(),
            Especialidad = dto.Especialidad?.Trim()
        };

        await using var tx = await _context.Database.BeginTransactionAsync();

        _context.Usuarios.Add(nuevoUsuario);
        await _context.SaveChangesAsync();

        _context.Correos.Add(new Correo
        {
            DireccionCorreo = correo,
            RunUsuario = run
        });

        var cleanPhone = new string((dto.Telefono ?? string.Empty).Where(char.IsDigit).ToArray());
        if (cleanPhone.StartsWith("56") && cleanPhone.Length > 9)
        {
            cleanPhone = cleanPhone[2..];
        }
        if (cleanPhone.Length >= 8 && !await _context.Telefonos.AnyAsync(t => t.Numero == cleanPhone))
        {
            _context.Telefonos.Add(new Telefono
            {
                Numero = cleanPhone[..Math.Min(cleanPhone.Length, 15)],
                Prefijo = 56,
                RunUsuario = run
            });
        }

        if (!string.IsNullOrWhiteSpace(direccionTexto))
        {
            var nextDirId = await _authService.NextDireccionIdAsync();
            var defaultComunaId = await _context.Comunas.Select(c => (int?)c.IdComuna).FirstOrDefaultAsync();
            _context.Direcciones.Add(new Direccion
            {
                IdDireccion = nextDirId,
                Calle = direccionTexto[..Math.Min(direccionTexto.Length, 100)],
                Numero = 1,
                Alias = "Principal",
                RegionCodigo = "RM",
                ComunaNombre = "Santiago",
                EsPredeterminada = true,
                RunUsuario = run,
                IdComuna = defaultComunaId
            });
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var token = _authService.GenerateJwtToken(nuevoUsuario, correo);
        var userDto = await _authService.MapToDtoAsync(nuevoUsuario, token);

        var msg = isCommercial && estadoAprobacion == "Pendiente"
            ? "Cuenta creada. Tu perfil comercial quedó en revisión del Administrador."
            : "Usuario creado correctamente.";

        return StatusCode(StatusCodes.Status201Created, ApiResponse<UsuarioDto>.Ok(userDto, msg));
    }
}
