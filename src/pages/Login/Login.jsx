import React, { useState } from 'react';
import CustomButton from '../../components/atoms/Button/CustomButton';

const Login = ({ isOpen, onClose }) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement login logic here
    console.log('Login attempt with:', { rut, password });
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
          <CustomButton type="submit" className="w-full">
            Ingresar
          </CustomButton>
        </form>

        {/* Forgot Password */}
        <p className="text-sm text-gray-500 mt-6 text-center">
          ¿Has olvidado tu contraseña? La puedes recuperar o actualizar mediante tu correo electrónico
        </p>

        {/* Register Link */}
        <div className="text-center mt-4">
          <a href="#" className="text-sm font-semibold text-neutral-800 hover:underline">
            Registrarte
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
