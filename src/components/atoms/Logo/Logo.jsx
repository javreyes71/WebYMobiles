import React from 'react';
import { Link } from 'react-router-dom';
import ventoLogo from '@/assets/vento-logo.png';

const Logo = ({ className = 'h-8 sm:h-10 w-auto', onClick }) => {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-gray-900 rounded"
      aria-label="Ir al inicio de Vento Marketplace"
    >
      <img src={ventoLogo} alt="Vento Marketplace Logo" className={className} />
    </Link>
  );
};

export default Logo;
