// Valida un RUT chileno mediante algoritmo Módulo 11 (ej: 12.345.678-5 o 12345678-5)
export const validateRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;

  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 7 || cleanRut.length > 9) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiple = 2;

  for (let i = 1; i <= body.length; i++) {
    const index = multiple * Number(body.charAt(body.length - i));
    sum += index;
    multiple = multiple < 7 ? multiple + 1 : 2;
  }

  const expectedDv = 11 - (sum % 11);
  const computedDv =
    expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === computedDv;
};

// Formatea un RUT chileno en tiempo real mientras el usuario escribe (ej: 123456785 -> 12.345.678-5)
export const formatRUT = (value) => {
  if (!value) return '';
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
};

// Normaliza un RUT para comparaciones de duplicados/login (ej: 12.345.678-K -> 12345678K)
export const normalizeRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

// Valida formato estándar de correo electrónico
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

// Obtiene iniciales para Avatar (ej: "Juan Pérez" -> "JP")
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const names = name.trim().split(/\s+/).filter(Boolean);
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || 'U';
};

// Formatea valores numéricos a pesos chilenos CLP (ej: 63990 -> "$63.990")
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return '$0';
  return `$${Math.round(num).toLocaleString('es-CL')}`;
};
