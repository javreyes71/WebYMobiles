import React, { useState, useEffect } from 'react';
import { Checkbox, FormControlLabel, Alert } from '@mui/material';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { formatRUT, validateRUT } from '@/utils/validators';

/**
 * Molécula LoginForm (cumple Estructura y Componentes.pptx.pdf págs. 9-12):
 * - Reutiliza átomos CustomTextField (con ojo mostrar/ocultar clave) y CustomButton
 * - Incluye casilla "Recordar usuario"
 * - Incluye acción "¿Olvidó su contraseña?"
 * - Valida RUT chileno con retroalimentación inmediata y soporta los 4 perfiles RBAC
 */
const LoginForm = ({ onSuccess, onForgotPassword, onSwitchToRegister }) => {
  const { login, getRememberedRut } = useAuth();

  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedRut = getRememberedRut();
    if (savedRut) {
      setRut(savedRut);
      setRememberUser(true);
    }
  }, [getRememberedRut]);

  const handleRutChange = (e) => {
    const formatted = formatRUT(e.target.value);
    setRut(formatted);
    if (fieldErrors.rut) {
      setFieldErrors((prev) => ({ ...prev, rut: '' }));
    }
    if (apiError) setApiError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
    if (apiError) setApiError('');
  };

  const fillDemoAccount = (demoRut, demoPass) => {
    setRut(demoRut);
    setPassword(demoPass);
    setFieldErrors({});
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!rut.trim()) {
      nextErrors.rut = 'Ingresa tu RUT.';
    } else if (!validateRUT(rut)) {
      nextErrors.rut = 'El RUT no es válido (ej: 12.345.678-5).';
    }

    if (!password) {
      nextErrors.password = 'Ingresa tu contraseña.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    const result = await login(rut, password, rememberUser);
    setIsLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setApiError(result.errors?.[0] || result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && (
        <Alert severity="error" sx={{ fontSize: '0.82rem' }}>
          {apiError}
        </Alert>
      )}

      <CustomTextField
        id="login-rut"
        name="rut"
        label="RUT"
        placeholder="12.345.678-5"
        value={rut}
        onChange={handleRutChange}
        required
        autoComplete="username"
        error={Boolean(fieldErrors.rut)}
        helperText={fieldErrors.rut || 'Formato automático con puntos y guion'}
      />

      <CustomTextField
        id="login-password"
        name="password"
        label="Contraseña"
        type="password"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={handlePasswordChange}
        required
        autoComplete="current-password"
        error={Boolean(fieldErrors.password)}
        helperText={fieldErrors.password}
      />

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={rememberUser}
              onChange={(e) => setRememberUser(e.target.checked)}
              color="primary"
            />
          }
          label={<span className="text-xs font-medium text-gray-700">Recordar usuario</span>}
        />

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline focus:outline-none"
        >
          ¿Olvidó su contraseña?
        </button>
      </div>

      <CustomButton
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        isLoading={isLoading}
      >
        Iniciar sesión
      </CustomButton>

      {/* Accesos rápidos para evaluación de los 4 perfiles + cola de aprobación */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Perfiles rápidos de prueba (4 roles):
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoAccount('12.345.678-5', 'admin1234')}
            className="text-[11px] px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 font-semibold transition-colors"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('11.111.111-1', 'vento1234')}
            className="text-[11px] px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 font-semibold transition-colors"
          >
            Vendedor Productos
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('22.222.222-2', 'servicio1234')}
            className="text-[11px] px-2.5 py-1 rounded bg-sky-50 border border-sky-200 text-sky-900 hover:bg-sky-100 font-semibold transition-colors"
          >
            Proveedor Servicios
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('15.555.555-6', 'compra1234')}
            className="text-[11px] px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 font-semibold transition-colors"
          >
            Comprador
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('18.888.888-7', 'pendiente1234')}
            className="text-[11px] px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 font-semibold transition-colors"
          >
            Vendedor (Pendiente)
          </button>
        </div>
      </div>

      <div className="text-center pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-600">¿Aún no tienes cuenta? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm font-bold text-gray-900 hover:underline"
        >
          Regístrate gratis
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
