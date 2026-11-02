/**
 * Definición centralizada de Roles (RBAC) y Estados de Moderación Estricta
 * para los 4 perfiles de Vento Marketplace:
 * - Admin: Gobierno total, aprobación previa de cuentas comerciales y publicaciones
 * - VendedorProducto: Gestión de inventario propio de productos y despachos (+ capacidad de compra)
 * - ProveedorServicio: Gestión de portafolio propio de servicios y cotizaciones (+ capacidad de compra)
 * - Comprador: Compra de productos, solicitud/aceptación de cotizaciones y postulación a rol comercial
 */

export const ROLES = {
  ADMIN: 'Admin',
  VENDEDOR_PRODUCTO: 'VendedorProducto',
  PROVEEDOR_SERVICIO: 'ProveedorServicio',
  COMPRADOR: 'Comprador',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador General',
  [ROLES.VENDEDOR_PRODUCTO]: 'Vendedor de Productos',
  [ROLES.PROVEEDOR_SERVICIO]: 'Proveedor de Servicios',
  [ROLES.COMPRADOR]: 'Comprador',
};

export const ACCOUNT_STATUS = {
  ACTIVO: 'Activo',
  SUSPENDIDO: 'Suspendido',
};

export const APPROVAL_STATUS = {
  NO_APLICA: 'NoAplica',
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export const MODERATION_STATUS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PAUSADO: 'Pausado',
};

export const MODERATION_BADGE_STYLES = {
  [MODERATION_STATUS.APROBADO]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [MODERATION_STATUS.PENDIENTE]: 'bg-amber-100 text-amber-800 border-amber-200',
  [MODERATION_STATUS.RECHAZADO]: 'bg-red-100 text-red-800 border-red-200',
  [MODERATION_STATUS.PAUSADO]: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * Normaliza un objeto de usuario garantizando compatibilidad con sesiones previas
 * y asegurando que todo perfil comercial conserve también capacidad de Comprador.
 */
export const normalizeUserRoles = (user) => {
  if (!user) return null;

  let primaryRole = user.rol || ROLES.COMPRADOR;
  if (primaryRole === 'Cliente') primaryRole = ROLES.COMPRADOR;
  if (primaryRole === 'Vendedor') {
    primaryRole =
      user.tipoCuenta === 'Empresa' || user.tipoCuenta === 'ProveedorServicio'
        ? ROLES.PROVEEDOR_SERVICIO
        : ROLES.VENDEDOR_PRODUCTO;
  }

  const baseRoles = Array.isArray(user.rolesHabilitados) ? [...user.rolesHabilitados] : [];
  if (!baseRoles.includes(primaryRole)) baseRoles.push(primaryRole);
  if (!baseRoles.includes(ROLES.COMPRADOR)) baseRoles.push(ROLES.COMPRADOR);

  const defaultApproval =
    primaryRole === ROLES.ADMIN
      ? APPROVAL_STATUS.APROBADO
      : primaryRole === ROLES.COMPRADOR
        ? APPROVAL_STATUS.NO_APLICA
        : user.estadoAprobacion || APPROVAL_STATUS.PENDIENTE;

  const aprobacionesPorRol = {
    ...(user.aprobacionesPorRol || {}),
  };

  if (
    primaryRole === ROLES.VENDEDOR_PRODUCTO &&
    !aprobacionesPorRol[ROLES.VENDEDOR_PRODUCTO]
  ) {
    aprobacionesPorRol[ROLES.VENDEDOR_PRODUCTO] = defaultApproval;
  }
  if (
    primaryRole === ROLES.PROVEEDOR_SERVICIO &&
    !aprobacionesPorRol[ROLES.PROVEEDOR_SERVICIO]
  ) {
    aprobacionesPorRol[ROLES.PROVEEDOR_SERVICIO] = defaultApproval;
  }

  return {
    ...user,
    rol: primaryRole,
    rolesHabilitados: baseRoles,
    estadoCuenta: user.estadoCuenta || ACCOUNT_STATUS.ACTIVO,
    estadoAprobacion: defaultApproval,
    aprobacionesPorRol,
  };
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role || 'Comprador';

export const hasRole = (user, targetRole) => {
  if (!user) return false;
  const normalized = normalizeUserRoles(user);
  return (
    normalized.rol === targetRole ||
    normalized.rolesHabilitados.includes(targetRole)
  );
};

export const hasAnyRole = (user, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return Boolean(user);
  return allowedRoles.some((r) => hasRole(user, r));
};

export const canAccessProductPanel = (user) => {
  if (!user) return false;
  return (
    hasRole(user, ROLES.ADMIN) ||
    hasRole(user, ROLES.VENDEDOR_PRODUCTO) ||
    Boolean(user.aprobacionesPorRol?.[ROLES.VENDEDOR_PRODUCTO])
  );
};

export const canAccessServicePanel = (user) => {
  if (!user) return false;
  return (
    hasRole(user, ROLES.ADMIN) ||
    hasRole(user, ROLES.PROVEEDOR_SERVICIO) ||
    Boolean(user.aprobacionesPorRol?.[ROLES.PROVEEDOR_SERVICIO])
  );
};

export const getCommercialApprovalStatus = (user, targetRole) => {
  if (!user) return APPROVAL_STATUS.NO_APLICA;
  const normalized = normalizeUserRoles(user);
  if (normalized.rol === ROLES.ADMIN) return APPROVAL_STATUS.APROBADO;
  if (normalized.aprobacionesPorRol?.[targetRole]) {
    return normalized.aprobacionesPorRol[targetRole];
  }
  if (normalized.rol === targetRole) {
    return normalized.estadoAprobacion || APPROVAL_STATUS.PENDIENTE;
  }
  return APPROVAL_STATUS.NO_APLICA;
};

export const isApprovedForCommercialRole = (user, targetRole) =>
  getCommercialApprovalStatus(user, targetRole) === APPROVAL_STATUS.APROBADO;

/**
 * Regla de Moderación Estricta al Editar:
 * - Si cambian campos de contenido comercial público (nombre, precio, imagen, descripción,
 *   categoría, marca, modalidad, tiempoEstimado, cobertura, etc.), requiere nueva aprobación ("Pendiente").
 * - Si solo cambia stock o el estado Pausado/Aprobado, NO requiere re-aprobación del Admin.
 */
export const didCommercialContentChange = (existingItem, updatedItem) => {
  if (!existingItem || !updatedItem) return true;

  const str = (v) => String(v ?? '').trim();
  const num = (v) => Number(v ?? 0);

  const oldName = str(existingItem.nombre || existingItem.title);
  const newName = str(updatedItem.nombre ?? updatedItem.title ?? oldName);

  const oldPrice = num(existingItem.precio ?? existingItem.price);
  const newPrice = num(updatedItem.precio ?? updatedItem.price ?? oldPrice);

  const oldDesc = str(existingItem.descripcion || existingItem.description);
  const newDesc = str(updatedItem.descripcion ?? updatedItem.description ?? oldDesc);

  const oldBrand = str(existingItem.marca || existingItem.brand);
  const newBrand = str(updatedItem.marca ?? updatedItem.brand ?? oldBrand);

  const oldCat = str(existingItem.categoria);
  const newCat = str(updatedItem.categoria ?? oldCat);

  const oldImage = str(existingItem.image);
  const newImage = str(updatedItem.image ?? oldImage);

  const oldModalidad = str(existingItem.modalidad);
  const newModalidad = str(updatedItem.modalidad ?? oldModalidad);

  const oldTiempo = str(existingItem.tiempoEstimado);
  const newTiempo = str(updatedItem.tiempoEstimado ?? oldTiempo);

  return (
    oldName !== newName ||
    oldPrice !== newPrice ||
    oldDesc !== newDesc ||
    oldBrand !== newBrand ||
    oldCat !== newCat ||
    oldImage !== newImage ||
    oldModalidad !== newModalidad ||
    oldTiempo !== newTiempo
  );
};
