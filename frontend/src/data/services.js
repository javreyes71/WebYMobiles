// Generador de ilustraciones SVG embebidas (100% offline-ready para entorno local / Raspberry Pi)
const createServiceBanner = (title, subtitle, accentHex, bgHex) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g)" rx="16" />
    <circle cx="680" cy="110" r="140" fill="${accentHex}" opacity="0.18" />
    <circle cx="110" cy="420" r="170" fill="${accentHex}" opacity="0.12" />
    <rect x="56" y="64" width="160" height="34" rx="17" fill="${accentHex}" opacity="0.25" />
    <text x="136" y="86" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">VENTO SERVICIOS</text>
    <text x="56" y="250" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${title}</text>
    <text x="56" y="298" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="500" fill="#cbd5e1">${subtitle}</text>
    <line x1="56" y1="350" x2="220" y2="350" stroke="${accentHex}" stroke-width="5" stroke-linecap="round" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const mockServices = [
  {
    id: 101,
    tipo: 'Servicio',
    ownerId: 3,
    proveedorId: 3,
    estadoModeracion: 'Aprobado',
    aprobadoPorAdmin: true,
    verificado: true,
    destacado: true,
    sku: 'SRV-CLN-101',
    nombre: 'Limpieza y Restauración Premium de Sneakers',
    title: 'Limpieza y Restauración Premium de Sneakers',
    brand: 'SneakerCare Lab',
    marca: 'SneakerCare Lab',
    vendedorTipo: 'Emprendedor',
    vendedorNombre: 'SneakerCare & Custom Studio',
    cobertura: 'Región Metropolitana y Biobío',
    garantia: '15 días de garantía sobre acabado',
    categoria: 'Mantención y Limpieza',
    modalidad: 'A domicilio',
    tiempoEstimado: '48 a 72 horas',
    permiteCotizacion: 'no',
    precio: 24990,
    price: 24990,
    restriccionEdad: 'no',
    rating: 4.9,
    image: createServiceBanner(
      'Restauración de Sneakers',
      'Limpieza profunda, gamuza, blanqueo de suelas y protección',
      '#38bdf8',
      '#0c4a6e'
    ),
    mainImage: createServiceBanner(
      'Restauración de Sneakers',
      'Limpieza profunda, gamuza, blanqueo de suelas y protección',
      '#38bdf8',
      '#0c4a6e'
    ),
    thumbnails: [],
    incluye: [
      'Retiro y entrega a domicilio dentro del radio urbano',
      'Limpieza profunda de capellada, entresuela, plantilla y cordones',
      'Desodorización antibacteriana con ozono y escudo repelente al agua',
    ],
    descripcion:
      'Servicio especializado para zapatillas de cuero, gamuza, nubuck y malla técnica. Devolvemos la vida a tus pares favoritos con productos biodegradables certificados.',
    description:
      'Servicio especializado para zapatillas de cuero, gamuza, nubuck y malla técnica. Devolvemos la vida a tus pares favoritos con productos biodegradables certificados.',
    reviews: [
      {
        id: 'sr1',
        autor: 'Pedro Pascal',
        autorId: 4,
        verificada: true,
        fecha: '12 Oct 2026',
        rating: 5,
        comentario: 'Mis Jordan 4 quedaron como recién salidas de tienda. Recomendadísimo.',
      },
    ],
  },
  {
    id: 102,
    tipo: 'Servicio',
    ownerId: 3,
    proveedorId: 3,
    estadoModeracion: 'Aprobado',
    aprobadoPorAdmin: true,
    verificado: true,
    destacado: true,
    sku: 'SRV-CST-102',
    nombre: 'Personalización Custom Art en Calzado y Prendas',
    title: 'Personalización Custom Art en Calzado y Prendas',
    brand: 'Vento Custom Studio',
    marca: 'Vento Custom Studio',
    vendedorTipo: 'Emprendedor',
    vendedorNombre: 'SneakerCare & Custom Studio',
    cobertura: 'Todo Chile vía courier',
    garantia: 'Sellado acrílico garantizado 6 meses',
    categoria: 'Personalización y Diseño',
    modalidad: 'Online',
    tiempoEstimado: '5 a 7 días hábiles',
    permiteCotizacion: 'sí',
    precio: 35000,
    price: 35000,
    restriccionEdad: 'no',
    rating: 4.8,
    image: createServiceBanner(
      'Custom Art & Diseño',
      'Pintura Angelus a mano, boceto digital previo y sellado UV',
      '#a855f7',
      '#3b0764'
    ),
    mainImage: createServiceBanner(
      'Custom Art & Diseño',
      'Pintura Angelus a mano, boceto digital previo y sellado UV',
      '#a855f7',
      '#3b0764'
    ),
    thumbnails: [],
    incluye: [
      'Reunión online de diseño y entrega de mockup digital antes de pintar',
      'Pinturas acrílicas flexibles para cuero y textil de alta resistencia',
      'Sellado impermeable resistente al uso diario',
    ],
    descripcion:
      'Transformamos tus zapatillas o chaquetas en piezas únicas hechas a medida. El valor final depende de la complejidad artística; solicita tu cotización personalizada sin costo.',
    description:
      'Transformamos tus zapatillas o chaquetas en piezas únicas hechas a medida. El valor final depende de la complejidad artística; solicita tu cotización personalizada sin costo.',
    reviews: [],
  },
  {
    id: 103,
    tipo: 'Servicio',
    ownerId: 1,
    proveedorId: 1,
    estadoModeracion: 'Aprobado',
    aprobadoPorAdmin: true,
    verificado: true,
    destacado: true,
    sku: 'SRV-MUS-103',
    nombre: 'Producción Musical, Mezcla y Mastering Profesional',
    title: 'Producción Musical, Mezcla y Mastering Profesional',
    brand: 'Music On',
    marca: 'Music On',
    vendedorTipo: 'Empresa',
    vendedorNombre: 'Music On Estudio SpA',
    cobertura: '100% Online / Estudio Santiago',
    garantia: 'Hasta 3 rondas de revisión incluidas',
    categoria: 'Servicios musicales',
    modalidad: 'Online',
    tiempoEstimado: '3 a 5 días hábiles',
    permiteCotizacion: 'sí',
    precio: 55000,
    price: 55000,
    restriccionEdad: 'no',
    rating: 5.0,
    image: createServiceBanner(
      'Producción & Mastering',
      'Estudio híbrido analógico/digital listo para Spotify y Apple Music',
      '#10b981',
      '#064e3b'
    ),
    mainImage: createServiceBanner(
      'Producción & Mastering',
      'Estudio híbrido analógico/digital listo para Spotify y Apple Music',
      '#10b981',
      '#064e3b'
    ),
    thumbnails: [],
    incluye: [
      'Mezcla multipista y masterización con estándar internacional LUFS',
      'Hasta 3 rondas de revisiones incluidas con el ingeniero de sonido',
      'Entrega de máster WAV 24-bit, instrumental y versión para redes',
    ],
    descripcion:
      'Potencia tus lanzamientos musicales con el equipo de ingeniería de Music On. Cotiza por single, EP o álbum completo según la cantidad de canales y requerimientos.',
    description:
      'Potencia tus lanzamientos musicales con el equipo de ingeniería de Music On. Cotiza por single, EP o álbum completo según la cantidad de canales y requerimientos.',
    reviews: [],
  },
  {
    id: 104,
    tipo: 'Servicio',
    ownerId: 1,
    proveedorId: 1,
    estadoModeracion: 'Aprobado',
    aprobadoPorAdmin: true,
    verificado: true,
    destacado: false,
    sku: 'SRV-EVT-104',
    nombre: 'DJ Set Urbano y Amplificación para Eventos',
    title: 'DJ Set Urbano y Amplificación para Eventos',
    brand: 'Music On',
    marca: 'Music On',
    vendedorTipo: 'Empresa',
    vendedorNombre: 'Music On Estudio SpA',
    cobertura: 'Región Metropolitana y Valparaíso',
    garantia: 'Contrato de respaldo técnico en terreno',
    categoria: 'Eventos y Sonido',
    modalidad: 'Presencial',
    tiempoEstimado: '4 a 6 horas por evento',
    permiteCotizacion: 'sí',
    precio: 140000,
    price: 140000,
    restriccionEdad: 'sí',
    rating: 4.7,
    image: createServiceBanner(
      'DJ & Sonido en Vivo',
      'Equipamiento profesional, iluminación LED y curaduría musical',
      '#f59e0b',
      '#451a03'
    ),
    mainImage: createServiceBanner(
      'DJ & Sonido en Vivo',
      'Equipamiento profesional, iluminación LED y curaduría musical',
      '#f59e0b',
      '#451a03'
    ),
    thumbnails: [],
    incluye: [
      'Sistema de sonido activo de alta fidelidad y cabina DJ completa',
      'Montaje, prueba de sonido previa y desmontaje incluido',
      'Repertorio personalizado para lanzamientos de marca o eventos privados',
    ],
    descripcion:
      'Servicio integral de musicalización e iluminación para lanzamientos, tiendas, eventos corporativos y celebraciones. Solicita cotización indicando fecha, comuna y aforo estimado.',
    description:
      'Servicio integral de musicalización e iluminación para lanzamientos, tiendas, eventos corporativos y celebraciones. Solicita cotización indicando fecha, comuna y aforo estimado.',
    reviews: [],
  },
  {
    id: 105,
    tipo: 'Servicio',
    ownerId: 3,
    proveedorId: 3,
    estadoModeracion: 'Aprobado',
    aprobadoPorAdmin: true,
    verificado: true,
    destacado: false,
    sku: 'SRV-ASE-105',
    nombre: 'Asesoría de Imagen Streetwear & Personal Shopper',
    title: 'Asesoría de Imagen Streetwear & Personal Shopper',
    brand: 'Estilo Vento',
    marca: 'Estilo Vento',
    vendedorTipo: 'Emprendedor',
    vendedorNombre: 'SneakerCare & Custom Studio',
    cobertura: 'Online para todo Chile',
    garantia: 'Seguimiento por 14 días post-sesión',
    categoria: 'Asesoría de Imagen',
    modalidad: 'Online',
    tiempoEstimado: '90 minutos',
    permiteCotizacion: 'no',
    precio: 29990,
    price: 29990,
    restriccionEdad: 'no',
    rating: 4.8,
    image: createServiceBanner(
      'Asesoría Streetwear',
      'Diagnóstico de estilo, cápsula de outfits y guía de compras',
      '#ec4899',
      '#500724'
    ),
    mainImage: createServiceBanner(
      'Asesoría Streetwear',
      'Diagnóstico de estilo, cápsula de outfits y guía de compras',
      '#ec4899',
      '#500724'
    ),
    thumbnails: [],
    incluye: [
      'Sesión personalizada 1 a 1 por videollamada (90 min)',
      'Dossier PDF con paleta de colores, tallajes y combinaciones clave',
      'Lista curada de prendas y calzado ajustada a tu presupuesto',
    ],
    descripcion:
      'Construye un armario funcional y con identidad propia. Ideal para renovar tu imagen personal o preparar sesiones fotográficas y presentaciones.',
    description:
      'Construye un armario funcional y con identidad propia. Ideal para renovar tu imagen personal o preparar sesiones fotográficas y presentaciones.',
    reviews: [],
  },
  {
    id: 106,
    tipo: 'Servicio',
    ownerId: 3,
    proveedorId: 3,
    estadoModeracion: 'Aprobado',
    aprobadoPorAdmin: true,
    verificado: true,
    destacado: false,
    sku: 'SRV-LUT-106',
    nombre: 'Calibración y Mantención de Guitarras y Bajos',
    title: 'Calibración y Mantención de Guitarras y Bajos',
    brand: 'Taller Luthier Sur',
    marca: 'Taller Luthier Sur',
    vendedorTipo: 'Emprendedor',
    vendedorNombre: 'SneakerCare & Custom Studio',
    cobertura: 'Concepción y Talcahuano',
    garantia: '30 días de ajuste sin costo',
    categoria: 'Servicios musicales',
    modalidad: 'Presencial',
    tiempoEstimado: '48 horas',
    permiteCotizacion: 'no',
    precio: 32990,
    price: 32990,
    restriccionEdad: 'no',
    rating: 4.9,
    image: createServiceBanner(
      'Taller de Luthería',
      'Octavación, ajuste de alma, hidratación y revisión electrónica',
      '#06b6d4',
      '#164e63'
    ),
    mainImage: createServiceBanner(
      'Taller de Luthería',
      'Octavación, ajuste de alma, hidratación y revisión electrónica',
      '#06b6d4',
      '#164e63'
    ),
    thumbnails: [],
    incluye: [
      'Ajuste de curvatura de mástil, altura de cuerdas y octavación',
      'Limpieza y nutrición de diapasón más pulido de trastes',
      'Revisión y limpieza de potenciómetros, jack y selector',
    ],
    descripcion:
      'Servicio técnico especializado de luthería para instrumentos eléctricos y acústicos. Garantiza afinación precisa y máxima comodidad al tocar.',
    description:
      'Servicio técnico especializado de luthería para instrumentos eléctricos y acústicos. Garantiza afinación precisa y máxima comodidad al tocar.',
    reviews: [],
  },
  {
    id: 107,
    tipo: 'Servicio',
    ownerId: 3,
    proveedorId: 3,
    estadoModeracion: 'Pendiente',
    aprobadoPorAdmin: false,
    verificado: true,
    destacado: false,
    sku: 'SRV-AUT-107',
    nombre: 'Autenticación Legit Check Presencial de Sneakers Coleccionables',
    title: 'Autenticación Legit Check Presencial de Sneakers Coleccionables',
    brand: 'SneakerCare Lab',
    marca: 'SneakerCare Lab',
    vendedorTipo: 'Emprendedor',
    vendedorNombre: 'SneakerCare & Custom Studio',
    cobertura: 'Concepción / Online con fotos macro',
    garantia: 'Certificado digital foliado',
    categoria: 'Mantención y Limpieza',
    modalidad: 'Presencial',
    tiempoEstimado: '24 horas',
    permiteCotizacion: 'no',
    precio: 19990,
    price: 19990,
    restriccionEdad: 'no',
    rating: 5.0,
    image: createServiceBanner(
      'Legit Check & Peritaje',
      'Verificación UV, costuras, etiquetas y certificado de autenticidad',
      '#38bdf8',
      '#1e293b'
    ),
    mainImage: createServiceBanner(
      'Legit Check & Peritaje',
      'Verificación UV, costuras, etiquetas y certificado de autenticidad',
      '#38bdf8',
      '#1e293b'
    ),
    thumbnails: [],
    incluye: [
      'Inspección con luz UV, calibre de materiales y base de referencia oficial',
      'Emisión de informe digital de autenticidad',
    ],
    descripcion:
      'Servicio en cola de aprobación del Administrador para certificación de pares de edición limitada antes de compra o venta.',
    description:
      'Servicio en cola de aprobación del Administrador para certificación de pares de edición limitada antes de compra o venta.',
    reviews: [],
  },
];
