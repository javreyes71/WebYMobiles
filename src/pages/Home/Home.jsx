import React from 'react';
import { Search } from 'lucide-react';

import heroBanner from '../../assets/inicio/hero_banner.png';
import catHombre from '../../assets/inicio/cat_hombre.png';
import catZapatos from '../../assets/inicio/cat_zapatos.png';
import catRopa from '../../assets/inicio/cat_ropa.png';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-6">
        
        {/* Search Bar */}
        <div className="flex justify-start mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="¿Qué buscas?" 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Hero Banner */}
        <div className="w-full rounded-2xl overflow-hidden mb-12 flex items-center shadow-md relative h-[480px]">
          <img src={heroBanner} alt="Marcas destacadas" className="absolute inset-0 w-full h-full object-cover" />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="relative z-10 p-12 text-white w-full h-full flex flex-col justify-end items-end pb-16 pr-16 text-right">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 font-serif">Marcas destacadas</h1>
            <p className="text-lg font-medium tracking-wide">60% OFF POR TIEMPO LIMITADO</p>
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Busca por categorías</h2>
          <div className="flex space-x-8 overflow-x-auto pb-4">
            
            {/* Category 1 */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                <img src={catHombre} alt="Hombre" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Hombre</span>
            </div>

            {/* Category 2 */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                <img src={catZapatos} alt="Zapatos" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Zapatos</span>
            </div>

            {/* Category 3 */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                <img src={catRopa} alt="Ropa" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Ropa</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
