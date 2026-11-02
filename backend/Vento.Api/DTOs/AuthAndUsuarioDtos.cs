namespace Vento.Api.DTOs;

public class LoginRequestDto
{
    public string? Rut { get; set; }
    public string? Password { get; set; }
}

public class RecuperarPasswordDto
{
    public string? Identifier { get; set; }
}

public class CambiarPasswordDto
{
    public string? UserId { get; set; }
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}

/// <summary>
/// DTO de creación (Diap. 28 de Contenido backend-1.pdf).
/// </summary>
public class UsuarioCreateDto
{
    public string? Nombre { get; set; }
    public string? Rut { get; set; }
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? Password { get; set; }
    public string? ConfirmPassword { get; set; }
    public string? TipoCuenta { get; set; }
    public string? Rol { get; set; }
    public string? NombreTienda { get; set; }
    public string? BiografiaTienda { get; set; }
    public string? CiudadBase { get; set; }
    public string? Especialidad { get; set; }
}

public class UsuarioUpdateDto
{
    public string? Nombre { get; set; }
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? NombreTienda { get; set; }
    public string? BiografiaTienda { get; set; }
    public string? CiudadBase { get; set; }
    public string? Especialidad { get; set; }
    public int? ExperienciaAnios { get; set; }
    public List<DireccionDto>? Direcciones { get; set; }
}

public class DireccionDto
{
    public string Id { get; set; } = string.Empty;
    public string Alias { get; set; } = "Principal";
    public string Calle { get; set; } = string.Empty;
    public int? Numero { get; set; }
    public string? Complemento { get; set; }
    public string Region { get; set; } = "RM";
    public string Comuna { get; set; } = "Santiago";
    public int? CodigoPostal { get; set; }
    public bool EsPredeterminada { get; set; }
}

public class DireccionCreateDto
{
    public string? Alias { get; set; }
    public string? Calle { get; set; }
    public int? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Region { get; set; }
    public string? Comuna { get; set; }
    public int? CodigoPostal { get; set; }
    public bool EsPredeterminada { get; set; }
}

public class PostulacionComercialDto
{
    public string? TargetRole { get; set; }
    public string? NombreTienda { get; set; }
    public string? BiografiaTienda { get; set; }
    public string? CiudadBase { get; set; }
    public string? Especialidad { get; set; }
}

public class AprobacionCuentaDto
{
    /// <summary>
    /// 'Aprobado' | 'Rechazado'
    /// </summary>
    public string? Decision { get; set; }
    public string? Motivo { get; set; }
    public bool? Verificado { get; set; }
}

public class EstadoCuentaDto
{
    /// <summary>
    /// 'Activo' | 'Suspendido'
    /// </summary>
    public string? EstadoCuenta { get; set; }
    public string? Rol { get; set; }
    public bool? Verificado { get; set; }
}

/// <summary>
/// DTO de respuesta segura al cliente (Diap. 28: NUNCA incluye ClaveAcceso / PasswordHash).
/// Compatible con los nombres esperados por React (AuthContext, Perfil, AdminUsuarios).
/// </summary>
public class UsuarioDto
{
    public string Id { get; set; } = string.Empty;
    public string Run { get; set; } = string.Empty;
    public string Rut { get; set; } = string.Empty;
    public string RutNormalized { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string FechaNacimiento { get; set; } = string.Empty;
    public string TipoCuenta { get; set; } = "Comprador";
    public string Rol { get; set; } = "Comprador";
    public string? RolSolicitado { get; set; }
    public List<string> RolesHabilitados { get; set; } = new();
    public string EstadoCuenta { get; set; } = "Activo";
    public string EstadoAprobacion { get; set; } = "NoAplica";
    public Dictionary<string, string> AprobacionesPorRol { get; set; } = new();
    public string? MotivoRechazoCuenta { get; set; }
    public bool Verificado { get; set; }
    public string NombreTienda { get; set; } = string.Empty;
    public string BiografiaTienda { get; set; } = string.Empty;
    public string CiudadBase { get; set; } = string.Empty;
    public string Especialidad { get; set; } = string.Empty;
    public int ExperienciaAnios { get; set; }
    public decimal DescuentoProximaCompra { get; set; }
    public List<DireccionDto> Direcciones { get; set; } = new();
    public string? Token { get; set; }
}
