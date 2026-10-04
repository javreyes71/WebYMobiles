import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import CustomButton from '../../components/atoms/Button/CustomButton';
import { useToast } from '../../context/ToastContext';

const Login = ({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempt with:', { rut, password });
      showToast("Sesión iniciada correctamente", "success");
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        onClose();
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      {/* Modal */}
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-light"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-8">Inicia sesión</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* RUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="rut">
              RUT
            </label>
            <input
              id="rut"
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
              placeholder="12.345.678-9"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
            />
          </div>

          {/* Submit Button */}
          <CustomButton type="submit" className="w-full flex justify-center items-center h-10" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
          </CustomButton>
        </form>

        {/* Forgot Password */}
        <p className="text-sm text-gray-500 mt-6 text-center">
          ¿Has olvidado tu contraseña? La puedes recuperar o actualizar mediante tu correo electrónico
        </p>

        {/* Register Link */}
        <div className="text-center mt-4">
          <button 
            type="button" 
            onClick={onSwitchToRegister} 
            className="text-sm font-semibold text-neutral-800 hover:underline"
          >
            Registrarte
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
