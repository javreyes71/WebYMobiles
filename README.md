# Vento Marketplace (WYM) 👟

¡Bienvenidos al repositorio del Frontend de **Vento Marketplace**! 

Este proyecto es una plataforma de e-commerce construida con tecnologías modernas para asegurar rapidez y escalabilidad. Aquí encontrarás las instrucciones para levantar el proyecto en tu computadora en menos de 2 minutos.

---

## 🛠️ Tecnologías Principales

* **Framework:** React 18
* **Bundler:** Vite (Súper rápido ⚡)
* **Estilos:** Tailwind CSS
* **Rutas:** React Router DOM
* **Iconos:** Lucide React

---

## 🚀 Cómo instalar y levantar el proyecto localmente

Sigue estos sencillos pasos para tener la tienda corriendo en tu navegador.

### 1. Requisitos Previos
Asegúrate de tener instalado en tu computadora:
* **Node.js** (Versión 18 o superior recomendada): [Descargar Node.js](https://nodejs.org/)
* **Git**: [Descargar Git](https://git-scm.com/)

### 2. Clonar el repositorio
Abre tu terminal y descarga el código a tu computadora:
```bash
git clone https://github.com/javreyes71/WebYMobiles.git
cd WebYMobiles
```

### 3. Instalar las dependencias
Una vez dentro de la carpeta del proyecto, instala todos los paquetes necesarios ejecutando:
```bash
npm install
```

### 4. Levantar el servidor
Para arrancar el proyecto en modo desarrollo, ejecuta:
```bash
npm run dev
```

El terminal te mostrará una URL (usualmente `http://localhost:5173`). ¡Haz **Ctrl + Clic** en ese enlace para abrir la tienda en tu navegador!

---

## 🏗️ Arquitectura del Código

Para mantener el código ordenado a medida que el equipo crece, estamos usando **Diseño Atómico (Atomic Design)**. En la carpeta `src/` encontrarás:

* 📁 `assets/`: Imágenes de la tienda organizadas por sección (`/inicio`, `/productos`).
* 📁 `data/`: Base de datos local mockeada (`products.js`) para simular la API.
* 📁 `components/`:
  * `atoms/`: Componentes minúsculos e irreducibles (Ej: Botones, Inputs).
  * `molecules/`: Uniones de átomos (Ej: Tarjeta de Producto `ProductCard`).
  * `organisms/`: Secciones grandes y complejas (Ej: `Navbar`).
* 📁 `context/`: Lógica global de React. Aquí está `CartContext.jsx` que maneja el carrito de compras.
* 📁 `pages/`: Las vistas principales completas (`Home`, `Tienda`, `ProductDetail`, `Cart`).

---

## 💡 ¿Qué está implementado hasta ahora?

* **Navegación completa:** El usuario puede ir del Inicio a la Tienda.
* **Tienda y Filtros:** Buscador por texto y filtros por rango de precio completamente funcionales.
* **Ficha de Producto Dinámica:** Cada zapatilla carga su propia información (título, precio, imágenes, descripción) leyendo desde `data/products.js`.
* **Carrito de Compras (Interactivo):** 
  * Puedes agregar productos desde la ficha.
  * Cambiar cantidades con botones `+` y `-`.
  * Eliminar productos.
  * Todo el subtotal se calcula en tiempo real.
* **Login Modal:** Ventana emergente (se accede desde el botón del Navbar) preparada para inicio de sesión con RUT chileno.

¡Cualquier duda, pregunten por el canal del equipo! A programar 💻🚀
