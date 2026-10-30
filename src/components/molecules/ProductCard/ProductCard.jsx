import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Truck } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { formatCurrency } from '@/utils/validators';

const ProductCard = ({
  id,
  brand,
  title,
  price,
  originalPrice,
  descuentoPorcentaje,
  image,
  freeShipping,
  categoria,
  stock,
  rating,
}) => {
  const { toggleWishlist, isInWishlist } = useProducts();
  const liked = isInWishlist(id);
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct =
    descuentoPorcentaje ||
    (hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <article className="group relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all">
      {/* Badges superiores */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {hasDiscount && discountPct > 0 && (
          <span className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            -{discountPct}% OFF
          </span>
        )}
        {stock !== undefined && stock <= 5 && stock > 0 && (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimas {stock} un.!
          </span>
        )}
      </div>

      {/* Botón Favorito */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={liked ? `Quitar ${title} de favoritos` : `Agregar ${title} a favoritos`}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 shadow-sm transition-colors"
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      <Link to={`/producto/${id}`} className="flex flex-col flex-grow p-4">
        <div className="w-full h-48 mb-4 bg-gray-50 flex items-center justify-center rounded-lg overflow-hidden p-3">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              {brand}
            </span>
            {rating && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {rating}
              </span>
            )}
          </div>

          {categoria && (
            <span className="text-[11px] text-gray-400 font-medium mb-1">{categoria}</span>
          )}

          <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-3 flex-grow line-clamp-2 group-hover:text-black">
            {title}
          </h3>

          <div className="mt-auto pt-2 border-t border-gray-100">
            {hasDiscount && (
              <span className="block text-xs text-gray-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-gray-900">
                {formatCurrency(price)}
              </span>
              {freeShipping && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <Truck className="w-3 h-3" /> Gratis
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
