import React, { createContext, useState, useContext } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { showToast } = useToast();

  const login = async (rut, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoggedIn(true);
        if (!currentUser) setCurrentUser({ nombre: 'Usuario Vento', rut, correo: 'usuario@vento.cl' });
        showToast("Sesión iniciada correctamente", "success");
        resolve();
      }, 1500);
    });
  };

  const register = async (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoggedIn(true);
        setCurrentUser(userData);
        showToast("Su perfil se ha registrado correctamente", "success");
        resolve();
      }, 1500);
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
