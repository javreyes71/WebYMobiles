import { mockProducts } from '@/data/products';
import { mockServices } from '@/data/services';
import { validateRUT, normalizeRUT, validateEmail, formatRUT } from '@/utils/validators';
import { hashPasswordSHA256 } from '@/utils/crypto';
import { logUserAction } from '@/utils/logger';
import {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  normalizeUserRoles,
  getRoleLabel,
} from '@/utils/roles';

/**
 * Capa de comunicación API REST alineada con "Contenido backend-1.pdf":
 * - Lee import.meta.env.VITE_API_URL
 * - Verifica explícitamente respuesta.ok en llamadas fetch()
 * - Emplea bloques try/catch y retorna el contrato JSON estandarizado:
 *   { success: boolean, message: string, data: any, errors: string[] | null, status: number }
 * - Si VITE_API_URL no está configurada, utiliza persistencia local en localStorage
 *   respetando exactamente los mismos códigos HTTP (200, 201, 400, 401, 403, 404, 409) y reglas RBAC.
 */

export const API_URL = import.meta.env.VITE_API_URL || '';

const STORAGE_KEYS = {
  USERS: 'vento_users_v2',
  SESSION: 'vento_session_v2',
  REMEMBER_RUT: 'vento_remember_rut_v2',
  CATALOG_PRODUCTS: 'vento_products_v3',
  CATALOG_SERVICES: 'vento_services_v3',
  CART: 'vento_cart_v2',
  ORDERS: 'vento_orders_v2',
  QUOTES: 'vento_quotes_v2',
  WISHLIST: 'vento_wishlist_v2',
  COMPANY: 'vento_company_v2',
  ADMINS: 'vento_admins_v2',
  COUPONS: 'vento_coupons_v2',
  TICKETS: 'vento_tickets_v2',
};

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && Array.isArray(parsed) && parsed.length < fallback.length) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
  }
};

const sanitizeUserDto = (userRecord) => {
  if (!userRecord) return null;
  const { passwordHint: _ignored, ...rest } = userRecord;
  return normalizeUserRoles(rest);
};

// Usuarios semilla para pruebas inmediatas de los 4 perfiles + cola de aprobación estricta
export const DEFAULT_USERS = [
  {
    id: 1,
    nombre: 'Administrador Vento',
    nombreTienda: 'Vento Oficial Store',
    rut: '12.345.678-5',
    rutNormalized: '123456785',
    correo: 'admin@vento.cl',
    telefono: '+56 9 8765 4321',
    direccion: 'Av. Providencia 1234, Santiago',
    fechaNacimiento: '1995-05-15',
    tipoCuenta: 'Empresa',
    rol: ROLES.ADMIN,
    rolesHabilitados: [ROLES.ADMIN, ROLES.COMPRADOR],
    estadoCuenta: ACCOUNT_STATUS.ACTIVO,
    estadoAprobacion: APPROVAL_STATUS.APROBADO,
    aprobacionesPorRol: { [ROLES.ADMIN]: APPROVAL_STATUS.APROBADO },
    verificado: true,
    passwordHint: 'admin1234',
  },
  {
    id: 2,
    nombre: 'Javier Reyes',
    nombreTienda: 'SneakerDrop CL',
    biografiaTienda: 'Especialistas en calzado urbano y lanzamientos limitados verificados con despacho a todo Chile.',
    ciudadBase: 'Concepción, Región del Biobío',
    rut: '11.111.111-1',
    rutNormalized: '111111111',
    correo: 'javier@vento.cl',
    telefono: '+56 9 1234 5678',
    direccion: 'Av. Los Carrera 850, Concepción',
    fechaNacimiento: '1999-08-20',
    tipoCuenta: 'VendedorProducto',
    rol: ROLES.VENDEDOR_PRODUCTO,
    rolesHabilitados: [ROLES.VENDEDOR_PRODUCTO, ROLES.COMPRADOR],
    estadoCuenta: ACCOUNT_STATUS.ACTIVO,
    estadoAprobacion: APPROVAL_STATUS.APROBADO,
    aprobacionesPorRol: { [ROLES.VENDEDOR_PRODUCTO]: APPROVAL_STATUS.APROBADO },
    verificado: true,
    passwordHint: 'vento1234',
  },
  {
    id: 3,
    nombre: 'María Silva',
    nombreTienda: 'SneakerCare & Custom Studio',
    biografiaTienda: 'Restauración, custom art, asesoría streetwear y luthería profesional con insumos certificados.',
    especialidad: 'Restauración, Custom Art & Cuidado Textil',
    experienciaAnios: 6,
    certificaciones: ['Certificación Angelus Direct Customizer', 'Restauración de Gamuza y Nobuck Premium'],
    ciudadBase: 'Concepción, Región del Biobío',
    rut: '22.222.222-2',
    rutNormalized: '222222222',
    correo: 'maria@vento.cl',
    telefono: '+56 9 5555 2222',
    direccion: 'O’Higgins 640, Concepción',
    fechaNacimiento: '1998-03-12',
    tipoCuenta: 'ProveedorServicio',
    rol: ROLES.PROVEEDOR_SERVICIO,
    rolesHabilitados: [ROLES.PROVEEDOR_SERVICIO, ROLES.COMPRADOR],
    estadoCuenta: ACCOUNT_STATUS.ACTIVO,
    estadoAprobacion: APPROVAL_STATUS.APROBADO,
    aprobacionesPorRol: { [ROLES.PROVEEDOR_SERVICIO]: APPROVAL_STATUS.APROBADO },
    verificado: true,
    passwordHint: 'servicio1234',
  },
  {
    id: 4,
    nombre: 'Pedro Pascal',
    rut: '15.555.555-6',
    rutNormalized: '155555556',
    correo: 'pedro@vento.cl',
    telefono: '+56 9 7777 4444',
    direccion: 'Av. Alemania 0420, Temuco',
    direcciones: [
      {
        id: 'addr-1',
        alias: 'Casa Principal',
        calle: 'Av. Alemania 0420, Depto 602',
        region: 'IX',
        comuna: 'Temuco',
        esPredeterminada: true,
      },
      {
        id: 'addr-2',
        alias: 'Oficina Estudio',
        calle: 'Av. Providencia 1945, Of. 304',
        region: 'RM',
        comuna: 'Providencia',
        esPredeterminada: false,
      },
    ],
    fechaNacimiento: '1997-11-04',
    tipoCuenta: 'Comprador',
    rol: ROLES.COMPRADOR,
    rolesHabilitados: [ROLES.COMPRADOR],
    estadoCuenta: ACCOUNT_STATUS.ACTIVO,
    estadoAprobacion: APPROVAL_STATUS.NO_APLICA,
    aprobacionesPorRol: {},
    verificado: false,
    passwordHint: 'compra1234',
  },
  {
    id: 5,
    nombre: 'Camila Ríos',
    nombreTienda: 'UrbanThreads Sur',
    biografiaTienda: 'Confección independiente de streetwear en el sur de Chile.',
    rut: '18.888.888-7',
    rutNormalized: '188888887',
    correo: 'camila@vento.cl',
    telefono: '+56 9 6666 8888',
    direccion: 'Av. Juan Mackenna 910, Osorno',
    fechaNacimiento: '2000-02-18',
    tipoCuenta: 'VendedorProducto',
    rol: ROLES.VENDEDOR_PRODUCTO,
    rolesHabilitados: [ROLES.VENDEDOR_PRODUCTO, ROLES.COMPRADOR],
    estadoCuenta: ACCOUNT_STATUS.ACTIVO,
    estadoAprobacion: APPROVAL_STATUS.PENDIENTE,
    aprobacionesPorRol: { [ROLES.VENDEDOR_PRODUCTO]: APPROVAL_STATUS.PENDIENTE },
    verificado: false,
    passwordHint: 'pendiente1234',
  },
];

const DEFAULT_ORDERS = [
  {
    id: '10045',
    compradorId: 4,
    compradorNombre: 'Pedro Pascal',
    compradorRut: '15.555.555-6',
    fecha: '02 de Octubre, 2026',
    subtotal: 63990,
    descuento: 0,
    envio: 0,
    total: 63990,
    estado: 'Entregado',
    trackingCodigo: 'STARKEN-8841209',
    courier: 'Starken',
    itemsCount: 1,
    items: [
      {
        id: 5,
        ownerId: 2,
        vendedorNombre: 'SneakerDrop CL',
        tipo: 'Producto',
        title: 'Air Jordan 4 Retro OG SP Brick by Brick',
        quantity: 1,
        price: 63990,
        estadoDespachoItem: 'Entregado',
      },
    ],
  },
  {
    id: '10089',
    compradorId: 4,
    compradorNombre: 'Pedro Pascal',
    compradorRut: '15.555.555-6',
    fecha: '05 de Octubre, 2026',
    subtotal: 64990,
    descuento: 0,
    envio: 0,
    total: 64990,
    estado: 'En Preparación',
    trackingCodigo: '',
    courier: '',
    itemsCount: 1,
    items: [
      {
        id: 2,
        ownerId: 2,
        vendedorNombre: 'SneakerDrop CL',
        tipo: 'Producto',
        title: 'Zapatilla Urbana Court Vision Low',
        quantity: 1,
        price: 64990,
        estadoDespachoItem: 'En Preparación',
      },
    ],
  },
];

const DEFAULT_QUOTES = [
  {
    id: 'COT-4899',
    compradorId: 4,
    proveedorId: 3,
    servicioId: 101,
    servicioNombre: 'Limpieza Profunda y Restauración Premium de Calzado',
    proveedor: 'SneakerCare & Custom Studio',
    precioReferencial: 18990,
    nombreContacto: 'Pedro Pascal',
    correoContacto: 'pedro@vento.cl',
    telefonoContacto: '+56 9 7777 4444',
    fechaDeseada: '2026-11-10',
    modalidadPreferida: 'Presencial',
    detalles: 'Necesito restauración completa de gamuza y blanqueamiento de entresuela en Jordan 4.',
    fechaCreacion: '25 de octubre de 2026',
    estado: 'Cotizado',
    propuestaProveedor: {
      monto: 24990,
      plazo: '72 horas hábiles',
      validez: '7 días corridos',
      detalle: 'Incluye limpieza ultrasónica, nutrición de gamuza, desoxidación UV de suela y sellado hidrofóbico.',
    },
  },
  {
    id: 'COT-4821',
    compradorId: 4,
    proveedorId: 3,
    servicioId: 102,
    servicioNombre: 'Personalización Custom Art en Calzado y Prendas',
    proveedor: 'SneakerCare & Custom Studio',
    precioReferencial: 35000,
    nombreContacto: 'Pedro Pascal',
    correoContacto: 'pedro@vento.cl',
    telefonoContacto: '+56 9 7777 4444',
    fechaDeseada: '2026-11-15',
    modalidadPreferida: 'Online',
    detalles: 'Deseo personalizar unas Air Force 1 blancas con motivos geométricos en azul marino.',
    fechaCreacion: '20 de octubre de 2026',
    estado: 'Pendiente',
    propuestaProveedor: null,
  },
];

const DEFAULT_TICKETS = [
  {
    id: 'TCK-1042',
    nombre: 'Camila Ríos',
    correo: 'camila@vento.cl',
    asunto: 'Consulta sobre aprobación de tienda regional',
    mensaje: 'Hola equipo Vento, envié mi postulación para UrbanThreads Sur desde Osorno y quería saber los plazos de revisión.',
    fecha: '28 de octubre de 2026',
    estado: 'Abierto',
    respuestaAdmin: '',
  },
];

const DEFAULT_COUPONS = [
  { code: 'VENTO10', rate: 0.1, label: '10% OFF Cupón Vento', active: true },
  { code: 'BIENVENIDO', rate: 0.15, label: '15% OFF Primera Compra', active: true },
  { code: 'VENTO20', rate: 0.2, label: '20% OFF Especial', active: true },
];

const getStoredJwtToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

/**
 * Cliente HTTP estándar para comunicarse con el Backend .NET cuando VITE_API_URL está activo.
 * Inyecta automáticamente Authorization: Bearer <JWT> y valida respuesta.ok.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const jwtToken = getStoredJwtToken();
  const authHeader = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

  try {
    const respuesta = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers || {}),
      },
    });

    const payload = respuesta.status !== 204 ? await respuesta.json().catch(() => null) : null;

    if (!respuesta.ok) {
      return {
        success: false,
        status: respuesta.status,
        message: payload?.message || `Error HTTP ${respuesta.status}`,
        data: null,
        errors: payload?.errors || [payload?.message || 'La solicitud no pudo completarse.'],
      };
    }

    return {
      success: payload?.success ?? true,
      status: respuesta.status,
      message: payload?.message || 'Operación exitosa.',
      data: payload?.data !== undefined ? payload.data : payload,
      errors: null,
    };
  } catch {
    return {
      success: false,
      status: 0,
      message:
        'No fue posible contactar al servidor backend. Verifica VITE_API_URL o la conexión.',
      data: null,
      errors: ['Fallo de conexión de red o CORS bloqueado.'],
    };
  }
}

// ==================== SERVICIO DE CATÁLOGO (PRODUCTOS Y SERVICIOS SEPARADOS) ====================

export const catalogApi = {
  async getProducts() {
    if (API_URL) {
      return apiFetch('/productos');
    }
    await delay(200);
    const products = readStorage(STORAGE_KEYS.CATALOG_PRODUCTS, mockProducts);
    return {
      success: true,
      status: 200,
      message: 'Productos obtenidos correctamente.',
      data: products.filter((p) => p.tipo === 'Producto'),
      errors: null,
    };
  },

  async getMyProducts() {
    if (API_URL) {
      return apiFetch('/productos/mis-publicaciones');
    }
    return this.getProducts();
  },

  async getServices() {
    if (API_URL) {
      return apiFetch('/servicios');
    }
    await delay(200);
    const services = readStorage(STORAGE_KEYS.CATALOG_SERVICES, mockServices);
    return {
      success: true,
      status: 200,
      message: 'Servicios obtenidos correctamente.',
      data: services.filter((s) => s.tipo === 'Servicio'),
      errors: null,
    };
  },

  async getMyServices() {
    if (API_URL) {
      return apiFetch('/servicios/mis-publicaciones');
    }
    return this.getServices();
  },

  async getAdminPending() {
    if (API_URL) {
      return apiFetch('/admin/catalogo/pendientes');
    }
    return { success: true, status: 200, message: 'OK', data: null, errors: null };
  },

  async createProduct(payload) {
    if (API_URL) {
      return apiFetch('/productos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return { success: true, status: 201, data: payload, errors: null };
  },

  async updateProduct(skuOrId, payload) {
    if (API_URL) {
      return apiFetch(`/productos/${encodeURIComponent(skuOrId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    return { success: true, status: 200, data: payload, errors: null };
  },

  async patchProductStock(skuOrId, stock) {
    if (API_URL) {
      return apiFetch(`/productos/${encodeURIComponent(skuOrId)}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: Number(stock) }),
      });
    }
    return { success: true, status: 200, data: { stock }, errors: null };
  },

  async deleteProduct(skuOrId) {
    if (API_URL) {
      return apiFetch(`/productos/${encodeURIComponent(skuOrId)}`, {
        method: 'DELETE',
      });
    }
    return { success: true, status: 204, data: null, errors: null };
  },

  async createService(payload) {
    if (API_URL) {
      return apiFetch('/servicios', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return { success: true, status: 201, data: payload, errors: null };
  },

  async updateService(skuOrId, payload) {
    if (API_URL) {
      return apiFetch(`/servicios/${encodeURIComponent(skuOrId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    return { success: true, status: 200, data: payload, errors: null };
  },

  async deleteService(skuOrId) {
    if (API_URL) {
      return apiFetch(`/servicios/${encodeURIComponent(skuOrId)}`, {
        method: 'DELETE',
      });
    }
    return { success: true, status: 204, data: null, errors: null };
  },

  async moderateItem(skuOrId, tipo, body) {
    if (API_URL) {
      const resource = tipo === 'Servicio' ? 'servicios' : 'productos';
      return apiFetch(`/admin/catalogo/${resource}/${encodeURIComponent(skuOrId)}/moderacion`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    }
    return { success: true, status: 200, data: body, errors: null };
  },

  saveProductsLocal(products) {
    writeStorage(STORAGE_KEYS.CATALOG_PRODUCTS, products);
  },

  saveServicesLocal(services) {
    writeStorage(STORAGE_KEYS.CATALOG_SERVICES, services);
  },
};

// ==================== SERVICIO DE AUTENTICACIÓN, RBAC Y RECUPERACIÓN ====================

export const authApi = {
  getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      // Si estamos conectados al Backend real (.NET + PostgreSQL) o la sesión trae token JWT,
      // respetamos directamente la sesión emitida por el servidor.
      if (API_URL || parsed?.token) {
        if (parsed?.estadoCuenta === ACCOUNT_STATUS.SUSPENDIDO) {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
          return null;
        }
        return normalizeUserRoles(parsed);
      }

      // Modo local: sincroniza sesión con estado actualizado en USERS
      const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
      const freshRecord = users.find(
        (u) => u.id === parsed.id || u.rutNormalized === normalizeRUT(parsed.rut)
      );
      if (freshRecord) {
        if (freshRecord.estadoCuenta === ACCOUNT_STATUS.SUSPENDIDO) {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
          return null;
        }
        return sanitizeUserDto(freshRecord);
      }
      return normalizeUserRoles(parsed);
    } catch {
      return null;
    }
  },

  saveSession(user) {
    if (user) {
      const existingToken = getStoredJwtToken();
      const sanitized = sanitizeUserDto(user);
      if (!sanitized.token && existingToken) {
        sanitized.token = existingToken;
      }
      writeStorage(STORAGE_KEYS.SESSION, sanitized);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },

  getRememberedRut() {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_RUT) || '';
  },

  setRememberedRut(rut) {
    if (rut) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_RUT, rut);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_RUT);
    }
  },

  async login({ rut, password }) {
    const errors = [];
    if (!rut || !validateRUT(rut)) {
      errors.push('Ingresa un RUT chileno válido (ej: 12.345.678-5).');
    }
    if (!password || password.length < 4) {
      errors.push('Ingresa tu contraseña para continuar.');
    }
    if (errors.length > 0) {
      return {
        success: false,
        status: 400,
        message: 'Datos de inicio de sesión inválidos.',
        data: null,
        errors,
      };
    }

    if (API_URL) {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ rut: formatRUT(rut), password }),
      });
      if (res.success && res.data) {
        this.saveSession(res.data);
      }
      return res;
    }

    await delay(500);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const cleanInputRut = normalizeRUT(rut);
    const existing = users.find((u) => u.rutNormalized === cleanInputRut);

    // Validación estricta 401: no permitir login fantasma a RUTs no registrados
    if (!existing) {
      return {
        success: false,
        status: 401,
        message: 'Cuenta no registrada.',
        data: null,
        errors: ['No existe ningún usuario registrado con este RUT. Regístrate primero.'],
      };
    }

    if (existing.passwordHint && existing.passwordHint !== password) {
      return {
        success: false,
        status: 401,
        message: 'Credenciales incorrectas.',
        data: null,
        errors: ['La contraseña ingresada no coincide con la cuenta registrada.'],
      };
    }

    // Validación 403 Forbidden: cuenta suspendida por el Administrador
    if (existing.estadoCuenta === ACCOUNT_STATUS.SUSPENDIDO) {
      return {
        success: false,
        status: 403,
        message: 'Cuenta suspendida.',
        data: null,
        errors: [
          'Tu cuenta se encuentra suspendida por Administración. Contacta a soporte para más información.',
        ],
      };
    }

    const userDto = sanitizeUserDto(existing);
    this.saveSession(userDto);

    return {
      success: true,
      status: 200,
      message: `Bienvenido/a, ${userDto.nombre} (${getRoleLabel(userDto.rol)}).`,
      data: userDto,
      errors: null,
    };
  },

  async register(formData) {
    const errors = [];
    const nombre = (formData.nombre || '').trim();
    const correo = (formData.correo || '').trim().toLowerCase();
    const direccion = (formData.direccion || '').trim();
    const requestedProfile = formData.tipoCuenta || ROLES.COMPRADOR;

    // Regla de negocio ("Contenido backend-1.pdf" p. 34): prohibido autoasignarse Admin
    if (requestedProfile === ROLES.ADMIN || formData.rol === ROLES.ADMIN) {
      return {
        success: false,
        status: 403,
        message: 'Operación no permitida.',
        data: null,
        errors: ['Un usuario no puede autoasignarse permisos de Administrador.'],
      };
    }

    if (nombre.length < 2 || nombre.length > 100) {
      errors.push('El nombre debe tener entre 2 y 100 caracteres.');
    }
    if (!validateRUT(formData.rut)) {
      errors.push('El RUT ingresado no es válido.');
    }
    if (!validateEmail(correo)) {
      errors.push('El correo electrónico no tiene un formato válido.');
    }
    if (!direccion) {
      errors.push('La dirección es obligatoria.');
    }
    if (!formData.password || formData.password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres.');
    }
    if (formData.password !== formData.confirmPassword) {
      errors.push('Las contraseñas no coinciden.');
    }

    if (errors.length > 0) {
      return {
        success: false,
        status: 400,
        message: 'Por favor corrige los errores del formulario.',
        data: null,
        errors,
      };
    }

    if (API_URL) {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success && res.data) {
        this.saveSession(res.data);
      }
      return res;
    }

    await delay(650);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const cleanInputRut = normalizeRUT(formData.rut);

    // Validación 409 Conflict por duplicados
    if (users.some((u) => u.rutNormalized === cleanInputRut)) {
      return {
        success: false,
        status: 409,
        message: 'El RUT ya se encuentra registrado.',
        data: null,
        errors: ['rut: Ya existe una cuenta asociada a este RUT.'],
      };
    }
    if (users.some((u) => u.correo?.toLowerCase() === correo)) {
      return {
        success: false,
        status: 409,
        message: 'El correo electrónico ya está registrado.',
        data: null,
        errors: ['correo: Ya existe un usuario con ese correo electrónico.'],
      };
    }

    let rol = ROLES.COMPRADOR;
    if (requestedProfile === ROLES.VENDEDOR_PRODUCTO || requestedProfile === 'Vendedor') {
      rol = ROLES.VENDEDOR_PRODUCTO;
    } else if (
      requestedProfile === ROLES.PROVEEDOR_SERVICIO ||
      requestedProfile === 'Empresa'
    ) {
      rol = ROLES.PROVEEDOR_SERVICIO;
    }

    const isCommercial = rol !== ROLES.COMPRADOR;
    const estadoAprobacion = isCommercial
      ? APPROVAL_STATUS.PENDIENTE
      : APPROVAL_STATUS.NO_APLICA;

    const passwordHash = await hashPasswordSHA256(formData.password);

    const initialPhone = (formData.telefono || '').trim();
    const phonesList = Array.isArray(formData.telefonos) && formData.telefonos.length > 0
      ? formData.telefonos
      : initialPhone ? [initialPhone] : [];

    const addressesList = Array.isArray(formData.direcciones) && formData.direcciones.length > 0
      ? formData.direcciones
      : direccion
        ? [
            {
              id: 'addr-1',
              alias: 'Principal',
              calle: direccion,
              region: 'RM',
              comuna: 'Santiago',
              esPredeterminada: true,
            },
          ]
        : [];

    const newUser = {
      id: Date.now(),
      nombre,
      nombreTienda: (formData.nombreTienda || '').trim() || (isCommercial ? nombre : ''),
      rut: formatRUT(formData.rut),
      rutNormalized: cleanInputRut,
      correo,
      telefono: phonesList[0] || '',
      telefonos: phonesList,
      direccion: addressesList[0]?.calle || direccion,
      direcciones: addressesList,
      fechaNacimiento: formData.fechaNacimiento || '',
      tipoCuenta: rol,
      rol,
      rolesHabilitados: isCommercial ? [rol, ROLES.COMPRADOR] : [ROLES.COMPRADOR],
      estadoCuenta: ACCOUNT_STATUS.ACTIVO,
      estadoAprobacion,
      aprobacionesPorRol: isCommercial ? { [rol]: APPROVAL_STATUS.PENDIENTE } : {},
      verificado: false,
      passwordHash,
      passwordHint: formData.password,
    };

    logUserAction('Creación de Usuario Registrado', newUser, {
      passwordHash,
      telefonos: phonesList,
      direcciones: addressesList,
    });

    const updatedUsers = [...users, newUser];
    writeStorage(STORAGE_KEYS.USERS, updatedUsers);

    const userDto = sanitizeUserDto(newUser);
    this.saveSession(userDto);

    return {
      success: true,
      status: 201,
      message: isCommercial
        ? 'Cuenta creada. Tu perfil comercial quedó en revisión del Administrador.'
        : 'Cuenta de comprador creada correctamente.',
      data: userDto,
      errors: null,
    };
  },

  async requestPasswordRecovery({ identifier }) {
    const value = (identifier || '').trim();
    if (!value) {
      return {
        success: false,
        status: 400,
        message: 'Ingresa tu correo o RUT para recuperar tu contraseña.',
        data: null,
        errors: ['El campo de correo o RUT es obligatorio.'],
      };
    }

    const isEmail = value.includes('@');
    if (isEmail && !validateEmail(value)) {
      return {
        success: false,
        status: 400,
        message: 'Formato de correo inválido.',
        data: null,
        errors: ['Ingresa un correo válido (ej: usuario@dominio.cl).'],
      };
    }
    if (!isEmail && !validateRUT(value)) {
      return {
        success: false,
        status: 400,
        message: 'RUT inválido.',
        data: null,
        errors: ['Ingresa un RUT chileno válido o un correo electrónico.'],
      };
    }

    if (API_URL) {
      return apiFetch('/auth/recuperar', {
        method: 'POST',
        body: JSON.stringify({ identifier: value }),
      });
    }

    await delay(650);
    return {
      success: true,
      status: 200,
      message:
        'Hemos enviado un enlace seguro de restablecimiento de contraseña al correo registrado.',
      data: { identifier: value },
      errors: null,
    };
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        status: 400,
        message: 'La nueva contraseña debe tener al menos 8 caracteres.',
        data: null,
        errors: ['Contraseña demasiado corta.'],
      };
    }

    if (API_URL) {
      return apiFetch('/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({ userId: String(userId), currentPassword, newPassword }),
      });
    }

    await delay(500);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, status: 404, message: 'Usuario no encontrado.', data: null, errors: ['No se encontró la cuenta.'] };
    }
    if (user.passwordHint && user.passwordHint !== currentPassword) {
      return { success: false, status: 401, message: 'Contraseña actual incorrecta.', data: null, errors: ['La contraseña actual ingresada no coincide.'] };
    }

    const nextUsers = users.map((u) => (u.id === userId ? { ...u, passwordHint: newPassword } : u));
    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    return { success: true, status: 200, message: 'Contraseña actualizada correctamente.', data: null, errors: null };
  },

  async updateProfile(updatedData) {
    const errors = [];
    if (!updatedData.nombre || updatedData.nombre.trim().length < 2) {
      errors.push('El nombre completo es obligatorio.');
    }
    if (updatedData.rut && !validateRUT(updatedData.rut)) {
      errors.push('El RUT ingresado no es válido.');
    }
    if (!validateEmail(updatedData.correo)) {
      errors.push('El correo electrónico no es válido.');
    }

    if (errors.length > 0) {
      return {
        success: false,
        status: 400,
        message: 'Datos de perfil inválidos.',
        data: null,
        errors,
      };
    }

    if (API_URL) {
      const targetId = updatedData.id || updatedData.run || updatedData.rut;
      const res = await apiFetch(`/usuarios/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      if (res.success && res.data) {
        this.saveSession(res.data);
      }
      return res;
    }

    await delay(350);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    let updatedRecord = null;

    const nextUsers = users.map((u) => {
      if (u.id === updatedData.id || u.rutNormalized === normalizeRUT(updatedData.rut)) {
        updatedRecord = {
          ...u,
          ...updatedData,
          rut: formatRUT(updatedData.rut),
          rutNormalized: normalizeRUT(updatedData.rut),
        };
        return updatedRecord;
      }
      return u;
    });

    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    const dto = sanitizeUserDto(updatedRecord || updatedData);
    this.saveSession(dto);

    logUserAction('Modificación de Perfil de Usuario', updatedRecord || updatedData, {
      cambios: Object.keys(updatedData),
      telefonos: (updatedRecord || updatedData).telefonos,
      direcciones: (updatedRecord || updatedData).direcciones,
    });

    return {
      success: true,
      status: 200,
      message: 'Perfil actualizado correctamente.',
      data: dto,
      errors: null,
    };
  },
};

// ==================== ADMINISTRACIÓN DE USUARIOS Y SOLICITUDES DE ROL ====================

export const usersApi = {
  getAllUsers() {
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return users.map(sanitizeUserDto);
  },

  async fetchAllUsersAsync() {
    if (API_URL) {
      const res = await apiFetch('/usuarios');
      if (res.success && Array.isArray(res.data)) {
        writeStorage(STORAGE_KEYS.USERS, res.data);
        return res;
      }
      return res;
    }
    return {
      success: true,
      status: 200,
      message: 'Usuarios cargados localmente.',
      data: this.getAllUsers(),
      errors: null,
    };
  },

  getPublicUserById(userId) {
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const found = users.find(
      (u) => String(u.id) === String(userId) || String(u.run) === String(userId)
    );
    return found ? sanitizeUserDto(found) : null;
  },

  async fetchPublicUserAsync(userId) {
    if (API_URL) {
      return apiFetch(`/usuarios/${encodeURIComponent(userId)}/publico`);
    }
    const local = this.getPublicUserById(userId);
    return local
      ? { success: true, status: 200, data: local, errors: null }
      : { success: false, status: 404, message: 'Perfil no encontrado.', data: null, errors: ['404'] };
  },

  async requestRoleUpgrade(userId, targetRole, extraInfo = {}) {
    if (API_URL) {
      const res = await apiFetch(`/usuarios/${encodeURIComponent(userId)}/postulacion-comercial`, {
        method: 'POST',
        body: JSON.stringify({
          targetRole,
          ...extraInfo,
        }),
      });
      if (res.success && res.data) {
        authApi.saveSession(res.data);
      }
      return res;
    }

    await delay(450);
    const requestedRoles =
      targetRole === 'Ambos'
        ? [ROLES.VENDEDOR_PRODUCTO, ROLES.PROVEEDOR_SERVICIO]
        : [ROLES.VENDEDOR_PRODUCTO, ROLES.PROVEEDOR_SERVICIO].includes(targetRole)
          ? [targetRole]
          : [];

    if (requestedRoles.length === 0) {
      return {
        success: false,
        status: 400,
        message: 'Rol comercial solicitado no válido.',
        data: null,
        errors: ['Selecciona Vendedor de Productos, Proveedor de Servicios o Ambos.'],
      };
    }

    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    let updatedDto = null;

    const nextUsers = users.map((u) => {
      if (u.id !== userId) return u;
      const rolesSet = new Set([...(u.rolesHabilitados || [ROLES.COMPRADOR]), ...requestedRoles]);
      const nextAprobaciones = { ...(u.aprobacionesPorRol || {}) };
      requestedRoles.forEach((r) => {
        if (nextAprobaciones[r] !== APPROVAL_STATUS.APROBADO) {
          nextAprobaciones[r] = APPROVAL_STATUS.PENDIENTE;
        }
      });
      const primaryRole = u.rol === ROLES.COMPRADOR ? requestedRoles[0] : u.rol;
      const updated = {
        ...u,
        rol: primaryRole,
        rolesHabilitados: Array.from(rolesSet),
        estadoAprobacion: APPROVAL_STATUS.PENDIENTE,
        aprobacionesPorRol: nextAprobaciones,
        nombreTienda: extraInfo.nombreTienda || u.nombreTienda || u.nombre,
        biografiaTienda: extraInfo.biografiaTienda || u.biografiaTienda || '',
        especialidad: extraInfo.especialidad || u.especialidad || '',
      };
      updatedDto = sanitizeUserDto(updated);
      return updated;
    });

    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    if (updatedDto) authApi.saveSession(updatedDto);

    const roleText =
      targetRole === 'Ambos'
        ? 'Vendedor de Productos y Proveedor de Servicios'
        : getRoleLabel(targetRole);

    return {
      success: true,
      status: 200,
      message: `Solicitud para ${roleText} enviada a revisión del Administrador.`,
      data: updatedDto,
      errors: null,
    };
  },

  async moderateUserRole(userId, targetRole, decision, motivoRechazo = '') {
    if (API_URL) {
      const res = await apiFetch(`/admin/usuarios/${encodeURIComponent(userId)}/aprobacion`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          motivo: motivoRechazo,
          verificado: decision === APPROVAL_STATUS.APROBADO,
        }),
      });
      if (!res.success) return res;
      const refreshed = await this.fetchAllUsersAsync();
      return {
        ...res,
        data: refreshed.data || this.getAllUsers(),
      };
    }

    await delay(400);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const nextUsers = users.map((u) => {
      if (u.id !== userId) return u;
      const nextAprobaciones = {
        ...(u.aprobacionesPorRol || {}),
      };
      if (targetRole === 'Todos') {
        Object.keys(nextAprobaciones).forEach((k) => {
          nextAprobaciones[k] = decision;
        });
      } else {
        nextAprobaciones[targetRole] = decision;
      }

      const statuses = Object.values(nextAprobaciones);
      const overallStatus = statuses.includes(APPROVAL_STATUS.PENDIENTE)
        ? APPROVAL_STATUS.PENDIENTE
        : statuses.includes(APPROVAL_STATUS.APROBADO)
          ? APPROVAL_STATUS.APROBADO
          : decision;

      return {
        ...u,
        estadoAprobacion: overallStatus,
        aprobacionesPorRol: nextAprobaciones,
        motivoRechazoRol: decision === APPROVAL_STATUS.RECHAZADO ? motivoRechazo : '',
      };
    });
    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    return {
      success: true,
      status: 200,
      message: `Estado comercial actualizado a ${decision}.`,
      data: nextUsers.map(sanitizeUserDto),
      errors: null,
    };
  },

  async updateUserByAdmin(userId, changes) {
    if (API_URL) {
      const res = await apiFetch(`/admin/usuarios/${encodeURIComponent(userId)}/estado`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
      if (!res.success) return res;
      const refreshed = await this.fetchAllUsersAsync();
      return {
        ...res,
        data: refreshed.data || this.getAllUsers(),
      };
    }

    await delay(350);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const nextUsers = users.map((u) => (u.id === userId ? { ...u, ...changes } : u));
    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    const updated = nextUsers.find((u) => u.id === userId);
    logUserAction('Modificación de Usuario por Administrador', updated || { id: userId, ...changes }, {
      cambios: Object.keys(changes),
    });
    return {
      success: true,
      status: 200,
      message: 'Usuario actualizado por Administración.',
      data: nextUsers.map(sanitizeUserDto),
      errors: null,
    };
  },

  async deleteUserByAdmin(userId) {
    if (API_URL) {
      const res = await apiFetch(`/usuarios/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (!res.success) return res;
      const refreshed = await this.fetchAllUsersAsync();
      return {
        success: true,
        status: 204,
        message: 'Cuenta eliminada por Administración.',
        data: refreshed.data || this.getAllUsers(),
        errors: null,
      };
    }

    await delay(350);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const nextUsers = users.filter((u) => u.id !== userId);
    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    return {
      success: true,
      status: 200,
      message: 'Cuenta eliminada por Administración.',
      data: nextUsers.map(sanitizeUserDto),
      errors: null,
    };
  },
};

// ==================== SERVICIO DE PEDIDOS, CARRITO, FAVORITOS, COTIZACIONES Y SOPORTE ====================

export const storageApi = {
  getCart() {
    return readStorage(STORAGE_KEYS.CART, []);
  },
  saveCart(items) {
    writeStorage(STORAGE_KEYS.CART, items);
  },
  getWishlist(userId = 'guest') {
    return readStorage(`${STORAGE_KEYS.WISHLIST}_${userId || 'guest'}`, []);
  },
  saveWishlist(ids, userId = 'guest') {
    writeStorage(`${STORAGE_KEYS.WISHLIST}_${userId || 'guest'}`, ids);
  },
  getOrders() {
    return readStorage(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  },
  saveOrders(orders) {
    writeStorage(STORAGE_KEYS.ORDERS, orders);
  },
  addOrder(order) {
    const current = this.getOrders();
    const next = [order, ...current];
    writeStorage(STORAGE_KEYS.ORDERS, next);
    return next;
  },
  async fetchOrdersAsync(isSeller = false) {
    if (API_URL) {
      const endpoint = isSeller ? '/ordenes/vendedor' : '/ordenes/mias';
      const res = await apiFetch(endpoint);
      if (res.success && Array.isArray(res.data)) {
        writeStorage(STORAGE_KEYS.ORDERS, res.data);
      }
      return res;
    }
    return { success: true, status: 200, data: this.getOrders(), errors: null };
  },
  async createOrderAsync(orderPayload) {
    if (API_URL) {
      return apiFetch('/ordenes', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
    }
    return { success: true, status: 201, data: orderPayload, errors: null };
  },
  async updateDispatchAsync(orderId, dispatchPayload) {
    if (API_URL) {
      return apiFetch(`/ordenes/${encodeURIComponent(orderId)}/despacho`, {
        method: 'PATCH',
        body: JSON.stringify(dispatchPayload),
      });
    }
    return { success: true, status: 200, data: dispatchPayload, errors: null };
  },
  getQuotes() {
    return readStorage(STORAGE_KEYS.QUOTES, DEFAULT_QUOTES);
  },
  saveQuotes(quotes) {
    writeStorage(STORAGE_KEYS.QUOTES, quotes);
  },
  async fetchQuotesAsync() {
    if (API_URL) {
      const res = await apiFetch('/cotizaciones');
      if (res.success && Array.isArray(res.data)) {
        writeStorage(STORAGE_KEYS.QUOTES, res.data);
      }
      return res;
    }
    return { success: true, status: 200, data: this.getQuotes(), errors: null };
  },
  async createQuote(quotePayload) {
    if (API_URL) {
      const res = await apiFetch('/cotizaciones', {
        method: 'POST',
        body: JSON.stringify(quotePayload),
      });
      if (res.success && res.data) {
        const next = [res.data, ...this.getQuotes()];
        writeStorage(STORAGE_KEYS.QUOTES, next);
      }
      return res;
    }

    await delay(500);
    const current = this.getQuotes();
    const newQuote = {
      id: `COT-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      estado: 'Pendiente',
      propuestaProveedor: null,
      ...quotePayload,
    };
    const next = [newQuote, ...current];
    writeStorage(STORAGE_KEYS.QUOTES, next);
    return {
      success: true,
      status: 201,
      message: 'Solicitud de cotización enviada al proveedor.',
      data: newQuote,
      errors: null,
    };
  },
  async sendQuoteProposalAsync(quoteId, proposalPayload) {
    if (API_URL) {
      return apiFetch(`/cotizaciones/${encodeURIComponent(quoteId)}/propuesta`, {
        method: 'PATCH',
        body: JSON.stringify(proposalPayload),
      });
    }
    return { success: true, status: 200, data: proposalPayload, errors: null };
  },
  async updateQuoteStatusAsync(quoteId, estado) {
    if (API_URL) {
      return apiFetch(`/cotizaciones/${encodeURIComponent(quoteId)}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
    }
    return { success: true, status: 200, data: { estado }, errors: null };
  },
  async createReviewAsync(reviewPayload) {
    if (API_URL) {
      return apiFetch('/resenas', {
        method: 'POST',
        body: JSON.stringify(reviewPayload),
      });
    }
    return { success: true, status: 201, data: reviewPayload, errors: null };
  },
  getCoupons() {
    return readStorage(STORAGE_KEYS.COUPONS, DEFAULT_COUPONS);
  },
  saveCoupons(coupons) {
    writeStorage(STORAGE_KEYS.COUPONS, coupons);
  },
  async validateCouponAsync(code) {
    if (API_URL) {
      return apiFetch(`/cupones/validar/${encodeURIComponent(code)}`);
    }
    return null;
  },
  getTickets() {
    return readStorage(STORAGE_KEYS.TICKETS, DEFAULT_TICKETS);
  },
  saveTickets(tickets) {
    writeStorage(STORAGE_KEYS.TICKETS, tickets);
  },
  addTicket(ticketPayload) {
    const current = this.getTickets();
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      estado: 'Abierto',
      respuestaAdmin: '',
      ...ticketPayload,
    };
    const next = [newTicket, ...current];
    writeStorage(STORAGE_KEYS.TICKETS, next);
    if (API_URL) {
      apiFetch('/contacto', {
        method: 'POST',
        body: JSON.stringify(ticketPayload),
      }).catch(() => {});
    }
    return newTicket;
  },
  getCompany() {
    return readStorage(STORAGE_KEYS.COMPANY, {
      rut: '77.777.777-7',
      nombre: 'Vento Marketplace SpA',
      sitioWeb: 'vento.cl',
      logo: '',
    });
  },
  saveCompany(company) {
    writeStorage(STORAGE_KEYS.COMPANY, company);
    if (API_URL) {
      apiFetch('/admin/empresa', {
        method: 'PUT',
        body: JSON.stringify(company),
      }).catch(() => {});
    }
  },
  getAdmins() {
    return readStorage(STORAGE_KEYS.ADMINS, [
      { id: 1, nombre: 'Administrador Vento', correo: 'admin@vento.cl', rol: 'Admin', estado: 'Activo' },
    ]);
  },
  saveAdmins(admins) {
    writeStorage(STORAGE_KEYS.ADMINS, admins);
  },
};

// ==================== SERVICIO DE VISTAS ANALÍTICAS BD2 (POSTGRESQL) ====================

export const analyticsApi = {
  async getInventarioCritico() {
    if (API_URL) return apiFetch('/analitica/inventario-critico');
    return { success: true, data: { vistaInventarioCritico: [], alertasTriggerTrg08: [] } };
  },
  async getRendimientoEmprendedores() {
    if (API_URL) return apiFetch('/analitica/rendimiento-emprendedores');
    return { success: true, data: { vistaRendimientoEmprendedor: [], kpisGlobales: {} } };
  },
  async getFacturasFiscales() {
    if (API_URL) return apiFetch('/analitica/facturas');
    return { success: true, data: [] };
  },
  async getCatalogoUnificado(query = '') {
    if (API_URL) return apiFetch(`/analitica/catalogo-unificado${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    return { success: true, data: [] };
  },
  async getGeoEmpresas() {
    if (API_URL) return apiFetch('/analitica/geo-empresas');
    return { success: true, data: [] };
  },
  async getCategoriasJerarquia() {
    if (API_URL) return apiFetch('/analitica/categorias-jerarquia');
    return { success: true, data: [] };
  },
};
