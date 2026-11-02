import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Avatar } from '@mui/material';
import {
  Store,
  CheckCircle2,
  MapPin,
  Star,
  Package,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import ProductCard from '@/components/molecules/ProductCard/ProductCard';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useProducts } from '@/context/ProductContext';
import { usersApi } from '@/services/api';
import { getInitials } from '@/utils/validators';

/**
 * Perfil Público de Tienda de Productos (/tienda/vendedor/:id)
 * Exclusivo para la oferta de productos físicos en venta (separado de Servicios).
 */
const PerfilVendedor = () => {
  const { id } = useParams();
  const { productos } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const vendorRecord = useMemo(() => usersApi.getPublicUserById(id), [id]);

  const vendorProducts = useMemo(
    () => productos.filter((p) => String(p.ownerId || p.vendedorId || 2) === String(id)),
    [productos, id]
  );

  const storeName =
    vendorRecord?.nombreTienda ||
    vendorProducts[0]?.vendedorNombre ||
    vendorRecord?.nombre ||
    'Tienda Oficial Vento';

  const storeBio =
    vendorRecord?.biografiaTienda ||
    'Tienda participante del ecosistema Vento Marketplace con catálogo autenticado y despacho garantizado a todo Chile.';

  const storeLocation =
    vendorRecord?.ciudadBase || vendorRecord?.direccion || 'Cobertura Nacional, Chile';

  const isVerified = Boolean(vendorRecord?.verificado || vendorProducts.some((p) => p.verificado));

  const avgRating = useMemo(() => {
    if (vendorProducts.length === 0) return '5.0';
    const sum = vendorProducts.reduce((acc, p) => acc + Number(p.rating || 4.9), 0);
    return (sum / vendorProducts.length).toFixed(1);
  }, [vendorProducts]);

  const categories = useMemo(() => {
    const cats = new Set(vendorProducts.map((p) => p.categoria).filter(Boolean));
    return ['Todas', ...Array.from(cats)];
  }, [vendorProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todas') return vendorProducts;
    return vendorProducts.filter((p) => p.categoria === selectedCategory);
  }, [vendorProducts, selectedCategory]);

  if (!vendorRecord && vendorProducts.length === 0) {
    return (
      <section className="max-w-lg mx-auto py-20 px-6 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Tienda no encontrada
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          No existen productos publicados para el vendedor consultado.
        </p>
        <Link to="/tienda">
          <CustomButton variant="primary">Volver a la Tienda</CustomButton>
        </Link>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6 max-w-6xl space-y-8">
        <Link
          to="/tienda"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Catálogo de Tienda
        </Link>

        {/* Cabecera de la Tienda */}
        <header className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-gray-900 via-gray-800 to-neutral-700" />
          <div className="px-6 sm:px-8 pb-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-4">
              <div className="flex items-end gap-4">
                <Avatar
                  sx={{
                    width: 84,
                    height: 84,
                    bgcolor: '#111827',
                    border: '4px solid #ffffff',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                  }}
                >
                  {getInitials(storeName)}
                </Avatar>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-gray-900">{storeName}</h1>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tienda Verificada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {storeLocation}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-gray-900">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {avgRating}
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-gray-500">
                    Reputación
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-gray-900">
                    <Package className="w-4 h-4 text-gray-700" />
                    {vendorProducts.length}
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-gray-500">
                    Productos Activos
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">{storeBio}</p>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-5 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Store className="w-4 h-4 text-gray-700" />
                Representante: {vendorRecord?.nombre || storeName}
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                Autenticidad verificada y garantía de cambio por 30 días
              </span>
            </div>
          </div>
        </header>

        {/* Filtro por categorías de la tienda */}
        <section aria-label="Catálogo aprobado del vendedor">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              Productos Publicados ({filteredProducts.length})
            </h2>

            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-sm text-gray-500">
                Esta tienda no tiene productos aprobados en la categoría seleccionada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilVendedor;
