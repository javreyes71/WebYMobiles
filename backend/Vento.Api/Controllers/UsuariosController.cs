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

/// <summary>
/// Endpoints RESTful para el recurso Usuario y Gobierno Admin RBAC (Diap. 15, 28-31 y 34 de Contenido backend-1.pdf).
/// </summary>
[ApiController]
[Route("api")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AuthAndUserService _userService;

    public UsuariosController(AppDbContext context, AuthAndUserService userService)
    {
        _context = context;
        _userService = userService;
    }

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios([FromQuery] string? rol = null, [FromQuery] bool? pendientes = null)
    {
        var query = _context.Usuarios.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(rol))
        {
            query = query.Where(u => u.Rol == rol);
        }

        if (pendientes == true)
        {
            query = query.Where(u => u.EstadoAprobacion == "Pendiente");
        }

        var usuarios = await query
            .OrderByDescending(u => u.FechaRegistro)
            .ThenBy(u => u.Nombre)
            .Take(200)
            .ToListAsync();

        var dtos = new List<UsuarioDto>(usuarios.Count);
        foreach (var u in usuarios)
        {
            dtos.Add(await _userService.MapToDtoAsync(u));
        }

        return Ok(ApiResponse<List<UsuarioDto>>.Ok(dtos, "Usuarios obtenidos."));
    }

    [HttpGet("usuarios/{id}")]
    public async Task<IActionResult> GetUsuario(string id)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        var dto = await _userService.MapToDtoAsync(usuario);
        return Ok(ApiResponse<UsuarioDto>.Ok(dto, "Usuario encontrado."));
    }

    [HttpGet("usuarios/{id}/publico")]
    public async Task<IActionResult> GetPerfilPublico(string id)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Perfil comercial no encontrado."));
        }

        var dto = await _userService.MapToDtoAsync(usuario);
        var totalProductos = await _context.Productos.CountAsync(p => p.OwnerRun == run && p.EstadoModeracion == "Aprobado" && p.Visible);
        var totalServicios = await _context.Servicios.CountAsync(s => s.OwnerRun == run && s.EstadoModeracion == "Aprobado" && s.Visible);

        var publicPayload = new
        {
            id = dto.Id,
            run = dto.Run,
            nombre = dto.Nombre,
            nombreTienda = string.IsNullOrWhiteSpace(dto.NombreTienda) ? dto.Nombre : dto.NombreTienda,
            biografiaTienda = dto.BiografiaTienda,
            ciudadBase = dto.CiudadBase,
            especialidad = dto.Especialidad,
            experienciaAnios = dto.ExperienciaAnios,
            rol = dto.Rol,
            rolesHabilitados = dto.RolesHabilitados,
            estadoAprobacion = dto.EstadoAprobacion,
            verificado = dto.Verificado,
            totalProductosAprobados = totalProductos,
            totalServiciosAprobados = totalServicios
        };

        return Ok(ApiResponse<object>.Ok(publicPayload, "Perfil público obtenido."));
    }

    [HttpPost("usuarios")]
    public async Task<IActionResult> CreateUsuario([FromBody] UsuarioCreateDto dto)
    {
        var authController = new AuthController(_context, _userService)
        {
            ControllerContext = ControllerContext
        };
        return await authController.RegisterInternalAsync(dto, callerIsAdmin: User.IsInRole("Admin"));
    }

    [HttpPut("usuarios/{id}")]
    public async Task<IActionResult> UpdateUsuario(string id, [FromBody] UsuarioUpdateDto dto)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(callerRun)
            && !User.IsInRole("Admin")
            && !string.Equals(callerRun, run, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(
                "Acceso denegado.",
                "Solo el titular de la cuenta o un Administrador pueden modificar este perfil."));
        }

        var errors = new List<string>();
        var nombre = (dto.Nombre ?? usuario.Nombre).Trim();
        if (nombre.Length < 2 || nombre.Length > 100)
        {
            errors.Add("El nombre debe tener entre 2 y 100 caracteres.");
        }

        string? nuevoCorreo = null;
        if (!string.IsNullOrWhiteSpace(dto.Correo))
        {
            nuevoCorreo = dto.Correo.Trim().ToLowerInvariant();
            if (!AuthAndUserService.IsValidEmail(nuevoCorreo))
            {
                errors.Add("El correo no tiene un formato válido.");
            }
        }

        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<object?>.Fail("Datos inválidos.", errors));
        }

        if (nuevoCorreo is not null)
        {
            var correoOcupado = await _context.Correos
                .AnyAsync(c => c.DireccionCorreo.ToLower() == nuevoCorreo && c.RunUsuario != run);
            if (correoOcupado)
            {
                return Conflict(ApiResponse.Fail(
                    "El correo ya está registrado.",
                    "correo: ya existe otro usuario con ese correo electrónico."));
            }

            var actualCorreos = await _context.Correos.Where(c => c.RunUsuario == run).ToListAsync();
            if (actualCorreos.All(c => !string.Equals(c.DireccionCorreo, nuevoCorreo, StringComparison.OrdinalIgnoreCase)))
            {
                _context.Correos.RemoveRange(actualCorreos);
                await _context.SaveChangesAsync();
                _context.Correos.Add(new Correo
                {
                    DireccionCorreo = nuevoCorreo,
                    RunUsuario = run,
                    RunEmpresa = usuario.RunEmpresa
                });
            }
        }

        usuario.Nombre = nombre;
        if (dto.NombreTienda is not null) usuario.NombreTienda = dto.NombreTienda.Trim();
        if (dto.BiografiaTienda is not null) usuario.BiografiaTienda = dto.BiografiaTienda.Trim();
        if (dto.CiudadBase is not null) usuario.CiudadBase = dto.CiudadBase.Trim();
        if (dto.Especialidad is not null) usuario.Especialidad = dto.Especialidad.Trim();
        if (dto.ExperienciaAnios.HasValue && dto.ExperienciaAnios.Value >= 0) usuario.ExperienciaAnios = dto.ExperienciaAnios.Value;

        if (!string.IsNullOrWhiteSpace(dto.FechaNacimiento) && DateOnly.TryParse(dto.FechaNacimiento, out var dob) && dob >= new DateOnly(1940, 1, 1))
        {
            usuario.FechaNacimiento = dob;
        }

        if (!string.IsNullOrWhiteSpace(dto.Telefono))
        {
            var digits = new string(dto.Telefono.Where(char.IsDigit).ToArray());
            if (digits.StartsWith("56") && digits.Length > 9) digits = digits[2..];
            if (digits.Length >= 8)
            {
                var prevPhones = await _context.Telefonos.Where(t => t.RunUsuario == run).ToListAsync();
                _context.Telefonos.RemoveRange(prevPhones);
                await _context.SaveChangesAsync();

                if (!await _context.Telefonos.AnyAsync(t => t.Numero == digits))
                {
                    _context.Telefonos.Add(new Telefono
                    {
                        Numero = digits[..Math.Min(digits.Length, 15)],
                        Prefijo = 56,
                        RunUsuario = run
                    });
                }
            }
        }

        if (dto.Direcciones is not null)
        {
            var prevDirs = await _context.Direcciones.Where(d => d.RunUsuario == run).ToListAsync();
            _context.Direcciones.RemoveRange(prevDirs);
            await _context.SaveChangesAsync();

            var nextId = await _userService.NextDireccionIdAsync();
            var defaultComunaId = await _context.Comunas.Select(c => (int?)c.IdComuna).FirstOrDefaultAsync();
            foreach (var dir in dto.Direcciones.Where(d => !string.IsNullOrWhiteSpace(d.Calle)))
            {
                _context.Direcciones.Add(new Direccion
                {
                    IdDireccion = nextId++,
                    Alias = string.IsNullOrWhiteSpace(dir.Alias) ? "Principal" : dir.Alias.Trim(),
                    Calle = dir.Calle.Trim()[..Math.Min(dir.Calle.Trim().Length, 100)],
                    Numero = dir.Numero ?? 1,
                    Complemento = dir.Complemento?.Trim(),
                    RegionCodigo = string.IsNullOrWhiteSpace(dir.Region) ? "RM" : dir.Region.Trim(),
                    ComunaNombre = string.IsNullOrWhiteSpace(dir.Comuna) ? "Santiago" : dir.Comuna.Trim(),
                    CodigoPostal = dir.CodigoPostal,
                    EsPredeterminada = dir.EsPredeterminada,
                    RunUsuario = run,
                    IdComuna = defaultComunaId
                });
            }
        }

        await _context.SaveChangesAsync();

        var updatedDto = await _userService.MapToDtoAsync(usuario);
        return Ok(ApiResponse<UsuarioDto>.Ok(updatedDto, "Usuario actualizado correctamente."));
    }

    [HttpPost("usuarios/{id}/direcciones")]
    public async Task<IActionResult> AddDireccion(string id, [FromBody] DireccionCreateDto dto)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        if (string.IsNullOrWhiteSpace(dto.Calle) || string.IsNullOrWhiteSpace(dto.Comuna))
        {
            return BadRequest(ApiResponse.Fail("Datos inválidos.", "La calle y la comuna son obligatorias."));
        }

        if (dto.EsPredeterminada)
        {
            var existing = await _context.Direcciones.Where(d => d.RunUsuario == run).ToListAsync();
            foreach (var d in existing) d.EsPredeterminada = false;
        }

        var nextId = await _userService.NextDireccionIdAsync();
        var defaultComunaId = await _context.Comunas.Select(c => (int?)c.IdComuna).FirstOrDefaultAsync();
        var nueva = new Direccion
        {
            IdDireccion = nextId,
            Alias = string.IsNullOrWhiteSpace(dto.Alias) ? "Casa" : dto.Alias.Trim(),
            Calle = dto.Calle.Trim()[..Math.Min(dto.Calle.Trim().Length, 100)],
            Numero = dto.Numero ?? 1,
            Complemento = dto.Complemento?.Trim(),
            RegionCodigo = string.IsNullOrWhiteSpace(dto.Region) ? "RM" : dto.Region.Trim(),
            ComunaNombre = dto.Comuna.Trim(),
            CodigoPostal = dto.CodigoPostal,
            EsPredeterminada = dto.EsPredeterminada,
            RunUsuario = run,
            IdComuna = defaultComunaId
        };

        _context.Direcciones.Add(nueva);
        await _context.SaveChangesAsync();

        var updatedUser = await _userService.MapToDtoAsync(usuario);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<UsuarioDto>.Ok(updatedUser, "Dirección guardada correctamente."));
    }

    [HttpDelete("usuarios/{id}/direcciones/{direccionId:int}")]
    public async Task<IActionResult> DeleteDireccion(string id, int direccionId)
    {
        var run = RutValidator.ToBd2Run(id);
        var dir = await _context.Direcciones.FirstOrDefaultAsync(d => d.IdDireccion == direccionId && d.RunUsuario == run);
        if (dir is null)
        {
            return NotFound(ApiResponse.Fail("Dirección no encontrada."));
        }

        _context.Direcciones.Remove(dir);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("usuarios/{id}/postulacion-comercial")]
    public async Task<IActionResult> PostularRolComercial(string id, [FromBody] PostulacionComercialDto dto)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        var target = (dto.TargetRole ?? string.Empty).Trim();
        if (target is not ("VendedorProducto" or "ProveedorServicio" or "Ambos"))
        {
            return BadRequest(ApiResponse.Fail(
                "Rol comercial solicitado no válido.",
                "Selecciona VendedorProducto, ProveedorServicio o Ambos."));
        }

        usuario.RolSolicitado = target;
        usuario.Rol = target;
        usuario.TipoEmprendedor = true;
        usuario.EstadoAprobacion = "Pendiente";
        usuario.MotivoRechazoCuenta = null;

        if (!string.IsNullOrWhiteSpace(dto.NombreTienda)) usuario.NombreTienda = dto.NombreTienda.Trim();
        if (!string.IsNullOrWhiteSpace(dto.BiografiaTienda)) usuario.BiografiaTienda = dto.BiografiaTienda.Trim();
        if (!string.IsNullOrWhiteSpace(dto.CiudadBase)) usuario.CiudadBase = dto.CiudadBase.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Especialidad)) usuario.Especialidad = dto.Especialidad.Trim();

        await _context.SaveChangesAsync();

        var mapped = await _userService.MapToDtoAsync(usuario);
        return Ok(ApiResponse<UsuarioDto>.Ok(
            mapped,
            "Tu postulación comercial fue enviada a la cola de revisión del Administrador."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("admin/usuarios/{id}/aprobacion")]
    public async Task<IActionResult> ResolverAprobacionComercial(string id, [FromBody] AprobacionCuentaDto dto)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        var decision = (dto.Decision ?? string.Empty).Trim();
        if (decision is not ("Aprobado" or "Rechazado"))
        {
            return BadRequest(ApiResponse.Fail("Decisión inválida.", "El campo decision debe ser 'Aprobado' o 'Rechazado'."));
        }

        usuario.EstadoAprobacion = decision;
        if (decision == "Aprobado")
        {
            if (!string.IsNullOrWhiteSpace(usuario.RolSolicitado))
            {
                usuario.Rol = usuario.RolSolicitado;
            }
            usuario.TipoEmprendedor = true;
            usuario.MotivoRechazoCuenta = null;
            if (dto.Verificado.HasValue) usuario.Verificado = dto.Verificado.Value;
        }
        else
        {
            usuario.MotivoRechazoCuenta = string.IsNullOrWhiteSpace(dto.Motivo)
                ? "Postulación observada por Administración."
                : dto.Motivo.Trim();
        }

        await _context.SaveChangesAsync();

        var mapped = await _userService.MapToDtoAsync(usuario);
        return Ok(ApiResponse<UsuarioDto>.Ok(mapped, $"Cuenta comercial actualizada a '{decision}'."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("admin/usuarios/{id}/estado")]
    public async Task<IActionResult> CambiarEstadoORolAdmin(string id, [FromBody] EstadoCuentaDto dto)
    {
        var run = RutValidator.ToBd2Run(id);
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(callerRun, run, StringComparison.OrdinalIgnoreCase)
            && string.Equals(dto.EstadoCuenta, "Suspendido", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(ApiResponse.Fail(
                "Operación bloqueada.",
                "No puedes suspender tu propia cuenta de Administrador."));
        }

        if (!string.IsNullOrWhiteSpace(dto.EstadoCuenta))
        {
            if (dto.EstadoCuenta is not ("Activo" or "Suspendido"))
            {
                return BadRequest(ApiResponse.Fail("Estado inválido.", "El estado de cuenta solo puede ser 'Activo' o 'Suspendido'."));
            }
            usuario.EstadoCuenta = dto.EstadoCuenta;
        }

        if (!string.IsNullOrWhiteSpace(dto.Rol))
        {
            if (dto.Rol is not ("Comprador" or "VendedorProducto" or "ProveedorServicio" or "Ambos" or "Admin"))
            {
                return BadRequest(ApiResponse.Fail("Rol inválido."));
            }
            if (string.Equals(callerRun, run, StringComparison.OrdinalIgnoreCase) && dto.Rol != "Admin")
            {
                return Conflict(ApiResponse.Fail("Operación bloqueada.", "No puedes quitarte tu propio rol de Administrador."));
            }
            usuario.Rol = dto.Rol;
            usuario.TipoEmprendedor = dto.Rol != "Comprador";
            if (dto.Rol != "Comprador" && usuario.EstadoAprobacion == "NoAplica")
            {
                usuario.EstadoAprobacion = "Aprobado";
            }
        }

        if (dto.Verificado.HasValue)
        {
            usuario.Verificado = dto.Verificado.Value;
        }

        await _context.SaveChangesAsync();

        var mapped = await _userService.MapToDtoAsync(usuario);
        return Ok(ApiResponse<UsuarioDto>.Ok(mapped, "Estado administrativo del usuario actualizado."));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("usuarios/{id}")]
    public async Task<IActionResult> DeleteUsuario(string id)
    {
        var run = RutValidator.ToBd2Run(id);
        var callerRun = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(callerRun, run, StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(ApiResponse.Fail("Operación bloqueada.", "No puedes eliminar tu propia cuenta activa de Administrador."));
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Run == run);
        if (usuario is null)
        {
            return NotFound(ApiResponse.Fail("Usuario no encontrado."));
        }

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();

        // Diap. 14, 15 y 43 de Contenido backend-1.pdf: DELETE exitoso retorna 204 No Content
        return NoContent();
    }
}
