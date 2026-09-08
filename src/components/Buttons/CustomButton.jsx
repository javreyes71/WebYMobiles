import React from 'react';

const CustomButton = ({ onClick, children, type = 'button', className = '', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${className}`}
    >
      {children}
    </button>
  );
};

export default CustomButton;
