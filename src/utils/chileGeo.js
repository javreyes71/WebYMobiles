/**
 * División político-administrativa de Chile (Regiones y principales Comunas)
 * empleada en la Libreta de Direcciones del Perfil y en el flujo de Checkout.
 */
export const REGIONES_CHILE = [
  {
    codigo: 'XV',
    nombre: 'Arica y Parinacota',
    comunas: ['Arica', 'Camarones', 'Putre'],
  },
  {
    codigo: 'I',
    nombre: 'Tarapacá',
    comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
  },
  {
    codigo: 'II',
    nombre: 'Antofagasta',
    comunas: ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones'],
  },
  {
    codigo: 'IV',
    nombre: 'Coquimbo',
    comunas: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
  },
  {
    codigo: 'V',
    nombre: 'Valparaíso',
    comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón', 'San Antonio'],
  },
  {
    codigo: 'RM',
    nombre: 'Metropolitana de Santiago',
    comunas: [
      'Santiago',
      'Providencia',
      'Las Condes',
      'Ñuñoa',
      'Maipú',
      'La Florida',
      'Puente Alto',
      'Vitacura',
      'San Miguel',
    ],
  },
  {
    codigo: 'VI',
    nombre: "O'Higgins",
    comunas: ['Rancagua', 'Machalí', 'San Fernando', 'Rengo'],
  },
  {
    codigo: 'VII',
    nombre: 'Maule',
    comunas: ['Talca', 'Curicó', 'Linares', 'Constitución'],
  },
  {
    codigo: 'XVI',
    nombre: 'Ñuble',
    comunas: ['Chillán', 'Chillán Viejo', 'San Carlos'],
  },
  {
    codigo: 'VIII',
    nombre: 'Biobío',
    comunas: [
      'Concepción',
      'Talcahuano',
      'San Pedro de la Paz',
      'Chiguayante',
      'Hualpén',
      'Coronel',
      'Los Ángeles',
    ],
  },
  {
    codigo: 'IX',
    nombre: 'La Araucanía',
    comunas: ['Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón', 'Angol'],
  },
  {
    codigo: 'XIV',
    nombre: 'Los Ríos',
    comunas: ['Valdivia', 'La Unión', 'Río Bueno'],
  },
  {
    codigo: 'X',
    nombre: 'Los Lagos',
    comunas: ['Puerto Montt', 'Osorno', 'Puerto Varas', 'Castro', 'Ancud'],
  },
  {
    codigo: 'XII',
    nombre: 'Magallanes',
    comunas: ['Punta Arenas', 'Puerto Natales'],
  },
];

export const getComunasByRegion = (codigoRegion) => {
  const found = REGIONES_CHILE.find((r) => r.codigo === codigoRegion);
  return found ? found.comunas : [];
};

export const getRegionLabel = (codigoRegion) => {
  const found = REGIONES_CHILE.find((r) => r.codigo === codigoRegion);
  return found ? found.nombre : codigoRegion;
};
