import React, { createContext, useState, useContext } from 'react';
import { mockProducts } from '../data/products';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  // Transformar mockProducts para que tengan los campos que usa el Gestor
  const initialProducts = mockProducts.map(p => ({
    ...p,
    nombre: p.title,
    marca: p.brand,
    precio: p.price,
    descripcion: p.description,
    tipo: 'Producto',
    categoria: 'Zapatos',
    stock: 10, // Default mock stock
    restriccionEdad: 'no',
    id: p.id
  }));

  const [productos, setProductos] = useState(initialProducts);

  const addProducto = (prod) => {
    // Adaptar para la tienda
    const newProd = {
      ...prod,
      id: Date.now(),
      title: prod.nombre,
      brand: prod.marca || 'Vento',
      price: Number(prod.precio),
      description: prod.descripcion || 'Sin descripción',
      image: 'https://via.placeholder.com/300?text=Nuevo+Producto', // Mock image
      mainImage: 'https://via.placeholder.com/600?text=Nuevo+Producto',
      thumbnails: [],
      freeShipping: Number(prod.precio) > 50000
    };
    setProductos(prev => [newProd, ...prev]);
  };

  const updateProducto = (updatedProd) => {
    setProductos(prev => prev.map(p => {
      if (p.id === updatedProd.id) {
        return {
          ...p,
          ...updatedProd,
          title: updatedProd.nombre,
          price: Number(updatedProd.precio)
        };
      }
      return p;
    }));
  };

  const deleteProducto = (id) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ productos, addProducto, updateProducto, deleteProducto }}>
      {children}
    </ProductContext.Provider>
  );
};
