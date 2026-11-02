import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, WhatsApp } from '@mui/icons-material';
import Logo from '@/components/atoms/Logo/Logo';

const Footer = () => {
  return (
    <footer
      className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-auto"
      aria-label="Pie de página global"
    >
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Columna 1: Marca */}
        <div className="space-y-4">
          <div className="bg-white inline-block px-3 py-1.5 rounded-lg">
            <Logo className="h-7 w-auto" />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Marketplace chileno dedicado a la compra y venta de productos seleccionados y a la
            contratación segura de servicios profesionales.
          </p>
        </div>

        {/* Columna 2: Navegación Separada */}
        <div>
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
            Marketplace
          </h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/tienda" className="hover:text-white transition-colors">
                Tienda de Productos
              </Link>
            </li>
            <li>
              <Link to="/servicios" className="hover:text-sky-400 text-sky-300 font-medium transition-colors">
                Directorio de Servicios
              </Link>
            </li>
            <li>
              <Link to="/carrito" className="hover:text-white transition-colors">
                Carrito de Compras
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Comunidad y Sostenibilidad */}
        <div>
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
            Sobre Vento
          </h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/contacto" className="hover:text-white transition-colors">
                Conócenos y Contacto
              </Link>
            </li>
            <li>
              <Link to="/contacto" className="hover:text-white transition-colors">
                Sostenibilidad +Verde
              </Link>
            </li>
            <li>
              <Link to="/perfil" className="hover:text-white transition-colors">
                Mi Cuenta y Pedidos
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 4: Contacto Directo */}
        <div>
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
            Contáctanos
          </h2>
          <p className="text-sm text-gray-400 mb-1">Soporte y atención comercial:</p>
          <a
            href="mailto:contacto@vento.cl"
            className="text-sm font-semibold text-white hover:underline block mb-4"
          >
            contacto@vento.cl
          </a>

          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Redes Sociales</p>
          <div className="flex gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Visitar Instagram de Vento"
              className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-pink-400 hover:bg-gray-700 transition-colors"
            >
              <Instagram fontSize="small" />
            </a>
            <a
              href="https://wa.me/56912345678"
              target="_blank"
              rel="noreferrer"
              aria-label="Contactar por WhatsApp a Vento"
              className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-green-400 hover:bg-gray-700 transition-colors"
            >
              <WhatsApp fontSize="small" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Visitar Facebook de Vento"
              className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-blue-400 hover:bg-gray-700 transition-colors"
            >
              <Facebook fontSize="small" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500 px-6">
        © {new Date().getFullYear()} Vento Marketplace (WYM) · Cumple estándares Web W3C y WCAG.
      </div>
    </footer>
  );
};

export default Footer;
