import React, { useState, useEffect } from 'react';
import { Alert, MenuItem } from '@mui/material';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { validateRUT, formatRUT, validateEmail } from '@/utils/validators';

const initialForm = {
  nombre: '',
  rut: '',
  correo: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  tipoCuenta: 'Comprador',
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
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div
        className="bg-white w-full max-w-3xl p-6 sm:p-8 rounded-2xl shadow-2xl relative border border-gray-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de registro"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 id="register-modal-title" className="text-2xl font-extrabold text-gray-900">
            Crear cuenta en Vento
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Compra productos, vende artículos o publica tus servicios profesionales
          </p>
        </div>

        {serverError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Datos Personales */}
            <div className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                1. Datos Personales
              </h3>

              <CustomTextField
                name="nombre"
                label="Nombre completo"
                value={formData.nombre}
                onChange={handleChange}
                required
                error={Boolean(errors.nombre)}
                helperText={errors.nombre}
              />

              <CustomTextField
                name="rut"
                label="RUT"
                placeholder="12.345.678-9"
                value={formData.rut}
                onChange={handleChange}
                required
                error={Boolean(errors.rut)}
                helperText={errors.rut}
              />

              <CustomTextField
                name="correo"
                label="Correo electrónico"
                type="email"
                placeholder="nombre@correo.cl"
                value={formData.correo}
                onChange={handleChange}
                required
                error={Boolean(errors.correo)}
                helperText={errors.correo}
              />

              <CustomTextField
                name="telefono"
                label="Teléfono de contacto"
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
                  2. Tipo de Cuenta y Seguridad
                </h3>

                <CustomTextField
                  select
                  name="tipoCuenta"
                  label="Perfil de cuenta"
                  value={formData.tipoCuenta}
                  onChange={handleChange}
                  helperText="Elige Vendedor o Empresa si deseas vender o publicar servicios"
                >
                  <MenuItem value="Comprador">Comprador (Personal)</MenuItem>
                  <MenuItem value="Vendedor">Vendedor / Emprendedor</MenuItem>
                  <MenuItem value="Empresa">Empresa / Proveedor de Servicios</MenuItem>
                </CustomTextField>

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

              <div className="pt-6">
                <CustomButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Crear cuenta
                </CustomButton>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">¿Ya tienes una cuenta en Vento? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm font-bold text-gray-900 hover:underline"
            >
              Inicia sesión aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
