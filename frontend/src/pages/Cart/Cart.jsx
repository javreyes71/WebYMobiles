import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Tag, Truck, X } from 'lucide-react';
import { useCart, FREE_SHIPPING_THRESHOLD } from '@/context/CartContext';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { formatCurrency } from '@/utils/validators';

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    shippingCost,
    amountForFreeShipping,
    hasPhysicalProducts,
    ivaAmount,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const navigate = useNavigate();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    if (res.success) setCouponInput('');
  };

  const progressPct = Math.min(
    100,
    Math.round(((FREE_SHIPPING_THRESHOLD - amountForFreeShipping) / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Carrito de Compras</h1>
            <p className="text-sm text-gray-500">
              Revisa tus artículos antes de continuar al pago seguro
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-bold text-red-600 hover:underline self-start sm:self-auto"
            >
              Vaciar carrito
            </button>
          )}
        </header>

        {cartItems.length === 0 ? (
          <section className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Tu carrito está vacío</h2>
            <p className="text-sm text-gray-500 mb-6">
              Explora nuestra tienda de productos o contrata un servicio profesional.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/tienda">
                <CustomButton variant="primary">Ir a la Tienda</CustomButton>
              </Link>
              <Link to="/servicios">
                <CustomButton variant="secondary">Explorar Servicios</CustomButton>
              </Link>
            </div>
          </section>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Lista de ítems */}
            <section
              className="w-full lg:w-7/12 space-y-4"
              aria-label="Artículos agregados al carrito"
            >
              {/* Barra de progreso hacia Despacho Gratis */}
              {hasPhysicalProducts && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                    <Truck className="w-4 h-4 text-green-600 shrink-0" />
                    {amountForFreeShipping === 0 ? (
                      <span className="text-green-700 font-bold">
                        ¡Felicidades! Tu compra cuenta con Despacho Gratis.
                      </span>
                    ) : (
                      <span>
                        Te faltan <strong>{formatCurrency(amountForFreeShipping)}</strong> para
                        obtener <strong>Despacho Gratis</strong>.
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {cartItems.map((item, index) => {
                const isService = item.tipo === 'Servicio';
                return (
                  <article
                    key={`${item.id}-${item.talla}-${item.color}-${index}`}
                    className="flex flex-col sm:flex-row bg-white rounded-xl border border-gray-200 p-4 sm:p-5 relative shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      aria-label={`Eliminar ${item.title} del carrito`}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="w-full sm:w-28 h-28 shrink-0 flex items-center justify-center bg-gray-50 rounded-xl p-2 sm:mr-5 mb-4 sm:mb-0 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <div className="flex flex-col justify-between flex-grow pr-8">
                      <div>
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mb-1 ${
                            isService
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isService ? 'Servicio' : 'Producto'}
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-1">
                          {item.title}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {isService ? 'Modalidad' : 'Talla'}:{' '}
                          <strong className="text-gray-800">{item.talla}</strong> ·{' '}
                          {isService ? 'Duración' : 'Color'}:{' '}
                          <strong className="text-gray-800">{item.color}</strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="inline-flex items-center border border-gray-300 rounded-lg">
                          <button
                            type="button"
                            aria-label={`Disminuir cantidad de ${item.title}`}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3.5 py-1 text-sm font-bold text-gray-900 border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${item.title}`}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-extrabold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[11px] text-gray-400">
                              {formatCurrency(item.price)} c/u
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Resumen del Pedido unificado con Checkout */}
            <aside
              className="w-full lg:w-5/12 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit"
              aria-label="Resumen de valores de compra"
            >
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">Resumen de Compra</h2>

              {/* Cupón promocional */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3.5 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-green-800">
                      <Tag className="w-4 h-4" />
                      <span>
                        {appliedCoupon.code} ({appliedCoupon.label})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label="Quitar cupón"
                      className="text-green-700 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Código de cupón de descuento"
                      placeholder="Cupón (ej: VENTO10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <CustomButton type="submit" variant="outline" size="sm">
                      Aplicar
                    </CustomButton>
                  </form>
                )}
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal productos/servicios</span>
                  <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Descuento promocional</span>
                    <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Despacho</span>
                  <span className="font-bold text-gray-900">
                    {shippingCost === 0 ? (
                      <span className="text-green-700">Gratis</span>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-gray-400 pt-1">
                  <span>IVA (19% incluido)</span>
                  <span>{formatCurrency(ivaAmount)}</span>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-200 mb-6 flex items-baseline justify-between">
                <span className="text-lg font-extrabold text-gray-900">Total a pagar</span>
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatCurrency(finalTotal)}
                </span>
              </div>

              <CustomButton
                variant="success"
                size="lg"
                fullWidth
                onClick={() => navigate('/checkout')}
              >
                Continuar al Pago
              </CustomButton>

              <Link
                to="/tienda"
                className="text-center text-xs font-semibold text-gray-500 hover:text-black mt-4"
              >
                Seguir explorando la tienda
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
