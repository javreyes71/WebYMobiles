import React from 'react';

const CustomButton = ({ onClick, children, type = 'button', className = '', disabled = false, variant = 'primary' }) => {
  const baseStyles = 'px-6 py-2.5 font-medium rounded transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-neutral-800 text-white hover:bg-neutral-900',
    outline: 'bg-transparent border border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white',
    navbar: 'bg-white text-neutral-800 hover:bg-gray-100 font-semibold',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
};

export default CustomButton;
