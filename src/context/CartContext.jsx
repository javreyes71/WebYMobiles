import React, { createContext, useState, useContext, useEffect } from 'react';
import { storageApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const VALID_COUPONS = {
  VENTO10: { code: 'VENTO10', rate: 0.1, label: '10% OFF Cupón Vento' },
  BIENVENIDO: { code: 'BIENVENIDO', rate: 0.15, label: '15% OFF Primera Compra' },
  VENTO20: { code: 'VENTO20', rate: 0.2, label: '20% OFF Especial' },
};

export const FREE_SHIPPING_THRESHOLD = 50000;
export const STANDARD_SHIPPING_COST = 4990;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => storageApi.getCart());
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [orders, setOrders] = useState(() => storageApi.getOrders());
  const { showToast } = useToast();

  useEffect(() => {
    storageApi.saveCart(cartItems);
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
    const quantityToAdd = Math.max(1, Number(qty) || 1);
    const maxStock = product.tipo === 'Servicio' ? 99 : Number(product.stock ?? 20);

    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          (item.talla || '') === (product.talla || '') &&
          (item.color || '') === (product.color || '')
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        const nextQty = Math.min(maxStock, newItems[existingItemIndex].quantity + quantityToAdd);
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: nextQty,
        };
        return newItems;
      }

      return [
        ...prev,
        {
          ...product,
          quantity: Math.min(maxStock, quantityToAdd),
        },
      ];
    });
  };

  const removeFromCart = (indexToRemove) => {
    setCartItems((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateQuantity = (indexToUpdate, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) => {
      const newItems = [...prev];
      const item = newItems[indexToUpdate];
      if (!item) return prev;
      const maxStock = item.tipo === 'Servicio' ? 99 : Number(item.stock ?? 20);
      if (newQuantity > maxStock) {
        showToast(`Stock máximo disponible: ${maxStock} unidades.`, 'warning');
        return prev;
      }
      newItems[indexToUpdate] = { ...item, quantity: newQuantity };
      return newItems;
    });
  };

  // Soluciona el bug crítico en Checkout.jsx (clearCart is not a function)
  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    storageApi.saveCart([]);
  };

  const applyCoupon = (rawCode) => {
    const normalized = (rawCode || '').trim().toUpperCase();
    if (!normalized) {
      return { success: false, message: 'Ingresa un código promocional.' };
    }
    const found = VALID_COUPONS[normalized];
    if (!found) {
      showToast('Cupón no válido. Prueba con VENTO10 o BIENVENIDO.', 'error');
      return { success: false, message: 'Cupón inválido.' };
    }
    setAppliedCoupon(found);
    showToast(`Cupón ${found.code} aplicado (${found.label})`, 'success');
    return { success: true, coupon: found };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupón removido.', 'info');
  };

  // Cálculo unificado para Carrito y Checkout (0 discrepancias)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const discountRate = appliedCoupon ? appliedCoupon.rate : 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const hasPhysicalProducts = cartItems.some((item) => item.tipo !== 'Servicio');
  const shippingCost =
    !hasPhysicalProducts ||
    subtotalAfterDiscount === 0 ||
    subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_COST;

  const amountForFreeShipping = hasPhysicalProducts
    ? Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount)
    : 0;

  // Desglose informativo de IVA (19% incluido en precios chilenos)
  const ivaAmount = Math.round(subtotalAfterDiscount - subtotalAfterDiscount / 1.19);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  const recordOrder = (customerInfo = {}) => {
    const newOrder = {
      id: String(Math.floor(10100 + Math.random() * 89000)),
      fecha: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      total: finalTotal,
      subtotal,
      descuento: discountAmount,
      envio: shippingCost,
      estado: 'Confirmado',
      itemsCount: cartCount,
      cliente: customerInfo,
      items: cartItems.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        price: i.price,
        talla: i.talla,
        color: i.color,
        tipo: i.tipo || 'Producto',
      })),
    };
    const updatedOrders = storageApi.addOrder(newOrder);
    setOrders(updatedOrders);
    clearCart();
    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal: subtotal,
        subtotal,
        discountRate,
        discountAmount,
        subtotalAfterDiscount,
        shippingCost,
        amountForFreeShipping,
        hasPhysicalProducts,
        ivaAmount,
        finalTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        orders,
        recordOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
