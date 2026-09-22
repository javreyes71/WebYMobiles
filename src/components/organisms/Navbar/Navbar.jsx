import React from 'react';
import CustomButton from '../../atoms/Button/CustomButton';
import ventoLogo from '../../../assets/vento-logo.png';

const Navbar = ({ onLoginClick }) => {
  return (
    <nav className="bg-neutral-800 py-3 px-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img src={ventoLogo} alt="Vento" className="h-10 object-contain" />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-white text-sm font-medium hover:text-gray-300 transition-colors">INICIO</a>
          <a href="#" className="text-white text-sm font-medium hover:text-gray-300 transition-colors">TIENDA</a>
          <a href="#" className="text-white text-sm font-medium hover:text-gray-300 transition-colors">CONTACTO</a>
          <a href="#" className="text-white text-sm font-medium hover:text-gray-300 transition-colors flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            0 PRODUCTOS
          </a>
        </div>

        {/* Login Button */}
        <CustomButton variant="navbar" onClick={onLoginClick} className="rounded-md text-sm">
          Iniciar Sesión
        </CustomButton>
      </div>
    </nav>
  );
};

export default Navbar;
