import React, { useState, useEffect } from 'react';
import { Alert, MenuItem } from '@mui/material';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { validateRUT, formatRUT, validateEmail } from '@/utils/validators';
import { ROLES } from '@/utils/roles';

const initialForm = {
  nombre: '',
  nombreTienda: '',
  rut: '',
  correo: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  tipoCuenta: ROLES.COMPRADOR,
  password: '',
  confirmPassword: '',
};

const Register = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCommercialRole =
    formData.tipoCuenta === ROLES.VENDEDOR_PRODUCTO ||
    formData.tipoCuenta === ROLES.PROVEEDOR_SERVICIO;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'rut' ? formatRUT(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.nombre.trim() || formData.nombre.trim().length < 2) {
      nextErrors.nombre = 'Ingresa tu nombre completo (mínimo 2 caracteres).';
    }
    if (isCommercialRole && (!formData.nombreTienda.trim() || formData.nombreTienda.trim().length < 2)) {
      nextErrors.nombreTienda = 'Ingresa el nombre de tu tienda o marca profesional.';
    }
    if (!validateRUT(formData.rut)) {
      nextErrors.rut = 'Ingresa un RUT chileno válido.';
    }
    if (!validateEmail(formData.correo)) {
      nextErrors.correo = 'Ingresa un correo electrónico válido.';
    }
    if (!formData.direccion.trim()) {
      nextErrors.direccion = 'La dirección es obligatoria.';
    }
    if (!formData.password || formData.password.length < 8) {
      nextErrors.password = 'Mínimo 8 caracteres.';
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    const response = await register(formData);
    setIsLoading(false);

    if (response.success) {
      setFormData(initialForm);
      onClose();
    } else {
      setServerError(response.errors?.[0] || response.message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden my-8 border border-gray-100">
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Cerrar ventana de registro"
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-800 text-xl font-bold z-10 disabled:opacity-50"
        >
          ✕
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 id="register-modal-title" className="text-2xl font-extrabold text-gray-900">
              Crear cuenta en Vento
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Elige tu perfil para comprar productos, contratar servicios o publicar tu catálogo
            </p>
          </div>

          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
            {/* Columna Izquierda: Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                1. Información Personal
              </h3>

              <CustomTextField
                name="nombre"
                label="Nombre completo"
                placeholder="Ej: Ana Soto"
                value={formData.nombre}
                onChange={handleChange}
                required
                error={Boolean(errors.nombre)}
                helperText={errors.nombre}
              />

              <CustomTextField
                name="rut"
                label="RUT"
                placeholder="12.345.678-5"
                value={formData.rut}
                onChange={handleChange}
                required
                error={Boolean(errors.rut)}
                helperText={errors.rut || 'Se formatea automáticamente'}
              />

              <CustomTextField
                name="correo"
                label="Correo electrónico"
                type="email"
                placeholder="nombre@dominio.cl"
                value={formData.correo}
                onChange={handleChange}
                required
                error={Boolean(errors.correo)}
                helperText={errors.correo}
              />

              <CustomTextField
                name="telefono"
                label="Teléfono móvil"
                placeholder="+56 9 1234 5678"
                value={formData.telefono}
                onChange={handleChange}
              />

              <CustomTextField
                name="direccion"
                label="Dirección"
                placeholder="Calle, número, comuna"
                value={formData.direccion}
                onChange={handleChange}
                required
                error={Boolean(errors.direccion)}
                helperText={errors.direccion}
              />
            </div>

            {/* Columna Derecha: Perfil y Seguridad */}
            <div className="flex flex-col justify-between bg-gray-50/70 p-5 rounded-xl border border-gray-200">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  2. Perfil de Cuenta y Seguridad
                </h3>

                <CustomTextField
                  select
                  name="tipoCuenta"
                  label="Perfil de cuenta"
                  value={formData.tipoCuenta}
                  onChange={handleChange}
                  helperText="Todos los perfiles pueden comprar en el Marketplace"
                >
                  <MenuItem value={ROLES.COMPRADOR}>
                    Comprador (Comprar y cotizar servicios)
                  </MenuItem>
                  <MenuItem value={ROLES.VENDEDOR_PRODUCTO}>
                    Vendedor de Productos (Tienda física/online)
                  </MenuItem>
                  <MenuItem value={ROLES.PROVEEDOR_SERVICIO}>
                    Proveedor de Servicios Profesionales
                  </MenuItem>
                </CustomTextField>

                {isCommercialRole && (
                  <>
                    <CustomTextField
                      name="nombreTienda"
                      label={
                        formData.tipoCuenta === ROLES.PROVEEDOR_SERVICIO
                          ? 'Nombre profesional o estudio'
                          : 'Nombre de tu tienda'
                      }
                      placeholder="Ej: SneakerDrop CL"
                      value={formData.nombreTienda}
                      onChange={handleChange}
                      required
                      error={Boolean(errors.nombreTienda)}
                      helperText={errors.nombreTienda}
                    />
                    <Alert severity="info" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      Por seguridad del Marketplace, las nuevas cuentas de vendedor o proveedor
                      quedan en estado <strong>Pendiente</strong> hasta ser aprobadas por un
                      Administrador.
                    </Alert>
                  </>
                )}

                <CustomTextField
                  name="fechaNacimiento"
                  label="Fecha de nacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />

                <CustomTextField
                  name="password"
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  error={Boolean(errors.password)}
                  helperText={errors.password || 'Debe contener al menos 8 caracteres'}
                />

                <CustomTextField
                  name="confirmPassword"
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                />
              </div>

              <div className="pt-5">
                <CustomButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Crear mi cuenta
                </CustomButton>

                <div className="text-center mt-4 text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={onSwitchToLogin}
                    className="font-bold text-gray-900 hover:underline"
                  >
                    Inicia sesión
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
