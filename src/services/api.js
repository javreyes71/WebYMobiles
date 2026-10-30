import { mockProducts } from '@/data/products';
import { mockServices } from '@/data/services';
import { validateRUT, normalizeRUT, validateEmail, formatRUT } from '@/utils/validators';

/**
 * Capa de comunicación API REST alineada con "Contenido backend-1.pdf":
 * - Lee import.meta.env.VITE_API_URL
 * - Verifica explícitamente respuesta.ok en llamadas fetch()
 * - Emplea bloques try/catch y retorna el contrato JSON estandarizado:
 *   { success: boolean, message: string, data: any, errors: string[] | null, status: number }
 * - Si VITE_API_URL no está configurada, utiliza persistencia local en localStorage
 *   respetando exactamente los mismos códigos HTTP (200, 201, 400, 401, 404, 409) y validaciones.
 */

export const API_URL = import.meta.env.VITE_API_URL || '';

const STORAGE_KEYS = {
  USERS: 'vento_users_v1',
  SESSION: 'vento_session_v1',
  REMEMBER_RUT: 'vento_remember_rut_v1',
  CATALOG_PRODUCTS: 'vento_products_v1',
  CATALOG_SERVICES: 'vento_services_v1',
  CART: 'vento_cart_v1',
  ORDERS: 'vento_orders_v1',
  QUOTES: 'vento_quotes_v1',
  WISHLIST: 'vento_wishlist_v1',
  COMPANY: 'vento_company_v1',
  ADMINS: 'vento_admins_v1',
};

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
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

// Usuarios semilla para pruebas inmediatas (Admin, Vendedor y Comprador)
const DEFAULT_USERS = [
  {
    id: 1,
    nombre: 'Administrador Vento',
    rut: '12.345.678-5',
    rutNormalized: '123456785',
    correo: 'admin@vento.cl',
    telefono: '+56 9 8765 4321',
    direccion: 'Av. Providencia 1234, Santiago',
    fechaNacimiento: '1995-05-15',
    tipoCuenta: 'Empresa',
    rol: 'Admin',
    // Simulación de clave registrada para pruebas locales (en backend .NET se almacena PasswordHash con Bcrypt)
    passwordHint: 'admin1234',
  },
  {
    id: 2,
    nombre: 'Javier Reyes',
    rut: '11.111.111-1',
    rutNormalized: '111111111',
    correo: 'javier@vento.cl',
    telefono: '+56 9 1234 5678',
    direccion: 'Av. Los Carrera 850, Concepción',
    fechaNacimiento: '1999-08-20',
    tipoCuenta: 'Vendedor',
    rol: 'Vendedor',
    passwordHint: 'vento1234',
  },
];

const DEFAULT_ORDERS = [
  {
    id: '10045',
    fecha: '02 de Octubre, 2026',
    total: 63990,
    estado: 'Entregado',
    itemsCount: 1,
    items: [{ title: "Zapatilla Nike Air More Uptempo '96", quantity: 1, price: 63990 }],
  },
  {
    id: '10089',
    fecha: '05 de Octubre, 2026',
    total: 24990,
    estado: 'En Proceso',
    itemsCount: 1,
    items: [{ title: 'Limpieza y Restauración Premium de Sneakers', quantity: 1, price: 24990 }],
  },
];

/**
 * Cliente HTTP estándar para comunicarse con el Backend .NET cuando VITE_API_URL está activo
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  try {
    const respuesta = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
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
      message: 'No fue posible contactar al servidor backend. Verifica VITE_API_URL o la conexión.',
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
    await delay(250);
    const products = readStorage(STORAGE_KEYS.CATALOG_PRODUCTS, mockProducts);
    return {
      success: true,
      status: 200,
      message: 'Productos obtenidos correctamente.',
      data: products.filter((p) => p.tipo === 'Producto'),
      errors: null,
    };
  },

  async getServices() {
    if (API_URL) {
      return apiFetch('/servicios');
    }
    await delay(250);
    const services = readStorage(STORAGE_KEYS.CATALOG_SERVICES, mockServices);
    return {
      success: true,
      status: 200,
      message: 'Servicios obtenidos correctamente.',
      data: services.filter((s) => s.tipo === 'Servicio'),
      errors: null,
    };
  },

  saveProductsLocal(products) {
    writeStorage(STORAGE_KEYS.CATALOG_PRODUCTS, products);
  },

  saveServicesLocal(services) {
    writeStorage(STORAGE_KEYS.CATALOG_SERVICES, services);
  },
};

// ==================== SERVICIO DE AUTENTICACIÓN Y RECUPERACIÓN ====================

export const authApi = {
  getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSession(user) {
    if (user) {
      writeStorage(STORAGE_KEYS.SESSION, user);
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
      return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ rut: formatRUT(rut), password }),
      });
    }

    await delay(650);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const cleanInputRut = normalizeRUT(rut);
    const existing = users.find((u) => u.rutNormalized === cleanInputRut);

    if (existing && existing.passwordHint && existing.passwordHint !== password) {
      return {
        success: false,
        status: 401,
        message: 'Credenciales incorrectas.',
        data: null,
        errors: ['La contraseña ingresada no coincide con la cuenta registrada.'],
      };
    }

    const rolAsignado =
      existing?.rol || (cleanInputRut === '123456785' ? 'Admin' : 'Cliente');

    const userDto = existing
      ? {
          id: existing.id,
          nombre: existing.nombre,
          rut: existing.rut,
          correo: existing.correo,
          telefono: existing.telefono || '',
          direccion: existing.direccion || '',
          tipoCuenta: existing.tipoCuenta || 'Comprador',
          rol: rolAsignado,
        }
      : {
          id: Date.now(),
          nombre: cleanInputRut === '123456785' ? 'Administrador Vento' : 'Usuario Vento',
          rut: formatRUT(rut),
          correo: cleanInputRut === '123456785' ? 'admin@vento.cl' : 'usuario@vento.cl',
          telefono: '+56 9 1234 5678',
          direccion: 'Santiago, Chile',
          tipoCuenta: cleanInputRut === '123456785' ? 'Empresa' : 'Comprador',
          rol: rolAsignado,
        };

    this.saveSession(userDto);

    return {
      success: true,
      status: 200,
      message: `Sesión iniciada como ${userDto.nombre} (${userDto.rol}).`,
      data: userDto,
      errors: null,
    };
  },

  async register(formData) {
    const errors = [];
    const nombre = (formData.nombre || '').trim();
    const correo = (formData.correo || '').trim().toLowerCase();
    const direccion = (formData.direccion || '').trim();

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
      return apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }

    await delay(750);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const cleanInputRut = normalizeRUT(formData.rut);

    // Validación 409 Conflict por duplicados (Contenido backend-1.pdf pág. 34 y 36)
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

    const rol =
      formData.tipoCuenta === 'Empresa' || formData.tipoCuenta === 'Vendedor'
        ? 'Vendedor'
        : 'Cliente';

    const newUser = {
      id: Date.now(),
      nombre,
      rut: formatRUT(formData.rut),
      rutNormalized: cleanInputRut,
      correo,
      telefono: (formData.telefono || '').trim(),
      direccion,
      fechaNacimiento: formData.fechaNacimiento || '',
      tipoCuenta: formData.tipoCuenta || 'Comprador',
      rol,
      passwordHint: formData.password,
    };

    const updatedUsers = [...users, newUser];
    writeStorage(STORAGE_KEYS.USERS, updatedUsers);

    const { passwordHint: _ignored, ...userDto } = newUser;
    this.saveSession(userDto);

    return {
      success: true,
      status: 201,
      message: 'Cuenta creada correctamente.',
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

    await delay(800);
    return {
      success: true,
      status: 200,
      message:
        'Hemos enviado un enlace seguro de restablecimiento de contraseña al correo registrado.',
      data: { identifier: value },
      errors: null,
    };
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

    await delay(400);
    const users = readStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const formattedUser = {
      ...updatedData,
      rut: formatRUT(updatedData.rut),
      rutNormalized: normalizeRUT(updatedData.rut),
    };

    const nextUsers = users.map((u) =>
      u.id === formattedUser.id || u.rutNormalized === formattedUser.rutNormalized
        ? { ...u, ...formattedUser }
        : u
    );
    writeStorage(STORAGE_KEYS.USERS, nextUsers);
    this.saveSession(formattedUser);

    return {
      success: true,
      status: 200,
      message: 'Perfil actualizado correctamente.',
      data: formattedUser,
      errors: null,
    };
  },
};

// ==================== SERVICIO DE PEDIDOS, CARRITO, FAVORITOS Y COTIZACIONES ====================

export const storageApi = {
  getCart() {
    return readStorage(STORAGE_KEYS.CART, []);
  },
  saveCart(items) {
    writeStorage(STORAGE_KEYS.CART, items);
  },
  getWishlist() {
    return readStorage(STORAGE_KEYS.WISHLIST, []);
  },
  saveWishlist(ids) {
    writeStorage(STORAGE_KEYS.WISHLIST, ids);
  },
  getOrders() {
    return readStorage(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  },
  addOrder(order) {
    const current = this.getOrders();
    const next = [order, ...current];
    writeStorage(STORAGE_KEYS.ORDERS, next);
    return next;
  },
  getQuotes() {
    return readStorage(STORAGE_KEYS.QUOTES, []);
  },
  async createQuote(quotePayload) {
    await delay(600);
    const current = this.getQuotes();
    const newQuote = {
      id: `COT-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      estado: 'Enviada al proveedor',
      ...quotePayload,
    };
    const next = [newQuote, ...current];
    writeStorage(STORAGE_KEYS.QUOTES, next);
    return {
      success: true,
      status: 201,
      message: 'Solicitud de cotización enviada correctamente.',
      data: newQuote,
      errors: null,
    };
  },
  getCompany() {
    return readStorage(STORAGE_KEYS.COMPANY, {
      rut: '77.777.777-7',
      nombre: 'Music On',
      sitioWeb: 'musicon.com',
      logo: '',
    });
  },
  saveCompany(company) {
    writeStorage(STORAGE_KEYS.COMPANY, company);
  },
  getAdmins() {
    return readStorage(STORAGE_KEYS.ADMINS, [
      { id: 1, nombre: 'Marco Cerda', correo: 'marco@musicon.com', rol: 'Admin', estado: 'Activo' },
      {
        id: 2,
        nombre: 'Matías Cáceres',
        correo: 'matias@musicon.com',
        rol: 'Admin',
        estado: 'Desactivado',
      },
    ]);
  },
  saveAdmins(admins) {
    writeStorage(STORAGE_KEYS.ADMINS, admins);
  },
};
