import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Briefcase, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import ProductCard from '@/components/molecules/ProductCard/ProductCard';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useProducts } from '@/context/ProductContext';
import { createProductMockImage } from '@/data/products';

import heroBanner from '@/assets/inicio/hero_banner.png';
import catHombre from '@/assets/inicio/cat_hombre.png';
import catZapatos from '@/assets/inicio/cat_zapatos.png';
import catRopa from '@/assets/inicio/cat_ropa.png';

const Home = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { productos } = useProducts();

  const featuredProducts = [...productos]
    .sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)))
    .slice(0, 4);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/tienda?q=${encodeURIComponent(trimmed)}` : '/tienda');
  };

  const categories = [
    {
      label: 'Zapatos',
      image: catZapatos,
      to: '/tienda?categoria=Zapatos',
      alt: 'Categoría Zapatillas y Calzado',
    },
    {
      label: 'Ropa',
      image: catRopa,
      to: '/tienda?categoria=Ropa',
      alt: 'Categoría Ropa Urbana',
    },
    {
      label: 'Accesorios',
      image: createProductMockImage('Accesorios Urbanos', 'Accesorios', 'Vento', '#f97316', '#18181b'),
      to: '/tienda?categoria=Accesorios',
      alt: 'Categoría Accesorios y Bolsos',
    },
    {
      label: 'Instrumentos',
      image: createProductMockImage('Pedales y Audio', 'Instrumentos', 'Vento Gear', '#8b5cf6', '#2e1065'),
      to: '/tienda?categoria=Instrumentos',
      alt: 'Categoría Instrumentos y Audio',
    },
    {
      label: 'Hombre',
      image: catHombre,
      to: '/tienda?genero=Hombre',
      alt: 'Categoría calzado y moda Hombre',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8 space-y-14">
        {/* Buscador rápido hacia la Tienda */}
        <section aria-label="Búsqueda rápida en tienda">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="search"
                aria-label="¿Qué producto buscas hoy?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas, marcas o ropa urbana..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <CustomButton type="submit" variant="primary" className="rounded-full">
              Buscar en Tienda
            </CustomButton>
          </form>
        </section>

        {/* Hero Banner Principal */}
        <section
          className="w-full rounded-2xl overflow-hidden flex items-center shadow-lg relative h-[420px] md:h-[480px]"
          aria-label="Promoción destacada"
        >
          <img
            src={heroBanner}
            alt="Colección de marcas destacadas en Vento Marketplace"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="relative z-10 p-8 md:p-14 text-white w-full h-full flex flex-col justify-end items-start md:items-end text-left md:text-right">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Temporada Vento 2026
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
              Marcas destacadas
            </h1>
            <p className="text-base sm:text-lg font-medium tracking-wide text-gray-200 mb-6">
              OFERTAS SELECCIONADAS Y DESPACHO GRATIS SOBRE $50.000
            </p>
            <Link to="/tienda">
              <CustomButton
                variant="navbar"
                size="lg"
                endIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explorar Tienda
              </CustomButton>
            </Link>
          </div>
        </section>

        {/* Beneficios clave */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-y border-gray-100"
          aria-label="Garantías del Marketplace"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Despacho Gratis desde $50.000</h2>
              <p className="text-xs text-gray-500">Envíos rápidos a todas las regiones de Chile</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Compra y Venta Protegida</h2>
              <p className="text-xs text-gray-500">Empresas y emprendedores verificados con RUT</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Portal Exclusivo de Servicios</h2>
              <p className="text-xs text-gray-500">
                Contratación directa o cotizaciones a medida en{' '}
                <Link to="/servicios" className="text-sky-700 font-semibold hover:underline">
                  Servicios
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Busca por categorías */}
        <section aria-label="Categorías de productos">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Busca por categorías</h2>
            <Link
              to="/tienda"
              className="text-sm font-bold text-gray-700 hover:text-black inline-flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.to}
                className="flex flex-col items-center group focus:outline-none"
              >
                <div className="w-28 h-28 rounded-2xl bg-gray-100 mb-3 overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md group-hover:border-gray-400 transition-all">
                  <img
                    src={cat.image}
                    alt={cat.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-sm font-bold text-gray-800 group-hover:text-black">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Productos Destacados (Solo Productos) */}
        {featuredProducts.length > 0 && (
          <section aria-label="Productos destacados en venta">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Destacados en Tienda</h2>
                <p className="text-sm text-gray-500">
                  Los lanzamientos y ofertas más buscados de la semana
                </p>
              </div>
              <Link to="/tienda">
                <CustomButton variant="outline" size="sm">
                  Ir a la Tienda
                </CustomButton>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </section>
        )}

        {/* Banner de acceso al portal independiente de Servicios (sin mezclar catálogos) */}
        <section
          className="rounded-2xl bg-gradient-to-r from-slate-900 to-sky-900 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md"
          aria-label="Acceso a sección Servicios"
        >
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-300 mb-2">
              <Sparkles className="w-4 h-4" /> Portal Separado de Servicios
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
              ¿Buscas u ofreces un servicio especializado?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explora nuestra sección dedicada exclusivamente a servicios profesionales: limpieza y
              customización de calzado, producción musical, eventos y asesorías.
            </p>
          </div>
          <Link to="/servicios" className="shrink-0">
            <CustomButton
              variant="secondary"
              size="lg"
              endIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ir a Sección Servicios
            </CustomButton>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Home;
