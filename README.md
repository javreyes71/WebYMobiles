# Vento Marketplace (WYM)

Plataforma de compra y venta e-commerce construida con React, Vite y Tailwind CSS, estructurada siguiendo los principios de Atomic Design.

## 🚀 Estado Actual del Proyecto

Se ha implementado el front-end con navegación real (React Router) y gestión de estado global para el carrito de compras. Las vistas principales están alineadas con los diseños proporcionados en Figma.

### Vistas Implementadas:
- **Navegación Global (Navbar):** Barra de navegación con logo "Vento", enlaces, barra de anuncios y carrito dinámico.
- **Login Modal:** Modal emergente accesible desde cualquier lugar para iniciar sesión usando **RUT** y contraseña.
- **Inicio (`/`):** Página principal (Home) con banner promocional (Hero) y navegación por categorías (Hombre, Zapatos, Ropa).
- **Tienda (`/tienda`):** Catálogo de productos con barra lateral de filtros y grilla de productos (ProductCards).
- **Ficha de Producto (`/producto/:id`):** Vista detallada de cada zapatilla con galería de imágenes, selector de tallas y colores, precios dinámicos y botón funcional de "Agregar al carrito".

### Funcionalidad Destacada:
- **Carrito de Compras (Context API):** Al presionar "Agregar al carrito" en la ficha del producto, el contador en la barra de navegación superior se actualiza globalmente en tiempo real.

## 🛠️ Tecnologías Utilizadas

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/) (Bundler ultra rápido)
- [Tailwind CSS](https://tailwindcss.com/) (Framework de estilos)
- [React Router DOM](https://reactrouter.com/) (Navegación entre páginas)
- [Lucide React](https://lucide.dev/) (Iconografía moderna)

## 📦 Cómo levantar el proyecto localmente

Para ejecutar este proyecto en tu entorno local, sigue estos pasos:

1. **Abre tu terminal** en la raíz de la carpeta del proyecto.
2. **Instala las dependencias** (necesitas tener Node.js instalado):
   ```bash
   npm install
   ```
3. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
4. **Abre tu navegador**:
   Ve a la URL `http://localhost:5173` para ver y navegar por la plataforma.

## 🏗️ Estructura del Código (Atomic Design)

El proyecto organiza sus componentes siguiendo el patrón de Diseño Atómico para máxima escalabilidad:

- `src/assets/`: Imágenes locales organizadas por vistas (`/inicio`, `/productos`).
- `src/components/atoms/`: Componentes básicos irreducibles (ej: `CustomButton.jsx`).
- `src/components/molecules/`: Grupos de átomos (ej: `ProductCard.jsx`).
- `src/components/organisms/`: Secciones complejas e independientes (ej: `Navbar.jsx`).
- `src/context/`: Contextos globales de React (ej: `CartContext.jsx`).
- `src/pages/`: Las vistas completas mapeadas a las rutas (Home, Tienda, ProductDetail, Login).

## 🔮 Siguientes Pasos Recomendados

1. **Checkout (Caja):** Crear un panel lateral (Drawer) que muestre los ítems exactos agregados al carrito para proceder al pago.
2. **Lógica de Autenticación:** Conectar el formulario de Login (RUT) con un Backend o BaaS (como Firebase o Supabase) para registrar sesiones reales.
3. **Filtros Dinámicos:** Hacer que la barra lateral de la Tienda filtre los productos reales renderizados en pantalla.
