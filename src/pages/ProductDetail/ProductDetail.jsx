import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  Clock,
  MapPin,
  CheckCircle2,
  Store,
  ShieldCheck,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { Rating } from '@mui/material';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/atoms/Button/CustomButton';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import QuoteModal from '@/components/molecules/QuoteModal/QuoteModal';
import { formatCurrency } from '@/utils/validators';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { findItemById, toggleWishlist, isInWishlist, addReview } = useProducts();
  const { showToast } = useToast();
  const { isLoggedIn, currentUser } = useAuth();

  const item = findItemById(id);

  const [selectedImage, setSelectedImage] = useState('');
  const [talla, setTalla] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  // Estado formulario reseña
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (item) {
      setSelectedImage(item.mainImage || item.image);
      setTalla(item.tallas?.[0] || '10 US');
      setColor(item.colores?.[0] || 'Negro');
      setQuantity(1);
    }
  }, [item]);

  if (!item) {
    return (
      <section className="max-w-lg mx-auto py-20 px-6 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
          Artículo o servicio no encontrado
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Es posible que haya sido eliminado o que la dirección no exista.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/tienda">
            <CustomButton variant="primary">Ir a la Tienda</CustomButton>
          </Link>
          <Link to="/servicios">
            <CustomButton variant="secondary">Ver Servicios</CustomButton>
          </Link>
        </div>
      </section>
    );
  }

  const isService = item.tipo === 'Servicio';
  const liked = isInWishlist(item.id);
  const galleryImages =
    item.thumbnails && item.thumbnails.length > 0
      ? Array.from(new Set([item.mainImage || item.image, ...item.thumbnails]))
      : [item.mainImage || item.image];

  const availableStock = isService ? 99 : Number(item.stock ?? 10);

  const buildCartPayload = () => ({
    id: item.id,
    tipo: item.tipo,
    title: item.title || item.nombre,
    price: item.price,
    talla: isService ? item.modalidad || 'Servicio' : talla,
    color: isService ? item.tiempoEstimado || 'Horario flexible' : color,
    stock: availableStock,
    image: item.image || item.mainImage,
  });

  const handleAddToCart = () => {
    addToCart(buildCartPayload(), quantity);
    showToast(
      `${quantity} × "${item.title || item.nombre}" agregado al carrito.`,
      'success'
    );
  };

  const handleBuyNow = () => {
    addToCart(buildCartPayload(), quantity);
    navigate('/carrito');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast('Escribe un comentario para publicar tu reseña.', 'warning');
      return;
    }
    addReview(item.id, item.tipo, {
      autor: isLoggedIn ? currentUser.nombre : 'Cliente Verificado',
      rating: reviewRating || 5,
      comentario: reviewComment.trim(),
    });
    setReviewComment('');
    setReviewRating(5);
    showToast('¡Gracias por tu valoración!', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="container mx-auto px-6 pt-6">
        {/* Breadcrumbs semánticos W3C separados para Tienda vs Servicios */}
        <nav className="text-xs font-medium text-gray-500 mb-6" aria-label="Ruta de navegación">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-black">
                Inicio
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                to={isService ? '/servicios' : '/tienda'}
                className="hover:text-black font-semibold"
              >
                {isService ? 'Servicios Profesionales' : 'Tienda de Productos'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-bold truncate max-w-xs" aria-current="page">
              {item.title || item.nombre}
            </li>
          </ol>
        </nav>

        {isService ? (
          /* ================= FICHA EXCLUSIVA DE SERVICIO ================= */
          <article className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-sky-100">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Imagen del servicio */}
              <div className="w-full lg:w-7/12">
                <div className="rounded-xl overflow-hidden bg-slate-900 h-80 sm:h-96">
                  <img
                    src={selectedImage || item.image}
                    alt={item.title || item.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Descripción extendida e ítems incluidos */}
                <div className="mt-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h2 className="text-base font-extrabold text-gray-900 mb-2">
                    Descripción del Servicio
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-5">
                    {item.description || item.descripcion}
                  </p>

                  {item.incluye && item.incluye.length > 0 && (
                    <>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-800 mb-3">
                        ¿Qué incluye este servicio?
                      </h3>
                      <ul className="space-y-2">
                        {item.incluye.map((inc, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Panel lateral de contratación / cotización */}
              <div className="w-full lg:w-5/12 flex flex-col bg-slate-50 p-6 sm:p-7 rounded-xl border border-slate-200 h-fit">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {item.categoria || 'Servicio Profesional'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    aria-label={liked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600"
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    {liked ? 'Guardado' : 'Guardar'}
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                  {item.title || item.nombre}
                </h1>

                <div className="flex items-center gap-2 mb-5">
                  <Rating value={Number(item.rating || 5)} precision={0.1} size="small" readOnly />
                  <span className="text-xs font-bold text-gray-600">
                    {item.rating || '5.0'} ({item.reviews?.length || 0} reseñas)
                  </span>
                </div>

                {/* Metadatos del prestador */}
                <div className="space-y-3 text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Prestador:{' '}
                      <strong className="text-gray-900">
                        {item.vendedorNombre || item.brand}
                      </strong>{' '}
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold">
                        {item.vendedorTipo || 'Profesional'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Modalidad: <strong>{item.modalidad || 'Presencial / Online'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Tiempo estimado: <strong>{item.tiempoEstimado || 'Horario flexible'}</strong>
                    </span>
                  </div>
                  {item.restriccionEdad === 'sí' && (
                    <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded">
                      Servicio sujeto a mayoría de edad (+18 años).
                    </p>
                  )}
                </div>

                {/* Precio y CTA */}
                <div className="mb-6">
                  <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {item.permiteCotizacion === 'sí'
                      ? 'Tarifa base referencial desde'
                      : 'Tarifa fija del servicio'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(item.originalPrice)}
                      </span>
                    )}
                  </div>
                  {item.permiteCotizacion === 'sí' && (
                    <p className="text-xs text-gray-500 mt-1">
                      El presupuesto final se ajusta según duración, ubicación y requerimientos.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {item.permiteCotizacion === 'sí' ? (
                    <CustomButton
                      variant="secondary"
                      size="lg"
                      fullWidth
                      startIcon={<FileText className="w-4 h-4" />}
                      onClick={() => setIsQuoteOpen(true)}
                    >
                      Solicitar una cotización
                    </CustomButton>
                  ) : (
                    <>
                      <CustomButton
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleBuyNow}
                      >
                        Contratar Servicio Ahora
                      </CustomButton>
                      <CustomButton
                        variant="outline"
                        size="md"
                        fullWidth
                        onClick={handleAddToCart}
                      >
                        Agregar al carrito
                      </CustomButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : (
          /* ================= FICHA EXCLUSIVA DE PRODUCTO ================= */
          <article className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Galería interactiva */}
              <div className="w-full lg:w-7/12 flex flex-col-reverse sm:flex-row gap-4">
                {galleryImages.length > 1 && (
                  <div className="flex sm:flex-col gap-3 overflow-x-auto sm:w-24 shrink-0">
                    {galleryImages.map((thumb, idx) => {
                      const isActive = selectedImage === thumb;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(thumb)}
                          aria-label={`Ver imagen ${idx + 1} de ${item.title}`}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border p-2 flex items-center justify-center bg-gray-50 transition-all ${
                            isActive
                              ? 'border-gray-900 ring-2 ring-gray-900'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={thumb}
                            alt={`${item.title} vista ${idx + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex-1 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-8 min-h-[340px] sm:min-h-[420px]">
                  <img
                    src={selectedImage || item.image}
                    alt={item.title}
                    className="w-full h-auto object-contain max-h-[380px]"
                  />
                </div>
              </div>

              {/* Detalles de compra del producto */}
              <div className="w-full lg:w-5/12 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
                    {item.brand} {item.sku ? `· SKU: ${item.sku}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    aria-label={liked ? 'Quitar de lista de deseos' : 'Agregar a lista de deseos'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600"
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    {liked ? 'En Favoritos' : 'Favorito'}
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                  {item.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Rating value={Number(item.rating || 4.8)} precision={0.1} size="small" readOnly />
                    <span className="text-xs font-bold text-gray-600">
                      ({item.reviews?.length || 0})
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full">
                    <Store className="w-3.5 h-3.5" />
                    Vendido por: {item.vendedorNombre || item.brand} ({item.vendedorTipo || 'Empresa'})
                  </span>
                </div>

                {/* Precio */}
                <div className="mb-6 pb-5 border-b border-gray-100">
                  {item.originalPrice && item.originalPrice > item.price && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(item.originalPrice)}
                      </span>
                      <span className="text-xs font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Ahorras {formatCurrency(item.originalPrice - item.price)}
                      </span>
                    </div>
                  )}
                  <span className="text-3xl font-extrabold text-gray-900">
                    {formatCurrency(item.price)}
                  </span>
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    {item.price >= 50000
                      ? '✓ Incluye despacho gratis a todo Chile'
                      : 'Despacho gratis en compras sobre $50.000'}
                  </p>
                </div>

                {/* Selectores de Talla, Color y Cantidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label
                      htmlFor="product-size"
                      className="block text-xs font-bold text-gray-700 uppercase mb-1.5"
                    >
                      Talla
                    </label>
                    <div className="relative">
                      <select
                        id="product-size"
                        value={talla}
                        onChange={(e) => setTalla(e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 font-medium py-2.5 px-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        {(item.tallas || ['9 US', '10 US', '11 US']).map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="product-color"
                      className="block text-xs font-bold text-gray-700 uppercase mb-1.5"
                    >
                      Color
                    </label>
                    <div className="relative">
                      <select
                        id="product-color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 font-medium py-2.5 px-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        {(item.colores || ['Negro', 'Blanco', 'Rojo']).map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Stock y Cantidad */}
                <div className="flex items-center justify-between mb-6 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">Disponibilidad</span>
                    <span
                      className={`text-xs font-semibold ${
                        availableStock > 0 ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {availableStock > 0
                        ? `${availableStock} unidades en stock`
                        : 'Sin stock disponible'}
                    </span>
                  </div>

                  {availableStock > 0 && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="product-qty" className="text-xs font-bold text-gray-600">
                        Cant.:
                      </label>
                      <select
                        id="product-qty"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-bold"
                      >
                        {Array.from({ length: Math.min(10, availableStock) }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <CustomButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={availableStock === 0}
                    onClick={handleBuyNow}
                  >
                    Comprar ahora
                  </CustomButton>
                  <CustomButton
                    variant="outline"
                    size="lg"
                    fullWidth
                    disabled={availableStock === 0}
                    startIcon={<ShoppingBag className="w-4 h-4" />}
                    onClick={handleAddToCart}
                  >
                    Agregar al carrito
                  </CustomButton>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Garantía de autenticidad y devolución gratuita por 30 días.</span>
                </div>
              </div>
            </div>

            {/* Descripción del producto */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 mb-2">
                Descripción del Producto
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          </article>
        )}

        {/* Sección de Valoraciones y Reseñas */}
        <section
          className="mt-8 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm"
          aria-label="Opiniones y valoraciones de clientes"
        >
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">
            Valoraciones y Opiniones ({item.reviews?.length || 0})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario para dejar reseña */}
            <form
              onSubmit={handleReviewSubmit}
              className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 h-fit"
            >
              <h3 className="text-sm font-bold text-gray-900">Deja tu valoración</h3>
              <div>
                <span className="block text-xs text-gray-600 mb-1">Tu calificación:</span>
                <Rating
                  name="user-rating"
                  value={reviewRating}
                  onChange={(_, newValue) => setReviewRating(newValue || 5)}
                />
              </div>
              <CustomTextField
                name="reviewComment"
                label="Tu experiencia"
                placeholder="Comparte qué te pareció la calidad o atención..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                multiline
                rows={3}
              />
              <CustomButton type="submit" variant="primary" size="sm" fullWidth>
                Publicar reseña
              </CustomButton>
            </form>

            {/* Lista de reseñas */}
            <div className="lg:col-span-2 space-y-4">
              {item.reviews && item.reviews.length > 0 ? (
                item.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-gray-900">{rev.autor}</span>
                      <span className="text-xs text-gray-400">{rev.fecha}</span>
                    </div>
                    <Rating value={Number(rev.rating)} size="small" readOnly sx={{ mb: 1 }} />
                    <p className="text-sm text-gray-700">{rev.comentario}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-6">
                  Aún no hay comentarios publicados. ¡Sé la primera persona en opinar!
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Cotización para Servicios */}
      {isService && (
        <QuoteModal
          isOpen={isQuoteOpen}
          onClose={() => setIsQuoteOpen(false)}
          service={item}
        />
      )}
    </div>
  );
};

export default ProductDetail;
