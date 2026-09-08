# Proyecto de Compra y Venta

He creado los componentes básicos solicitados para iniciar tu plataforma de compra y venta.

## Estructura Actual

1. **`src/components/buttons/CustomButton.jsx`**: Un botón reutilizable que usa estilos de Tailwind CSS.
2. **`src/pages/Login.jsx`**: Una vista de inicio de sesión que incluye el logo (`logo-marketschool.jpeg`) y un formulario para correo electrónico y contraseña, ideal para que los usuarios entren a tu marketplace. Esta vista utiliza el componente `CustomButton`.

## Cómo levantar el proyecto

Para ejecutar este proyecto en tu entorno local, sigue estos pasos en tu terminal (asegúrate de estar en la raíz de la carpeta `WYM`):

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar el servidor de desarrollo**:
   Ejecuta el siguiente comando (usualmente con Vite o Create React App):
   ```bash
   npm run dev
   ```
   *(Si estás usando Create React App y el comando anterior falla, intenta con `npm start`)*

3. **Ver en el navegador**:
   Abre la URL que aparece en la terminal (usualmente `http://localhost:5173` o `http://localhost:3000`) para ver la página de Login en acción.

## Para Avanzar

1. **Revisar Estilos**: Los componentes están construidos con clases de Tailwind CSS. Si tu proyecto usa CSS estándar u otro framework, puedes ajustar el atributo `className` de ambos componentes.
2. **Lógica de Autenticación**: En `src/pages/Login.jsx`, actualiza la función `handleSubmit` para conectar el inicio de sesión con el backend (Firebase, Node.js, etc.) que maneje los usuarios de tu plataforma de compra y venta.
