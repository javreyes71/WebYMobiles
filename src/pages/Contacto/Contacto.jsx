import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Smartphone } from 'lucide-react'; // Using Smartphone as WhatsApp substitute if not available, or we can use custom SVG.

const Contacto = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-6 py-12 flex-grow">
        
        {/* Top Header Buttons */}
        <div className="flex gap-4 mb-8">
          <button className="bg-gray-300 text-gray-800 px-6 py-2 rounded-full font-bold">Sobre Nosotros</button>
          <button className="bg-gray-100 text-gray-600 px-6 py-2 rounded-full hover:bg-gray-200 transition-colors">Sostenibilidad</button>
          <div className="ml-4 flex items-center">
            <div className="border border-gray-300 rounded-full px-4 py-2 flex items-center text-gray-500 w-64 bg-gray-50">
              <span className="flex-grow">Ir a ventos.com</span>
              <span className="text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="w-64 border-4 border-gray-200 rounded-lg p-6 space-y-6">
          <Link to="#" className="block text-gray-800 hover:text-black hover:font-bold border-b border-gray-300 pb-2">Conócenos</Link>
          <Link to="#" className="block text-gray-800 hover:text-black hover:font-bold border-b border-gray-300 pb-2">Sé parte de Vento</Link>
          <Link to="/tienda" className="block text-gray-800 hover:text-black hover:font-bold border-b border-gray-300 pb-2">Ir a tienda</Link>
          <Link to="/tienda" className="block text-gray-800 hover:text-black hover:font-bold">Catálogo</Link>
        </div>

      </div>

      {/* Footer Area */}
      <div className="bg-gray-200 py-12 mt-auto">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Sobre Nosotros</h3>
            <ul className="space-y-2 text-sm text-gray-700 font-medium">
              <li><Link to="#" className="hover:underline">Conócenos</Link></li>
              <li><Link to="#" className="hover:underline">Sé parte de Vento</Link></li>
              <li><Link to="/tienda" className="hover:underline">Ir a tienda</Link></li>
              <li><Link to="/tienda" className="hover:underline">Catálogo</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Sostenibilidad</h3>
            <ul className="space-y-2 text-sm text-gray-700 font-medium">
              <li><Link to="#" className="hover:underline">+Verde</Link></li>
              <li><Link to="#" className="hover:underline">Desarrollo Local</Link></li>
              <li><Link to="#" className="hover:underline">Reporte de sostenibilidad</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Contactanos</h3>
            <div className="text-sm text-gray-700 font-medium mb-4">
              <p>Correo:</p>
              <p>vento@gmail.com</p>
            </div>
            
            <p className="text-sm text-gray-700 font-medium mb-2">Redes Sociales:</p>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-pink-600 shadow-sm cursor-pointer hover:bg-gray-50">
                <Instagram size={18} />
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm cursor-pointer hover:bg-gray-50">
                <Smartphone size={18} />
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm cursor-pointer hover:bg-gray-50">
                <Facebook size={18} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contacto;
