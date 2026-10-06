import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { validateRUT } from '../../utils/validators';
import { CircularProgress } from '@mui/material';

const Register = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    correo: '',
    fechaNacimiento: '',
    rut: '',
    password: '',
    confirmPassword: '',
    tipoCuenta: 'Comprador'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { register } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRUT(formData.rut)) {
      showToast("El RUT ingresado no es válido.", "error");
      return;
    }

    if (formData.password.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres.", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast("Las contraseñas no coinciden.", "error");
      return;
    }

    setIsLoading(true);

    console.log('Registro exitoso con datos:', formData);
    await register({ nombre: formData.nombre, rut: formData.rut, correo: formData.correo });
    
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl p-10 rounded shadow-xl flex flex-col border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-8 font-serif">Crear cuenta</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Column */}
            <div className="flex-1 space-y-5 border border-gray-300 p-6 rounded">
              <input 
                type="text" 
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre *" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
              />
              <input 
                type="text" 
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Direccion *" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
              />
              <input 
                type="email" 
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="E- mail *" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
              />
              <input 
                type="text" // using text to match placeholder style instead of native date picker styling issues, but date is fine. Let's use text for simplicity like Figma
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                onFocus={(e) => e.target.type = 'date'}
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                placeholder="Fecha de nacimiento *" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
              />
              <input 
                type="text" 
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="Run *" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
              />
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col justify-between border border-gray-300 p-6 rounded">
              <div className="space-y-5">
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña *" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
                />
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmar contraseña *" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" 
                />
                <select 
                  name="tipoCuenta"
                  value={formData.tipoCuenta}
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500 bg-white"
                >
                  <option value="Comprador">Tipo de cuenta</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>

              <div className="mt-12 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-xl py-4 px-12 rounded transition-colors italic font-serif"
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={onSwitchToLogin}
              className="text-sm text-gray-500 hover:text-gray-800 underline"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
