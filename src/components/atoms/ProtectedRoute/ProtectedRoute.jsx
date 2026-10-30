import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/atoms/Button/CustomButton';

const ProtectedRoute = ({ children, requireAdmin = false, onRequireLogin }) => {
  const { isLoggedIn, currentUser } = useAuth();

  if (!isLoggedIn) {
    return (
      <section
        className="max-w-lg mx-auto my-16 px-6"
        aria-label="Acceso restringido — Requiere autenticación"
      >
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-gray-700" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión para continuar</h1>
          <p className="text-sm text-gray-600 mb-6">
            Esta sección es exclusiva para usuarios registrados en Vento Marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRequireLogin && (
              <CustomButton variant="primary" onClick={onRequireLogin}>
                Iniciar Sesión
              </CustomButton>
            )}
            <Link to="/">
              <CustomButton variant="outline" fullWidth>
                Volver al Inicio
              </CustomButton>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (requireAdmin && currentUser?.rol !== 'Admin') {
    return (
      <section
        className="max-w-lg mx-auto my-16 px-6"
        aria-label="Acceso denegado — Permisos insuficientes"
      >
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso solo para Administradores</h1>
          <p className="text-sm text-gray-600 mb-6">
            Tu cuenta actual ({currentUser?.rol || 'Cliente'}) no tiene permisos para administrar
            usuarios de empresa. Inicia sesión con una cuenta Administrador (ej. RUT{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">
              12.345.678-5
            </code>
            ).
          </p>
          <Link to="/">
            <CustomButton variant="primary">Ir al Inicio</CustomButton>
          </Link>
        </div>
      </section>
    );
  }

  return children;
};

export default ProtectedRoute;
