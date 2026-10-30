import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * Átomo CustomTextField basado en Material UI.
 * Si type="password", incorpora automáticamente el botón de "ojo" accesible
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

  const handleTogglePassword = () => {
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
        <IconButton
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={handleTogglePassword}
          onMouseDown={(e) => e.preventDefault()}
          edge="end"
          size="small"
          tabIndex={0}
        >
          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
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
