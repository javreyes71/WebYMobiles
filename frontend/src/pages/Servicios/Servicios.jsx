import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, Briefcase, Sparkles, SlidersHorizontal } from 'lucide-react';
import { CircularProgress, Alert } from '@mui/material';
import ServiceCard from '@/components/molecules/ServiceCard/ServiceCard';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

const FilterAccordion = ({ title, defaultOpen = true, children }) => {
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

const Servicios = ({ onRequireLogin }) => {
  const { servicios, isLoadingCatalog, catalogError, reloadCatalog } = useProducts();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedModalities, setSelectedModalities] = useState([]);
  const [contractType, setContractType] = useState('todos'); // 'todos' | 'fijo' | 'cotizacion'
  const [sortBy, setSortBy] = useState('destacados');

  const categories = useMemo(() => {
    const set = new Set(servicios.map((s) => s.categoria).filter(Boolean));
    return Array.from(set);
  }, [servicios]);

  const subcategories = useMemo(() => {
    const pool =
      selectedCategories.length > 0
        ? servicios.filter((s) => selectedCategories.includes(s.categoria))
        : servicios;
    const set = new Set(pool.map((s) => s.subcategoria).filter(Boolean));
    return Array.from(set);
  }, [servicios, selectedCategories]);

  const modalities = ['Presencial', 'Online', 'A domicilio'];

  const toggleItemInList = (value, list, setter) => {
    setter(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedModalities([]);
    setContractType('todos');
    setSortBy('destacados');
  };

  const filteredServices = useMemo(() => {
    return servicios
      .filter((service) => {
        // Garantía estricta: solo tipo Servicio
        if (service.tipo !== 'Servicio') return false;

        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          service.title?.toLowerCase().includes(q) ||
          service.descripcion?.toLowerCase().includes(q) ||
          service.categoria?.toLowerCase().includes(q) ||
          service.subcategoria?.toLowerCase().includes(q) ||
          service.vendedorNombre?.toLowerCase().includes(q);

        const matchesCategory =
          selectedCategories.length === 0 || selectedCategories.includes(service.categoria);

        const matchesSubcategory =
          selectedSubcategories.length === 0 || selectedSubcategories.includes(service.subcategoria);

        const matchesModality =
          selectedModalities.length === 0 || selectedModalities.includes(service.modalidad);

        const matchesContract =
          contractType === 'todos' ||
          (contractType === 'cotizacion' && service.permiteCotizacion === 'sí') ||
          (contractType === 'fijo' && service.permiteCotizacion === 'no');

        return matchesSearch && matchesCategory && matchesSubcategory && matchesModality && matchesContract;
      })
      .sort((a, b) => {
        if (sortBy === 'precio-asc') return a.price - b.price;
        if (sortBy === 'precio-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [servicios, searchTerm, selectedCategories, selectedSubcategories, selectedModalities, contractType, sortBy]);

  const handlePublishServiceClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    navigate('/admin/servicios', { state: { initialView: 'form-servicio' } });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Exclusivo de Servicios */}
      <section
        className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white py-12 px-6 border-b border-sky-900"
        aria-label="Presentación de Servicios Profesionales"
      >
        <div className="container mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Sección Independiente de Servicios
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Directorio de Servicios Profesionales
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Contrata especialistas verificados o solicita cotizaciones a medida para restauración,
              personalización, producción musical, eventos y asesorías.
            </p>
          </div>

          <div className="shrink-0">
            <CustomButton
              variant="secondary"
              size="lg"
              startIcon={<Briefcase className="w-4 h-4" />}
              onClick={handlePublishServiceClick}
            >
              Ofrecer un Servicio
            </CustomButton>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 pt-8">
        {/* Barra superior de búsqueda y ordenamiento */}
        <section
          className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8"
          aria-label="Buscador y ordenamiento de servicios"
        >
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              aria-label="Buscar servicios profesionales"
              placeholder="Buscar por servicio, especialidad o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sort-services" className="text-xs font-bold text-gray-600 uppercase">
              Ordenar por:
            </label>
            <select
              id="sort-services"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              <option value="destacados">Destacados</option>
              <option value="rating">Mejor valorados</option>
              <option value="precio-asc">Menor tarifa referencial</option>
              <option value="precio-desc">Mayor tarifa referencial</option>
            </select>
          </div>
        </section>

        {/* Acceso rápido a categorías de servicios */}
        <nav
          className="mb-8 flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto scrollbar-thin"
          aria-label="Acceso rápido por categoría de servicio"
        >
          <button
            type="button"
            onClick={() => {
              setSelectedCategories([]);
              setSelectedSubcategories([]);
            }}
            className={`whitespace-nowrap px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shrink-0 ${
              selectedCategories.length === 0
                ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos los Servicios
          </button>

          {categories.map((cat) => {
            const isCatActive = selectedCategories.length === 1 && selectedCategories[0] === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategories([cat]);
                  setSelectedSubcategories([]);
                }}
                className={`whitespace-nowrap px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shrink-0 ${
                  isCatActive
                    ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Barra lateral de filtros exclusivos de servicios */}
          <aside className="w-full lg:w-72 shrink-0" aria-label="Filtros de servicios">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" /> Filtros de Servicios
              </span>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Limpiar todo
              </button>
            </div>

            <FilterAccordion title="Categoría" defaultOpen>
              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() =>
                        toggleItemInList(cat, selectedCategories, setSelectedCategories)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </FilterAccordion>

            {subcategories.length > 0 && (
              <FilterAccordion title="Subcategoría" defaultOpen>
                <div className="space-y-2.5">
                  {subcategories.map((subcat) => (
                    <label
                      key={subcat}
                      className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubcategories.includes(subcat)}
                        onChange={() =>
                          toggleItemInList(subcat, selectedSubcategories, setSelectedSubcategories)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                      />
                      <span>{subcat}</span>
                    </label>
                  ))}
                </div>
              </FilterAccordion>
            )}

            <FilterAccordion title="Modalidad de Atención" defaultOpen>
              <div className="space-y-2.5">
                {modalities.map((mod) => (
                  <label
                    key={mod}
                    className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModalities.includes(mod)}
                      onChange={() =>
                        toggleItemInList(mod, selectedModalities, setSelectedModalities)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                    />
                    <span>{mod}</span>
                  </label>
                ))}
              </div>
            </FilterAccordion>

            <FilterAccordion title="Tipo de Contratación" defaultOpen>
              <div className="space-y-2.5 text-sm text-gray-700">
                {[
                  { value: 'todos', label: 'Todos los servicios' },
                  { value: 'fijo', label: 'Tarifa fija (Contratación directa)' },
                  { value: 'cotizacion', label: 'A medida (Solicitar cotización)' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="contractType"
                      value={opt.value}
                      checked={contractType === opt.value}
                      onChange={(e) => setContractType(e.target.value)}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </FilterAccordion>

            <FilterAccordion title="Especialidad / Categoría" defaultOpen>
              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() =>
                        toggleItemInList(cat, selectedCategories, setSelectedCategories)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </FilterAccordion>
          </aside>

          {/* Listado principal con los 4 estados de Material UI */}
          <section className="flex-1" aria-label="Resultados del catálogo de servicios">
            {isLoadingCatalog ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
                <CircularProgress color="secondary" />
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Cargando servicios disponibles...
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
                <div className="mb-4 text-sm text-gray-600 font-medium">
                  Mostrando <strong className="text-gray-900">{filteredServices.length}</strong>{' '}
                  servicio{filteredServices.length !== 1 ? 's' : ''} profesional
                  {filteredServices.length !== 1 ? 'es' : ''}
                </div>

                {filteredServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                      <ServiceCard key={service.id} {...service} />
                    ))}
                  </div>
                ) : (
                  <div className="w-full py-16 px-6 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl text-center">
                    <Briefcase className="w-12 h-12 text-sky-300 mb-3" />
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      No encontramos servicios con esos criterios
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                      Prueba limpiando los filtros activos o buscando otra especialidad.
                    </p>
                    <CustomButton variant="secondary" size="sm" onClick={clearAllFilters}>
                      Restablecer filtros
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

export default Servicios;
