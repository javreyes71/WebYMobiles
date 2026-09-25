import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import ProductCard from '../../components/molecules/ProductCard/ProductCard';
import { mockProducts } from '../../data/products';

const FilterSection = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-md mb-3 bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center text-sm font-semibold text-gray-800"
      >
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
};

const Tienda = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilters, setPriceFilters] = useState({
    range1: false, // 10k - 50k
    range2: false, // 50k - 100k
    range3: false, // 100k - 150k
  });

  const handlePriceChange = (range) => {
    setPriceFilters(prev => ({
      ...prev,
      [range]: !prev[range]
    }));
  };

  // Filter Logic
  const filteredProducts = mockProducts.filter(product => {
    // 1. Search Filter
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Price Filter
    const activeRanges = [];
    if (priceFilters.range1) activeRanges.push([10000, 50000]);
    if (priceFilters.range2) activeRanges.push([50000, 100000]);
    if (priceFilters.range3) activeRanges.push([100000, 150000]);

    let matchesPrice = true;
    if (activeRanges.length > 0) {
      matchesPrice = activeRanges.some(([min, max]) => product.price >= min && product.price <= max);
    }

    return matchesSearch && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        
        {/* Search Bar matching Tienda view */}
        <div className="mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar zapatillas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <button 
              onClick={() => {
                setSearchTerm('');
                setPriceFilters({ range1: false, range2: false, range3: false });
              }}
              className="w-full py-2 bg-white border border-gray-300 rounded-md text-sm font-medium mb-6 hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
            
            <FilterSection title="Precio" defaultOpen={true}>
              <div className="space-y-3 mt-2">
                <label className="flex items-center space-x-3 text-sm text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-black rounded border-gray-300 focus:ring-black"
                    checked={priceFilters.range1}
                    onChange={() => handlePriceChange('range1')}
                  />
                  <span className="hover:text-gray-900">$10.000 - $50.000</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-black rounded border-gray-300 focus:ring-black"
                    checked={priceFilters.range2}
                    onChange={() => handlePriceChange('range2')}
                  />
                  <span className="hover:text-gray-900">$50.000 - $100.000</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-black rounded border-gray-300 focus:ring-black"
                    checked={priceFilters.range3}
                    onChange={() => handlePriceChange('range3')}
                  />
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
            <div className="mb-4 text-sm text-gray-500 font-medium">
              Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-lg">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No se encontraron productos</h3>
                <p className="text-sm text-gray-500">Intenta ajustar los filtros o el término de búsqueda.</p>
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
};

export default Tienda;
