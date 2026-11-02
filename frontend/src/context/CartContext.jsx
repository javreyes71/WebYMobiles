import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { API_URL, storageApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { ROLES, hasRole } from '@/utils/roles';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const FREE_SHIPPING_THRESHOLD = 50000;
export const STANDARD_SHIPPING_COST = 4990;

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { deductProductStock, updateQuoteStatus } = useProducts();
  const { showToast } = useToast();

  const [cartItems, setCartItems] = useState(() => storageApi.getCart());
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [orders, setOrders] = useState(() => storageApi.getOrders());

  useEffect(() => {
    storageApi.saveCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (!API_URL || !currentUser) return;
    const isSellerOrAdmin =
      hasRole(currentUser, ROLES.ADMIN) ||
      hasRole(currentUser, ROLES.VENDEDOR_PRODUCTO) ||
      hasRole(currentUser, ROLES.PROVEEDOR_SERVICIO);

    Promise.all([
      storageApi.fetchOrdersAsync(false),
      isSellerOrAdmin ? storageApi.fetchOrdersAsync(true) : Promise.resolve({ success: false }),
    ]).then(([mineRes, sellerRes]) => {
      const merged = new Map();
      if (mineRes?.success && Array.isArray(mineRes.data)) {
        mineRes.data.forEach((o) => merged.set(String(o.id), o));
      }
      if (sellerRes?.success && Array.isArray(sellerRes.data)) {
        sellerRes.data.forEach((o) => merged.set(String(o.id), o));
      }
      if (merged.size > 0) {
        setOrders(Array.from(merged.values()));
      }
    });
  }, [currentUser]);

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
    const availableCoupons = storageApi.getCoupons();
    const found = availableCoupons.find(
      (c) => c.code.toUpperCase() === normalized && c.active !== false
    );
    if (!found) {
      showToast('Cupón no válido o inactivo. Prueba con VENTO10 o BIENVENIDO.', 'error');
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

  const ivaAmount = Math.round(subtotalAfterDiscount - subtotalAfterDiscount / 1.19);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  const recordOrder = (customerInfo = {}) => {
    const orderItems = cartItems.map((i) => ({
      id: i.id,
      sku: i.sku || String(i.id),
      ownerId: i.ownerId || (i.tipo === 'Servicio' ? 3 : 2),
      vendedorNombre: i.vendedorNombre || 'Tienda Vento',
      title: i.title || i.nombre,
      quantity: i.quantity,
      price: i.price,
      talla: i.talla,
      color: i.color,
      tipo: i.tipo || 'Producto',
      quoteId: i.quoteId || null,
      estadoDespachoItem: 'En Preparación',
    }));

    // Si algún ítem proviene de una cotización aceptada, pasa automáticamente a 'En Ejecución'
    orderItems.forEach((it) => {
      if (it.quoteId && updateQuoteStatus) {
        updateQuoteStatus(it.quoteId, { estado: 'En Ejecución' });
      }
    });

    const newOrder = {
      id: String(Math.floor(10100 + Math.random() * 89000)),
      compradorId: currentUser?.id || null,
      compradorNombre:
        currentUser?.nombre ||
        `${customerInfo.nombre || ''} ${customerInfo.apellido || ''}`.trim() ||
        'Cliente Invitado',
      compradorRut: currentUser?.rut || customerInfo.rut || '',
      fecha: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      total: finalTotal,
      subtotal,
      descuento: discountAmount,
      cuponAplicado: appliedCoupon?.code || null,
      envio: shippingCost,
      estado: 'En Preparación',
      trackingCodigo: '',
      courier: '',
      itemsCount: cartCount,
      cliente: customerInfo,
      items: orderItems,
    };

    deductProductStock(orderItems);
    const updatedOrders = storageApi.addOrder(newOrder);
    setOrders(updatedOrders);

    if (API_URL) {
      storageApi
        .createOrderAsync({
          compradorId: currentUser?.id ? String(currentUser.id) : null,
          items: orderItems.map((it) => ({
            id: String(it.id),
            sku: String(it.sku || it.id),
            tipo: it.tipo,
            title: it.title,
            quantity: it.quantity,
            price: it.price,
            quoteId: it.quoteId ? String(it.quoteId) : null,
          })),
          cuponCodigo: appliedCoupon?.code || null,
          direccionDespacho: customerInfo.direccion || currentUser?.direccion || '',
          comuna: customerInfo.ciudad || customerInfo.comuna || '',
          region: customerInfo.region || '',
          medioPago: customerInfo.metodoPago || 'Tarjeta de Crédito',
        })
        .then((res) => {
          if (res?.success && res.data) {
            setOrders((prev) =>
              prev.map((o) => (String(o.id) === String(newOrder.id) ? res.data : o))
            );
          }
        });
    }

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId, changes) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        String(o.id) === String(orderId) ? { ...o, ...changes } : o
      );
      storageApi.saveOrders(next);
      return next;
    });

    if (API_URL && changes.estado) {
      storageApi.updateDispatchAsync(orderId, {
        estado: changes.estado,
        courier: changes.courier,
        trackingCodigo: changes.trackingCodigo,
      });
    }
  };

  // Pedidos propios del comprador actual (aislamiento estricto de datos)
  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter((o) => String(o.compradorId) === String(currentUser.id));
  }, [orders, currentUser]);

  // Pedidos que contienen productos/servicios del vendedor actual (o todos si es Admin)
  const sellerOrders = useMemo(() => {
    if (!currentUser) return [];
    if (hasRole(currentUser, ROLES.ADMIN)) return orders;
    return orders.filter((o) =>
      o.items?.some((it) => String(it.ownerId) === String(currentUser.id))
    );
  }, [orders, currentUser]);

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
        orders: myOrders,
        myOrders,
        allOrders: orders,
        sellerOrders,
        recordOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
