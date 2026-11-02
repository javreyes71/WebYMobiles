import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { ROLES, hasAnyRole, getRoleLabel } from '@/utils/roles';

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  allowedRoles = null,
  onRequireLogin,
}) => {
  const { isLoggedIn, currentUser } = useAuth();

  if (!isLoggedIn) {
    return (
      <section
        className="max-w-lg mx-auto my-16 px-6"
        aria-label="Acceso restringido — Requiere autenticación (401)"
      >
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-gray-700" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            Inicia sesión para continuar
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Esta sección es exclusiva para usuarios autenticados en Vento Marketplace.
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

  const effectiveAllowedRoles = requireAdmin ? [ROLES.ADMIN] : allowedRoles;

  if (effectiveAllowedRoles && !hasAnyRole(currentUser, effectiveAllowedRoles)) {
    const requiredLabels = effectiveAllowedRoles.map(getRoleLabel).join(' o ');
    return (
      <section
        className="max-w-lg mx-auto my-16 px-6"
        aria-label="Acceso denegado — Permisos insuficientes (403 Forbidden)"
      >
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-red-600" aria-hidden="true" />
          </div>
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 mb-2">
            HTTP 403 · Acceso Restringido por Perfil
          </span>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            Permisos insuficientes para esta sección
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Tu perfil actual es <strong>{getRoleLabel(currentUser?.rol)}</strong>. Esta vista
            está reservada para cuentas con rol <strong>{requiredLabels}</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/perfil">
              <CustomButton variant="primary">Ir a Mi Cuenta</CustomButton>
            </Link>
            <Link to="/">
              <CustomButton variant="outline">Ir al Inicio</CustomButton>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return children;
};

export default ProtectedRoute;
