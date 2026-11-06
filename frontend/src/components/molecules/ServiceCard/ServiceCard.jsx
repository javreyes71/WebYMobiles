import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Heart, Star, ArrowUpRight, FileText } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { formatCurrency } from '@/utils/validators';
import { createServiceBanner } from '@/data/services';

/**
 * Molécula ServiceCard: diseñada específicamente para la Oferta de Servicios,
 * separada visual y funcionalmente de la venta de productos físicos.
 */
const ServiceCard = ({
  id,
  title,
  nombre,
  brand,
  vendedorNombre,
  vendedorTipo,
  categoria,
  modalidad,
  tiempoEstimado,
  permiteCotizacion,
  price,
  originalPrice,
  image,
  descripcion,
  rating,
}) => {
  const { toggleWishlist, isInWishlist } = useProducts();
  const liked = isInWishlist(id);
  const displayTitle = title || nombre;
  const provider = vendedorNombre || brand || 'Profesional Verificado';
  const isQuotable = permiteCotizacion === 'sí';

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <article className="group relative flex flex-col bg-white border border-sky-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-sky-300 transition-all">
      {/* Botón Favorito */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={
          liked ? `Quitar servicio ${displayTitle} de favoritos` : `Guardar servicio ${displayTitle}`
        }
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 shadow-sm transition-colors"
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      <Link to={`/servicio/${id}`} className="flex flex-col flex-grow">
        {/* Cabecera visual del servicio */}
        <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
          <img
            src={image}
            alt={displayTitle}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = createServiceBanner(
                displayTitle,
                categoria || 'Servicio Profesional',
                '#38bdf8',
                '#0c4a6e'
              );
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            <span className="bg-sky-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
              {categoria || 'Servicio Profesional'}
            </span>
            {modalidad && (
              <span className="bg-white/95 text-slate-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" />
                {modalidad}
              </span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-semibold text-sky-800 truncate">
              {provider}{' '}
              {vendedorTipo && (
                <span className="text-gray-400 font-normal">· {vendedorTipo}</span>
              )}
            </span>
            {rating && (
              <span className="inline-flex items-center gap-1 font-bold text-gray-700 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {rating}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-sky-700 transition-colors">
            {displayTitle}
          </h3>

          {descripcion && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
              {descripcion}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 mt-auto">
            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Duración / Entrega: {tiempoEstimado || 'Horario flexible'}</span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
            <div>
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                {isQuotable ? 'Valor referencial desde' : 'Tarifa fija'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-gray-900">
                  {formatCurrency(price)}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                isQuotable
                  ? 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white'
                  : 'bg-gray-900 text-white group-hover:bg-black'
              }`}
            >
              {isQuotable ? (
                <>
                  <FileText className="w-3.5 h-3.5" /> Cotizar
                </>
              ) : (
                <>
                  Contratar <ArrowUpRight className="w-3.5 h-3.5" />
                </>
              )}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ServiceCard;
