import React from 'react';
import { CircularProgress } from '@mui/material';

const CustomButton = ({
  onClick,
  children,
  type = 'button',
  className = '',
  disabled = false,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  startIcon = null,
  endIcon = null,
  ariaLabel,
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900',
    solid: 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900',
    secondary: 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    outline:
      'bg-transparent border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white focus:ring-gray-900',
    outlineSecondary:
      'bg-transparent border border-sky-600 text-sky-700 hover:bg-sky-50 focus:ring-sky-600',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
    navbar: 'bg-white text-gray-900 hover:bg-gray-100 font-semibold focus:ring-gray-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variants[variant] || variants.primary
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {isLoading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <>
          {startIcon && <span className="inline-flex shrink-0">{startIcon}</span>}
          {children}
          {endIcon && <span className="inline-flex shrink-0">{endIcon}</span>}
        </>
      )}
    </button>
  );
};

export default CustomButton;
