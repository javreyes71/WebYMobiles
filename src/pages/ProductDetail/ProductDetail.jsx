import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';

import imgMain from '../../assets/productos/retro4_main.png'; 
import imgThumb1 from '../../assets/productos/retro4_thumb1.png'; 
import imgThumb2 from '../../assets/productos/retro4_thumb2.png'; 

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  
  // States for dropdowns
  const [talla, setTalla] = useState('11 US');
  const [color, setColor] = useState('Rojo');

  const handleAddToCart = () => {
    addToCart({ id, title: 'Air Jordan 4 Retro OG SP', price: 56325, talla, color });
    alert("Producto agregado al carrito");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-6 pt-8">
        
        {/* Top Header - Search & Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full md:w-[320px] mb-4 md:mb-0">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              defaultValue="Zapatillas nike" 
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <span>Vendido por:</span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="radio" name="vendor" className="form-radio text-green-500" defaultChecked />
              <span>Empresa</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="radio" name="vendor" className="form-radio text-green-500" />
              <span>Emprendedor</span>
            </label>
          </div>
        </div>

        {/* Informative text similar to the Figma mockup */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 italic max-w-2xl">
            RF-14 — Ficha de producto y selección de vendedor.<br />
            En la ficha el comprador ve filtros básicos, vendedor (emprendedor o empresa), precio, variante, stock, ofertas aplicables.
          </p>
        </div>

        {/* Main Product Area */}
        <div className="bg-white rounded-lg p-8 shadow-sm flex flex-col lg:flex-row gap-12">
          
          {/* Images Section */}
          <div className="w-full lg:w-3/5 flex flex-col md:flex-row gap-4">
            {/* Main Big Image */}
            <div className="w-full md:w-3/4 rounded-lg flex items-center justify-center p-8 border border-gray-100">
              <img src={imgMain} alt="Air Jordan 4" className="w-full h-auto object-contain max-h-[400px]" />
            </div>
            
            {/* Thumbnails */}
            <div className="w-full md:w-1/4 flex md:flex-col gap-4">
              <div className="rounded-lg flex items-center justify-center p-4 border border-gray-100 h-[190px] cursor-pointer hover:border-gray-300 transition-colors">
                <img src={imgThumb1} alt="Thumbnail 1" className="max-h-full object-contain" />
              </div>
              <div className="rounded-lg flex items-center justify-center p-4 border border-gray-100 h-[190px] cursor-pointer hover:border-gray-300 transition-colors">
                <img src={imgThumb2} alt="Thumbnail 2" className="max-h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-6">
              Air Jordan 4 Retro OG SP<br />Nigel Sylvester Brick by Brick
            </h1>

            {/* Dropdowns */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Talla</label>
                <div className="relative">
                  <select 
                    value={talla} 
                    onChange={(e) => setTalla(e.target.value)}
                    className="w-full appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  >
                    <option>11 US</option>
                    <option>10 US</option>
                    <option>9 US</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Color</label>
                <div className="relative">
                  <select 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  >
                    <option>Rojo</option>
                    <option>Negro</option>
                    <option>Blanco</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Buttons */}
            <div className="flex items-end justify-between mt-auto pt-6 border-t border-gray-100">
              <div>
                <span className="block text-sm text-gray-400 line-through mb-1">$75.100</span>
                <span className="block text-3xl font-bold text-gray-900">$56.325</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <button className="bg-cyan-200 text-cyan-900 font-bold py-2.5 px-6 rounded text-sm hover:bg-cyan-300 transition-colors">
                  Comprar ahora
                </button>
                <button 
                  className="bg-blue-100 text-blue-900 font-bold py-2.5 px-6 rounded text-sm hover:bg-blue-200 transition-colors"
                  onClick={handleAddToCart}
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-8 bg-gray-100 p-8 rounded-lg text-sm text-gray-700 leading-relaxed shadow-inner">
          <p className="font-bold mb-2">Descripción:</p>
          <p>
            Inspired by the red bricks of NYC, the Air Jordan 4 "Brick by Brick" reflects Nigel's BMX roots and dedication to progress. The Firewood Orange leather upper embodies his fearless approach, while rich Cinnabar underlays add depth and energy. A crisp Sail midsole grounds the vibrant hues, keeping the look balanced while maintaining the signature AJ4 silhouette with mesh-inspired panels and floating eyestays. In a nod to Nigel's passion, the traditional "Nike Air" branding on the heel is replaced with "Bike Air," blending sneaker culture with his BMX legacy.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
