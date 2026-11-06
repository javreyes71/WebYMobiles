import React, { useState } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Átomo CustomTextField basado en Material UI.
 * Si type="password", incorpora automáticamente el botón de "ojo" accesible y de alto contraste
 * para alternar la visualización de los caracteres de la contraseña.
 */
const CustomTextField = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  size = 'small',
  fullWidth = true,
  multiline = false,
  rows,
  autoComplete,
  startAdornment = null,
  endAdornment = null,
  inputProps = {},
  sx = {},
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const resolvedType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  const handleTogglePassword = (e) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  const computedInputProps = {};

  if (startAdornment) {
    computedInputProps.startAdornment = (
      <InputAdornment position="start">{startAdornment}</InputAdornment>
    );
  }

  if (isPasswordField) {
    computedInputProps.endAdornment = (
      <InputAdornment position="end">
        <button
          type="button"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={handleTogglePassword}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={0}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-gray-700 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 text-gray-700 shrink-0" aria-hidden="true" />
          )}
        </button>
      </InputAdornment>
    );
  } else if (endAdornment) {
    computedInputProps.endAdornment = (
      <InputAdornment position="end">{endAdornment}</InputAdornment>
    );
  }

  return (
    <TextField
      id={id || name}
      name={name}
      label={label}
      type={resolvedType}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={Boolean(error)}
      helperText={helperText}
      size={size}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      autoComplete={autoComplete}
      InputProps={computedInputProps}
      slotProps={{
        input: computedInputProps,
        htmlInput: inputProps,
      }}
      inputProps={inputProps}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
        },
        ...sx,
      }}
      {...rest}
    />
  );
};

export default CustomTextField;
