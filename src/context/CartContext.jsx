import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Add item, increment quantity if it already exists (matching id, talla, color)
  const addToCart = (product) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.id === product.id && item.talla === product.talla && item.color === product.color
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (indexToRemove) => {
    setCartItems(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateQuantity = (indexToUpdate, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => {
      const newItems = [...prev];
      newItems[indexToUpdate].quantity = newQuantity;
      return newItems;
    });
  };

  // Calculate totals based on quantity
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      cartCount, 
      cartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};
