/**
 * Utilidad de telemetría y logging visual enriquecido para consola de desarrollo.
 * Permite a docentes, estudiantes y evaluadores verificar en tiempo real:
 * - Creación y registro de usuarios con hash SHA-256 generado
 * - Modificaciones de perfil (direcciones, teléfonos, nombres)
 * - Cambios de rol o suspensiones ejecutadas por el Administrador
 */
export const logUserAction = (action, userPayload = {}, extraInfo = {}) => {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  const headerStyle =
    'background: #111827; color: #38bdf8; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 4px;';
  const subStyle = 'color: #10b981; font-weight: bold; font-size: 11px;';
  const labelStyle = 'color: #64748b; font-weight: bold; font-size: 11px;';

  console.groupCollapsed(`%c[VENTO AUTH · ${timestamp}] %c${action.toUpperCase()}`, headerStyle, subStyle);
  console.log('%cOperación:', labelStyle, action);
  console.log('%cNombre Titular:', labelStyle, userPayload.nombre || userPayload.name || 'Sin nombre');
  console.log('%cRUT Chileno:', labelStyle, userPayload.rut || userPayload.run || 'Sin RUT');
  console.log('%cCorreo:', labelStyle, userPayload.correo || userPayload.email || 'Sin correo');
  console.log('%cRol RBAC:', labelStyle, userPayload.rol || userPayload.tipoCuenta || 'Comprador');

  if (extraInfo.passwordHash) {
    console.log(
      '%cHash Criptográfico SHA-256:',
      'background: #312e81; color: #c084fc; font-family: monospace; font-size: 11px; padding: 2px 6px; border-radius: 3px;',
      extraInfo.passwordHash
    );
  }

  if (extraInfo.cambios) {
    console.log('%cCampos modificados:', labelStyle, extraInfo.cambios);
  }

  if (extraInfo.telefonos && extraInfo.telefonos.length > 0) {
    console.log('%cTeléfonos registrados:', labelStyle, extraInfo.telefonos);
  }

  if (extraInfo.direcciones && extraInfo.direcciones.length > 0) {
    console.log('%cDirecciones registradas:', labelStyle, extraInfo.direcciones);
  }

  console.log('%cRegistro completo en memoria / backend:', labelStyle, userPayload);
  console.groupEnd();
};
