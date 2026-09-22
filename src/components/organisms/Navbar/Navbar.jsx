import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import CustomButton from '../../atoms/Button/CustomButton';
import ventoLogo from '../../../assets/vento-logo.png';

const Navbar = ({ onLoginClick }) => {
  const { cartCount } = useCart();

  return (
    <header className="w-full flex flex-col font-sans border-b border-gray-200">
      
      {/* Announcement bar */}
      <div className="bg-black text-white text-center py-2 text-xs font-semibold tracking-wider">
        DESPACHO GRATIS POR COMPRAS SOBRE $50.000
      </div>

      <div className="w-full bg-white flex flex-col sm:flex-row items-center justify-between px-6 py-4">
        
        {/* Left Side: Logo */}
        <div className="flex items-center mb-4 sm:mb-0">
          <Link to="/">
            <img src={ventoLogo} alt="Vento Logo" className="h-10 w-auto" />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex space-x-6 text-sm font-bold text-gray-800 tracking-wide mb-4 sm:mb-0">
          <Link to="/" className="hover:text-gray-500 transition-colors uppercase">Inicio</Link>
          <Link to="/tienda" className="hover:text-gray-500 transition-colors uppercase">Tienda</Link>
          <Link to="#" className="hover:text-gray-500 transition-colors uppercase">Contacto</Link>
        </nav>

        {/* Right Side: Cart & Auth */}
        <div className="flex items-center space-x-6">
          
          <div className="flex items-center text-gray-800 hover:text-gray-500 cursor-pointer transition-colors group">
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">{cartCount} Producto{cartCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={onLoginClick}
              className="text-xs font-bold text-gray-800 uppercase tracking-wider hover:text-gray-500 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button className="text-xs font-bold text-white bg-black px-4 py-2 rounded-sm uppercase tracking-wider hover:bg-gray-800 transition-colors">
              Regístrate
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
