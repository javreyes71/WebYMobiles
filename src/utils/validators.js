// Valida un RUT chileno (ej: 12.345.678-9 o 12345678-9)
export const validateRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;

  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 2) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  let sum = 0;
  let multiple = 2;

  for (let i = 1; i <= body.length; i++) {
    const index = multiple * cleanRut.charAt(body.length - i);
    sum = sum + index;
    if (multiple < 7) {
      multiple = multiple + 1;
    } else {
      multiple = 2;
    }
  }

  const expectedDv = 11 - (sum % 11);
  let computedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === computedDv;
};

// Obtiene iniciales (ej: "Juan Pérez" -> "JP")
export const getInitials = (name) => {
  if (!name) return 'U';
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};
