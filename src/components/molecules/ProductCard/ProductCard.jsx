import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ id, brand, title, price, image, freeShipping }) => {
  return (
    <Link to={`/producto/${id}`} className="flex flex-col bg-white border border-gray-100 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="w-full h-48 mb-4 bg-gray-50 flex items-center justify-center rounded-md overflow-hidden p-2">
        <img src={image} alt={title} className="max-w-full max-h-full object-contain" />
      </div>
      
      <div className="flex flex-col flex-grow">
        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">{brand}</span>
        <h3 className="text-sm font-medium text-gray-800 leading-tight mb-2 flex-grow">{title}</h3>
        <span className="text-lg font-bold text-gray-900 mb-2">${price.toLocaleString('es-CL')}</span>
        
        {freeShipping && (
          <span className="text-xs font-medium text-green-600">Despacho gratis</span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
