import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Adaptado al estilo Vento (negro)
    },
    secondary: {
      main: '#6b7280', // Gris de Tailwind (gray-500)
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      'Avenir',
      'Helvetica',
      'Arial',
      'sans-serif'
    ].join(','),
  },
});

export default theme;
