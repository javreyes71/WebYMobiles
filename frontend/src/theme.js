import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#111827', // Negro carbón estilo Vento (alto contraste WCAG)
      light: '#374151',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0284c7', // Azul acento para servicios y acciones secundarias
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      dark: '#15803d',
    },
    error: {
      main: '#dc2626',
    },
    warning: {
      main: '#d97706',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
});

export default theme;
