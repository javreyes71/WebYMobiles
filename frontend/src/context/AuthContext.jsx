import React, { createContext, useState, useContext, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import { authApi, usersApi } from '@/services/api';
import { formatRUT } from '@/utils/validators';
import { normalizeUserRoles } from '@/utils/roles';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() =>
    normalizeUserRoles(authApi.getSession())
  );
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(authApi.getSession()));
  const { showToast } = useToast();

  const refreshCurrentUser = useCallback(() => {
    const fresh = authApi.getSession();
    setCurrentUser(fresh ? normalizeUserRoles(fresh) : null);
    setIsLoggedIn(Boolean(fresh));
    return fresh;
  }, []);

  const login = async (rut, password, rememberUser = false) => {
    try {
      const response = await authApi.login({ rut, password });
      if (!response.success) {
        return response;
      }

      const normalized = normalizeUserRoles(response.data);
      setCurrentUser(normalized);
      setIsLoggedIn(true);

      if (rememberUser) {
        authApi.setRememberedRut(formatRUT(rut));
      } else {
        authApi.setRememberedRut('');
      }

      showToast(response.message, 'success');
      return response;
    } catch {
      const fallbackError = {
        success: false,
        status: 500,
        message: 'Ocurrió un error inesperado al iniciar sesión.',
        data: null,
        errors: ['No fue posible procesar el inicio de sesión.'],
      };
      showToast(fallbackError.message, 'error');
      return fallbackError;
    }
  };

  const register = async (formData) => {
    try {
      const response = await authApi.register(formData);
      if (!response.success) {
        return response;
      }

      const normalized = normalizeUserRoles(response.data);
      setCurrentUser(normalized);
      setIsLoggedIn(true);
      showToast(response.message || 'Cuenta creada correctamente.', 'success');
      return response;
    } catch {
      const fallbackError = {
        success: false,
        status: 500,
        message: 'Error inesperado al registrar la cuenta.',
        data: null,
        errors: ['No fue posible completar el registro.'],
      };
      showToast(fallbackError.message, 'error');
      return fallbackError;
    }
  };

  const requestPasswordRecovery = async (identifier) => {
    try {
      const response = await authApi.requestPasswordRecovery({ identifier });
      if (response.success) {
        showToast('Instrucciones de recuperación enviadas a tu correo.', 'info');
      }
      return response;
    } catch {
      return {
        success: false,
        status: 500,
        message: 'Error al solicitar la recuperación de contraseña.',
        data: null,
        errors: ['Intenta nuevamente en unos segundos.'],
      };
    }
  };

  const updateUserProfile = async (updatedFields) => {
    try {
      const merged = { ...(currentUser || {}), ...updatedFields };
      const response = await authApi.updateProfile(merged);
      if (response.success) {
        const normalized = normalizeUserRoles(response.data);
        setCurrentUser(normalized);
        setIsLoggedIn(true);
        showToast(response.message, 'success');
      } else {
        showToast(response.errors?.[0] || response.message, 'error');
      }
      return response;
    } catch {
      showToast('No se pudo actualizar el perfil.', 'error');
      return { success: false, errors: ['Error inesperado.'] };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) {
      return { success: false, message: 'Inicia sesión primero.' };
    }
    try {
      const response = await authApi.changePassword({
        userId: currentUser.id,
        currentPassword,
        newPassword,
      });
      if (response.success) {
        showToast(response.message, 'success');
      } else {
        showToast(response.errors?.[0] || response.message, 'error');
      }
      return response;
    } catch {
      showToast('Error al cambiar la contraseña.', 'error');
      return { success: false, errors: ['Error inesperado.'] };
    }
  };

  const requestRoleUpgrade = async (targetRole, extraInfo = {}) => {
    if (!currentUser) {
      return { success: false, message: 'Inicia sesión primero.' };
    }
    const response = await usersApi.requestRoleUpgrade(currentUser.id, targetRole, extraInfo);
    if (response.success) {
      setCurrentUser(normalizeUserRoles(response.data));
      showToast(response.message, 'info');
    } else {
      showToast(response.message, 'error');
    }
    return response;
  };

  const logout = () => {
    authApi.saveSession(null);
    setIsLoggedIn(false);
    setCurrentUser(null);
    showToast('Has cerrado sesión correctamente.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        login,
        register,
        requestPasswordRecovery,
        updateUserProfile,
        changePassword,
        requestRoleUpgrade,
        refreshCurrentUser,
        logout,
        getRememberedRut: authApi.getRememberedRut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
