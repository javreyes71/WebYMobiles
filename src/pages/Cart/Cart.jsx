import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  
  return (
    <div className="min-h-screen bg-gray-200 py-12">
      <div className="container mx-auto px-6">
        
        {cartItems.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
            <Link to="/tienda" className="text-blue-600 hover:underline">Volver a la tienda</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Side: Cart Items List */}
            <div className="w-full lg:w-3/5 bg-gray-100 p-6 rounded-lg border border-gray-300">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Tus Productos</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row bg-white rounded border border-gray-200 p-4 relative">
                    
                    {/* Botón de eliminar */}
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="w-full sm:w-32 h-32 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded p-2 sm:mr-6 mb-4 sm:mb-0">
                      <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                    </div>
                    
                    <div className="flex flex-col justify-between flex-grow pr-8">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 pr-4">{item.title}</h3>
                        <p className="text-sm text-gray-500 mb-1">Talla: <span className="font-medium text-gray-800">{item.talla}</span></p>
                        <p className="text-sm text-gray-500 mb-3">Color: <span className="font-medium text-gray-800">{item.color}</span></p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button 
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1 font-bold text-gray-800 border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button 
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          ${(item.price * item.quantity).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Order Summary */}
            <div className="w-full lg:w-2/5 bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col h-fit">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-6 border-b border-gray-100 pb-4">
                Resumen de Compra
              </h2>

              <div className="space-y-4 mb-6 flex-grow">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">${cartTotal.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-200 pt-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-lg font-bold text-gray-900">Total a Pagar</span>
                  <span className="text-3xl font-bold text-gray-900">
                    ${cartTotal.toLocaleString('es-CL')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-8 italic text-right">Impuestos incluidos</p>

                <button 
                  className="w-full py-4 border-2 border-gray-900 text-gray-900 font-bold text-lg rounded hover:bg-gray-900 hover:text-white transition-colors"
                  onClick={() => alert("Procesando pago seguro...")}
                >
                  Pagar Ahora
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;
