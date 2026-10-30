import React, { useState, useEffect } from 'react';
import { Alert } from '@mui/material';
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react';
import LoginForm from '@/components/molecules/LoginForm/LoginForm';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { formatRUT } from '@/utils/validators';

const Login = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { requestPasswordRecovery } = useAuth();

  // 'login' | 'recover' | 'recover-sent'
  const [mode, setMode] = useState('login');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setRecoveryIdentifier('');
      setRecoveryError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    // Si no contiene @ ni letras distintas de K, ayudamos con formato de RUT
    if (val && !val.includes('@') && /^[0-9kK.-]+$/.test(val)) {
      setRecoveryIdentifier(formatRUT(val));
    } else {
      setRecoveryIdentifier(val);
    }
    if (recoveryError) setRecoveryError('');
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setIsRecovering(true);
    setRecoveryError('');

    const response = await requestPasswordRecovery(recoveryIdentifier);
    setIsRecovering(false);

    if (response.success) {
      setMode('recover-sent');
    } else {
      setRecoveryError(response.errors?.[0] || response.message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 sm:p-8 relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar accesible */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de inicio de sesión"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        {mode === 'login' && (
          <>
            <div className="text-center mb-6">
              <h2 id="login-modal-title" className="text-2xl font-extrabold text-gray-900">
                Inicia sesión
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Accede a tus compras, ventas y cotizaciones de servicios
              </p>
            </div>

            <LoginForm
              onSuccess={onClose}
              onForgotPassword={() => setMode('recover')}
              onSwitchToRegister={onSwitchToRegister}
            />
          </>
        )}

        {mode === 'recover' && (
          <div>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 id="login-modal-title" className="text-xl font-extrabold text-gray-900">
                  ¿Olvidó su contraseña?
                </h2>
                <p className="text-xs text-gray-500">
                  Recupera el acceso a tu cuenta en segundos
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Ingresa tu <strong>correo electrónico</strong> o tu <strong>RUT</strong> registrado y
              te enviaremos las instrucciones para restablecer tu clave.
            </p>

            <form onSubmit={handleRecoverySubmit} className="space-y-4" noValidate>
              {recoveryError && <Alert severity="error">{recoveryError}</Alert>}

              <CustomTextField
                id="recovery-identifier"
                name="identifier"
                label="Correo electrónico o RUT"
                placeholder="usuario@dominio.cl o 12.345.678-5"
                value={recoveryIdentifier}
                onChange={handleIdentifierChange}
                required
                error={Boolean(recoveryError)}
              />

              <CustomButton
                type="submit"
                variant="secondary"
                fullWidth
                size="lg"
                isLoading={isRecovering}
              >
                Enviar enlace de recuperación
              </CustomButton>
            </form>
          </div>
        )}

        {mode === 'recover-sent' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7" />
            </div>
            <h2 id="login-modal-title" className="text-xl font-extrabold text-gray-900 mb-2">
              ¡Revisa tu bandeja de entrada!
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Enviamos las instrucciones para restablecer la contraseña asociada a{' '}
              <strong className="text-gray-900">{recoveryIdentifier}</strong>.
            </p>
            <CustomButton variant="primary" fullWidth onClick={() => setMode('login')}>
              Volver a Iniciar Sesión
            </CustomButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
