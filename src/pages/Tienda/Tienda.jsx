import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import ProductCard from '../../components/molecules/ProductCard/ProductCard';

import imgProd1 from '../../assets/productos/prod_1.png';
import imgProd2 from '../../assets/productos/prod_2.png';
import imgProd3 from '../../assets/productos/prod_3.png';
import imgProd4 from '../../assets/productos/prod_4.png';
import imgProd5 from '../../assets/productos/prod_5.png';

// Dummy data based on the screenshot
const mockProducts = [
  {
    id: 1,
    brand: 'Nike',
    title: "Zapatilla Nike Air More Uptempo '96",
    price: 63990,
    freeShipping: true,
    image: imgProd1
  },
  {
    id: 2,
    brand: 'Nike',
    title: 'Zapatilla urbanas',
    price: 64990,
    freeShipping: true,
    image: imgProd2
  },
  {
    id: 3,
    brand: 'Nike',
    title: 'Zapatilla Air Force',
    price: 119990,
    freeShipping: true,
    image: imgProd3
  },
  {
    id: 4,
    brand: 'Nike',
    title: 'Zapatilla Dunk Low Mujer',
    price: 99990,
    freeShipping: true,
    image: imgProd4
  },
  {
    id: 5,
    brand: 'Nike',
    title: 'Zapatilla Air Jordan',
    price: 149990,
    freeShipping: true,
    image: imgProd5
  },
  {
    id: 6,
    brand: 'Nike',
    title: 'Zapatilla de Fútbol Nike',
    price: 47990,
    freeShipping: false,
    image: imgProd2
  }
];

const FilterSection = ({ title, isOpen = false, children }) => (
  <div className="border border-gray-200 rounded-md mb-3 bg-white">
    <button className="w-full px-4 py-3 flex justify-between items-center text-sm font-semibold text-gray-800">
      {title}
      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="px-4 pb-4">
        {children}
      </div>
    )}
  </div>
);

const Tienda = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        
        {/* Search Bar matching Tienda view */}
        <div className="mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              defaultValue="Zapatillas nike" 
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <button className="w-24 py-1.5 px-4 bg-white border border-gray-300 rounded-full text-sm font-medium mb-6 hover:bg-gray-50">
              Filtrar
            </button>
            
            <FilterSection title="Precio" isOpen={true}>
              <div className="space-y-2 mt-2">
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <span className="hover:text-gray-900">$10.000 - $50.000</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <span className="hover:text-gray-900">$50.000 - $100.000</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <span className="hover:text-gray-900">$100.000 - $150.000</span>
                </label>
              </div>
            </FilterSection>

            <FilterSection title="Marca" />
            <FilterSection title="Género" />
            <FilterSection title="Tipo" />
            <FilterSection title="Talla" />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
};

export default Tienda;
