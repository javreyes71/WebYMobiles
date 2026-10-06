import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const Checkout = () => {
  const { cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handlePagar = (e) => {
    e.preventDefault();
    showToast("¡Pago procesado con éxito!", "success");
    clearCart();
    navigate('/perfil');
  };

  // Asumiendo que el total ya viene calculado del carrito, mostramos el cartTotal.
  const total = cartTotal;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="border-b border-gray-200 px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Método de Pago</h1>
          </div>

          <form onSubmit={handlePagar} className="flex flex-col md:flex-row">
            
            {/* Left Column: Payment Details */}
            <div className="w-full md:w-1/2 p-8 border-r border-gray-200 flex flex-col">
              <div className="flex gap-4 mb-8">
                {/* Simulated Logos - Since we don't have the actual images, we'll use styled text/divs if imports fail, or just text */}
                <div className="px-4 py-2 border rounded font-bold text-blue-900 bg-blue-50">VISA</div>
                <div className="px-4 py-2 border rounded font-bold text-red-600 bg-red-50">MasterCard</div>
                <div className="px-4 py-2 border rounded font-bold text-blue-500 bg-blue-50">PayPal</div>
              </div>

              <div className="space-y-4 mb-12">
                <input type="text" placeholder="Numero de tarjeta *" required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" />
                <input type="text" placeholder="Fecha vencimiento *" required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" />
                <input type="text" placeholder="N° de seguridad *" required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" />
              </div>

              <div className="mt-auto pt-8 flex items-center justify-between border-t border-gray-100">
                <span className="text-3xl font-bold text-gray-900">Total:</span>
                <span className="text-3xl font-bold text-gray-900">${total.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Right Column: Personal Details */}
            <div className="w-full md:w-1/2 p-8 flex flex-col bg-gray-50">
              <div className="space-y-4 mb-8">
                <input type="email" placeholder="E-mail *" required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                <input type="text" placeholder="Primer nombre *" required className="w-full px-4 py-3 border border-blue-500 rounded text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                <input type="text" placeholder="Apellido paterno *" required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500" />
                
                <select required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500 bg-white">
                  <option value="">Region *</option>
                  <option value="RM">Metropolitana</option>
                  <option value="V">Valparaíso</option>
                  <option value="VIII">Biobío</option>
                </select>

                <select required className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-gray-500 bg-white">
                  <option value="">Ciudad *</option>
                  <option value="Santiago">Santiago</option>
                  <option value="Providencia">Providencia</option>
                  <option value="Viña del Mar">Viña del Mar</option>
                </select>
              </div>

              <div className="mt-auto">
                <button type="submit" className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xl py-4 rounded transition-colors shadow-sm">
                  Pagar
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
