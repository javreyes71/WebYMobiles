import imgProd1 from '../assets/productos/prod_1.png';
import imgProd2 from '../assets/productos/prod_2.png';
import imgProd3 from '../assets/productos/prod_3.png';
import imgProd4 from '../assets/productos/prod_4.png';
import imgProd5 from '../assets/productos/prod_5.png';

// Retro 4 Images
import retro4Main from '../assets/productos/retro4_main.png'; 
import retro4Thumb1 from '../assets/productos/retro4_thumb1.png'; 
import retro4Thumb2 from '../assets/productos/retro4_thumb2.png'; 

export const mockProducts = [
  {
    id: 1,
    brand: 'Nike',
    title: "Zapatilla Nike Air More Uptempo '96",
    price: 63990,
    originalPrice: 80000,
    freeShipping: true,
    image: imgProd1,
    mainImage: imgProd1,
    thumbnails: [imgProd1],
    description: "Con un diseño inconfundible y llamativo, las Nike Air More Uptempo '96 rinden homenaje al estilo del baloncesto de la década de 1990."
  },
  {
    id: 2,
    brand: 'Nike',
    title: 'Zapatilla urbanas',
    price: 64990,
    originalPrice: 75000,
    freeShipping: true,
    image: imgProd2,
    mainImage: imgProd2,
    thumbnails: [imgProd2],
    description: "Zapatillas urbanas clásicas, ideales para el día a día. Combinan comodidad y estilo versátil para cualquier ocasión."
  },
  {
    id: 3,
    brand: 'Nike',
    title: 'Zapatilla Air Force',
    price: 119990,
    originalPrice: 140000,
    freeShipping: true,
    image: imgProd3,
    mainImage: imgProd3,
    thumbnails: [imgProd3],
    description: "El resplandor vive en Nike Air Force, la leyenda del baloncesto que le da un toque novedoso a las características que más te gustan."
  },
  {
    id: 4,
    brand: 'Nike',
    title: 'Zapatilla Dunk Low Mujer',
    price: 99990,
    originalPrice: 120000,
    freeShipping: true,
    image: imgProd4,
    mainImage: imgProd4,
    thumbnails: [imgProd4],
    description: "Creadas para la cancha y adaptadas al estilo urbano, las Nike Dunk Low vuelven con revestimientos impecables y los colores originales."
  },
  {
    id: 5,
    brand: 'Nike',
    title: 'Air Jordan 4 Retro OG SP Nigel Sylvester Brick by Brick',
    price: 56325,
    originalPrice: 75100,
    freeShipping: true,
    image: retro4Main,
    mainImage: retro4Main,
    thumbnails: [retro4Thumb1, retro4Thumb2],
    description: 'Inspired by the red bricks of NYC, the Air Jordan 4 "Brick by Brick" reflects Nigel\'s BMX roots and dedication to progress. The Firewood Orange leather upper embodies his fearless approach, while rich Cinnabar underlays add depth and energy. A crisp Sail midsole grounds the vibrant hues, keeping the look balanced while maintaining the signature AJ4 silhouette with mesh-inspired panels and floating eyestays. In a nod to Nigel\'s passion, the traditional "Nike Air" branding on the heel is replaced with "Bike Air," blending sneaker culture with his BMX legacy.'
  },
  {
    id: 6,
    brand: 'Nike',
    title: 'Zapatilla de Fútbol Nike',
    price: 47990,
    originalPrice: 55000,
    freeShipping: false,
    image: imgProd2,
    mainImage: imgProd2,
    thumbnails: [imgProd2],
    description: "Lleva tu juego al siguiente nivel con estas zapatillas de fútbol diseñadas para máxima velocidad y control del balón."
  }
];
