import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { CircularProgress, Alert } from '@mui/material';
import ProductCard from '@/components/molecules/ProductCard/ProductCard';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useProducts } from '@/context/ProductContext';

const FilterSection = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl mb-3 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 flex justify-between items-center text-sm font-bold text-gray-800 hover:bg-gray-50"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
};

const Tienda = () => {
  const { productos, isLoadingCatalog, catalogError, reloadCatalog } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const cat = searchParams.get('categoria');
    return cat ? [cat] : [];
  });
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState(() => {
    const gen = searchParams.get('genero');
    return gen ? [gen] : [];
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [onlyFreeShipping, setOnlyFreeShipping] = useState(false);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [priceFilters, setPriceFilters] = useState({
    range1: false, // 10k - 50k
    range2: false, // 50k - 100k
    range3: false, // > 100k
  });
  const [sortBy, setSortBy] = useState('relevancia');

  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('categoria');
    const gen = searchParams.get('genero');
    setSearchTerm(q !== null ? q : '');
    setSelectedCategories(cat ? [cat] : []);
    setSelectedGenders(gen ? [gen] : []);
    setSelectedSubcategories([]);
  }, [searchParams]);

  // Opciones dinámicas extraídas de los productos en venta
  const availableCategories = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))),
    [productos]
  );
  const availableSubcategories = useMemo(() => {
    const pool =
      selectedCategories.length > 0
        ? productos.filter((p) => selectedCategories.includes(p.categoria))
        : productos;
    return Array.from(new Set(pool.map((p) => p.subcategoria).filter(Boolean)));
  }, [productos, selectedCategories]);
  const availableBrands = useMemo(() => {
    const pool =
      selectedCategories.length > 0
        ? productos.filter((p) => selectedCategories.includes(p.categoria))
        : productos;
    return Array.from(new Set(pool.map((p) => p.brand).filter(Boolean)));
  }, [productos, selectedCategories]);
  const availableGenders = ['Hombre', 'Mujer', 'Unisex'];
  const availableSizes = ['7 US', '8 US', '9 US', '10 US', '11 US', 'S', 'M', 'L', 'XL'];

  const toggleArrayFilter = (val, arr, setter) => {
    setter(arr.includes(val) ? arr.filter((item) => item !== val) : [...arr, val]);
  };

  const handlePriceChange = (range) => {
    setPriceFilters((prev) => ({ ...prev, [range]: !prev[range] }));
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setSelectedGenders([]);
    setSelectedSizes([]);
    setOnlyFreeShipping(false);
    setOnlyOffers(false);
    setPriceFilters({ range1: false, range2: false, range3: false });
    setSortBy('relevancia');
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    return productos
      .filter((product) => {
        // Separación estricta: en Tienda jamás aparecen Servicios
        if (product.tipo !== 'Producto') return false;

        // 1. Texto
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          product.title?.toLowerCase().includes(q) ||
          product.brand?.toLowerCase().includes(q) ||
          product.categoria?.toLowerCase().includes(q) ||
          product.subcategoria?.toLowerCase().includes(q);

        // 2. Precio
        const activeRanges = [];
        if (priceFilters.range1) activeRanges.push([0, 50000]);
        if (priceFilters.range2) activeRanges.push([50000, 100000]);
        if (priceFilters.range3) activeRanges.push([100000, Infinity]);

        const matchesPrice =
          activeRanges.length === 0 ||
          activeRanges.some(([min, max]) => product.price >= min && product.price <= max);

        // 3. Categoría
        const matchesCat =
          selectedCategories.length === 0 || selectedCategories.includes(product.categoria);

        // 4. Subcategoría
        const matchesSubcat =
          selectedSubcategories.length === 0 || selectedSubcategories.includes(product.subcategoria);

        // 5. Ofertas especiales
        const matchesOffers =
          !onlyOffers ||
          Boolean((product.originalPrice && product.originalPrice > product.price) || product.descuentoPorcentaje > 0);

        // 6. Marca
        const matchesBrand =
          selectedBrands.length === 0 || selectedBrands.includes(product.brand);

        // 7. Género
        const matchesGender =
          selectedGenders.length === 0 || selectedGenders.includes(product.genero || 'Unisex');

        // 8. Talla
        const matchesSize =
          selectedSizes.length === 0 ||
          (product.tallas && product.tallas.some((t) => selectedSizes.includes(t)));

        // 9. Despacho gratis
        const matchesShipping = !onlyFreeShipping || Boolean(product.freeShipping);

        return (
          matchesSearch &&
          matchesPrice &&
          matchesCat &&
          matchesSubcat &&
          matchesOffers &&
          matchesBrand &&
          matchesGender &&
          matchesSize &&
          matchesShipping
        );
      })
      .sort((a, b) => {
        if (sortBy === 'precio-asc') return a.price - b.price;
        if (sortBy === 'precio-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'nombre') return (a.title || '').localeCompare(b.title || '');
        return 0;
      });
  }, [
    productos,
    searchTerm,
    priceFilters,
    selectedCategories,
    selectedSubcategories,
    onlyOffers,
    selectedBrands,
    selectedGenders,
    selectedSizes,
    onlyFreeShipping,
    sortBy,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    onlyOffers ||
    selectedBrands.length > 0 ||
    selectedGenders.length > 0 ||
    selectedSizes.length > 0 ||
    onlyFreeShipping ||
    priceFilters.range1 ||
    priceFilters.range2 ||
    priceFilters.range3;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        {/* Encabezado de Tienda */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
              Catálogo de Productos
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Tienda Oficial Vento</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="search"
                aria-label="Buscar productos en la tienda"
                placeholder="Buscar zapatillas, ropa, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-products" className="text-xs font-bold text-gray-600 uppercase">
                Ordenar:
              </label>
              <select
                id="sort-products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="relevancia">Destacados</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="nombre">Nombre (A-Z)</option>
              </select>
            </div>
          </div>
        </header>

        {/* Barra Rápida de Categorías y Ofertas */}
        <nav
          className="mb-8 flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto scrollbar-thin"
          aria-label="Acceso rápido por categoría"
        >
          <button
            type="button"
            onClick={() => {
              setSelectedCategories([]);
              setSelectedSubcategories([]);
              setSearchParams({});
            }}
            className={`whitespace-nowrap px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shrink-0 ${
              selectedCategories.length === 0
                ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas las Categorías
          </button>

          {availableCategories.map((cat) => {
            const isCatActive = selectedCategories.length === 1 && selectedCategories[0] === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategories([cat]);
                  setSelectedSubcategories([]);
                  setSearchParams({ categoria: cat });
                }}
                className={`whitespace-nowrap px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shrink-0 ${
                  isCatActive
                    ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setOnlyOffers(!onlyOffers)}
            className={`ml-auto whitespace-nowrap px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              onlyOffers
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md ring-2 ring-red-400'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            🔥 Solo Ofertas (-% OFF)
          </button>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <aside className="w-full lg:w-64 shrink-0" aria-label="Filtros de productos">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900">
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Ofertas Especiales rápido */}
            <div className="bg-red-50/60 border border-red-200 rounded-xl px-4 py-3 mb-3">
              <label className="flex items-center justify-between cursor-pointer text-sm font-bold text-red-900">
                <span>🔥 En Oferta</span>
                <input
                  type="checkbox"
                  checked={onlyOffers}
                  onChange={(e) => setOnlyOffers(e.target.checked)}
                  className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600"
                />
              </label>
            </div>

            {/* Despacho Gratis rápido */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3">
              <label className="flex items-center justify-between cursor-pointer text-sm font-bold text-gray-800">
                <span>Despacho gratis</span>
                <input
                  type="checkbox"
                  checked={onlyFreeShipping}
                  onChange={(e) => setOnlyFreeShipping(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
              </label>
            </div>

            <FilterSection title="Precio" defaultOpen>
              <div className="space-y-2.5 text-sm text-gray-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceFilters.range1}
                    onChange={() => handlePriceChange('range1')}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span>Hasta $50.000</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceFilters.range2}
                    onChange={() => handlePriceChange('range2')}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span>$50.000 - $100.000</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceFilters.range3}
                    onChange={() => handlePriceChange('range3')}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span>Más de $100.000</span>
                </label>
              </div>
            </FilterSection>

            <FilterSection title="Categoría" defaultOpen>
              <div className="space-y-2.5 text-sm text-gray-700">
                {availableCategories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() =>
                        toggleArrayFilter(cat, selectedCategories, setSelectedCategories)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {availableSubcategories.length > 0 && (
              <FilterSection title="Subcategoría" defaultOpen>
                <div className="space-y-2.5 text-sm text-gray-700">
                  {availableSubcategories.map((subcat) => (
                    <label key={subcat} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSubcategories.includes(subcat)}
                        onChange={() =>
                          toggleArrayFilter(subcat, selectedSubcategories, setSelectedSubcategories)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span>{subcat}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            <FilterSection title="Marca" defaultOpen>
              <div className="space-y-2.5 text-sm text-gray-700">
                {availableBrands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleArrayFilter(brand, selectedBrands, setSelectedBrands)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Género">
              <div className="space-y-2.5 text-sm text-gray-700">
                {availableGenders.map((gen) => (
                  <label key={gen} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(gen)}
                      onChange={() =>
                        toggleArrayFilter(gen, selectedGenders, setSelectedGenders)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span>{gen}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Talla">
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => {
                  const active = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleArrayFilter(sz, selectedSizes, setSelectedSizes)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                        active
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </FilterSection>
          </aside>

          {/* Grilla de Productos con los 4 estados UI */}
          <section className="flex-1" aria-label="Listado de productos en venta">
            {isLoadingCatalog ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
                <CircularProgress color="primary" />
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Cargando productos de la tienda...
                </p>
              </div>
            ) : catalogError ? (
              <Alert
                severity="error"
                action={
                  <CustomButton size="sm" variant="outline" onClick={reloadCatalog}>
                    Reintentar
                  </CustomButton>
                }
              >
                {catalogError}
              </Alert>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="text-sm text-gray-600 font-medium">
                    Mostrando <strong className="text-gray-900">{filteredProducts.length}</strong>{' '}
                    producto{filteredProducts.length !== 1 ? 's' : ''}
                  </span>

                  {/* Chips de filtros activos */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategories.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-900 text-white px-2.5 py-1 rounded-full"
                        >
                          {c}
                          <button
                            type="button"
                            aria-label={`Quitar filtro ${c}`}
                            onClick={() =>
                              toggleArrayFilter(c, selectedCategories, setSelectedCategories)
                            }
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {selectedGenders.map((g) => (
                        <span
                          key={g}
                          className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-900 text-white px-2.5 py-1 rounded-full"
                        >
                          {g}
                          <button
                            type="button"
                            aria-label={`Quitar filtro ${g}`}
                            onClick={() =>
                              toggleArrayFilter(g, selectedGenders, setSelectedGenders)
                            }
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                ) : (
                  <div className="w-full py-16 px-6 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl text-center">
                    <Search className="w-12 h-12 text-gray-300 mb-3" />
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      No se encontraron productos
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                      Intenta ajustar los filtros seleccionados o buscar otro término.
                    </p>
                    <CustomButton variant="primary" size="sm" onClick={handleClearAll}>
                      Limpiar todos los filtros
                    </CustomButton>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Tienda;
