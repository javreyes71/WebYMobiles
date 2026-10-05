import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import CustomButton from '../../components/atoms/Button/CustomButton';
import { validateRUT } from '../../utils/validators';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const Register = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRUT(rut)) {
      showToast("El RUT ingresado no es válido.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres.", "error");
      return;
    }

    setIsLoading(true);

    console.log('Registro exitoso con datos:', { nombre, rut, correo, password });
    await register({ nombre, rut, correo });
    
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-10" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-light"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center text-gray-800 mb-8">Crear cuenta</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="rutReg">
              RUT
            </label>
            <input
              id="rutReg"
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
              placeholder="12.345.678-9"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">
              Correo Electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              placeholder="juan@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="passwordReg">
              Contraseña
            </label>
            <input
              id="passwordReg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
            />
            <p className="text-xs text-gray-500 mt-1">Debe tener al menos 8 caracteres.</p>
          </div>

          <div className="pt-2">
            <CustomButton type="submit" className="w-full flex justify-center items-center h-10" disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrarme'}
            </CustomButton>
          </div>
        </form>

        <div className="text-center mt-6">
          <span className="text-sm text-gray-600">¿Ya tienes cuenta? </span>
          <button 
            type="button"
            onClick={onSwitchToLogin} 
            className="text-sm font-semibold text-neutral-800 hover:underline"
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
