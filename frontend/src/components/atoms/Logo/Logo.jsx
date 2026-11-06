import React from 'react';
import { Link } from 'react-router-dom';
import ventoLogo from '@/assets/vento-logo.png';

const Logo = ({ className = 'h-8 sm:h-9 w-auto', showText = true, onClick }) => {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-900 rounded-lg group"
      aria-label="Ir al inicio de Vento Marketplace"
    >
      <img src={ventoLogo} alt="Vento Marketplace Logo" className={className} />
      {showText && (
        <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-950 uppercase group-hover:text-black">
          VENTO
        </span>
      )}
    </Link>
  );
};

export default Logo;
