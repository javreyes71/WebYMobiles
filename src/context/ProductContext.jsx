import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { catalogApi, storageApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

const createDefaultProductImage = (name = 'Producto Vento') => {
  const safeName = String(name).slice(0, 26);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#f3f4f6" rx="16"/>
    <rect x="80" y="80" width="440" height="440" fill="#ffffff" stroke="#e5e7eb" stroke-width="3" rx="16"/>
    <text x="300" y="290" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#111827" text-anchor="middle">${safeName}</text>
    <text x="300" y="330" font-family="Inter, Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">VENTO MARKETPLACE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createDefaultServiceImage = (name = 'Servicio Profesional') => {
  const safeName = String(name).slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="#0c4a6e" rx="16"/>
    <circle cx="680" cy="110" r="130" fill="#38bdf8" opacity="0.2"/>
    <text x="60" y="100" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="#7dd3fc" letter-spacing="2">SERVICIO PROFESIONAL</text>
    <text x="60" y="260" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="800" fill="#ffffff">${safeName}</text>
    <text x="60" y="310" font-family="Inter, Arial, sans-serif" font-size="18" fill="#cbd5e1">Vento Servicios Verificados</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const ProductProvider = ({ children }) => {
  // Separación estricta en estado: Productos (Tienda) vs Servicios (Oferta de Servicios)
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  const [wishlistIds, setWishlistIds] = useState(() => storageApi.getWishlist());
  const [quotes, setQuotes] = useState(() => storageApi.getQuotes());
  const { showToast } = useToast();

  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      const [prodRes, servRes] = await Promise.all([
        catalogApi.getProducts(),
        catalogApi.getServices(),
      ]);

      if (!prodRes.success || !servRes.success) {
        setCatalogError(
          prodRes.message || servRes.message || 'No fue posible cargar el catálogo.'
        );
      } else {
        setProductos(prodRes.data || []);
        setServicios(servRes.data || []);
      }
    } catch {
      setCatalogError('Fallo de conexión al obtener productos y servicios.');
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // ==================== CRUD PRODUCTOS (VENTAS) ====================
  const addProducto = (prod) => {
    const precioNum = Number(prod.precio) || 0;
    const img = prod.image || createDefaultProductImage(prod.nombre);
    const newProd = {
      ...prod,
      id: Date.now(),
      tipo: 'Producto',
      nombre: prod.nombre,
      title: prod.nombre,
      marca: prod.marca || 'Vento',
      brand: prod.marca || 'Vento',
      categoria: prod.categoria || 'Zapatos',
      genero: prod.genero || 'Unisex',
      precio: precioNum,
      price: precioNum,
      stock: prod.stock !== undefined && prod.stock !== '' ? Number(prod.stock) : 10,
      tallas: prod.tallas?.length ? prod.tallas : ['9 US', '10 US', '11 US'],
      colores: prod.colores?.length ? prod.colores : ['Negro', 'Blanco'],
      vendedorTipo: prod.vendedorTipo || 'Emprendedor',
      vendedorNombre: prod.vendedorNombre || 'Vendedor Vento',
      descripcion: prod.descripcion || 'Sin descripción especificada.',
      description: prod.descripcion || 'Sin descripción especificada.',
      image: img,
      mainImage: img,
      thumbnails: [img],
      freeShipping: precioNum >= 50000,
      rating: 5.0,
      reviews: [],
    };

    setProductos((prev) => {
      const next = [newProd, ...prev];
      catalogApi.saveProductsLocal(next);
      return next;
    });
    return newProd;
  };

  const updateProducto = (updatedProd) => {
    const precioNum = Number(updatedProd.precio ?? updatedProd.price) || 0;
    setProductos((prev) => {
      const next = prev.map((p) => {
        if (p.id === updatedProd.id) {
          const img = updatedProd.image || p.image;
          return {
            ...p,
            ...updatedProd,
            tipo: 'Producto',
            nombre: updatedProd.nombre || p.nombre,
            title: updatedProd.nombre || p.title,
            marca: updatedProd.marca || p.marca,
            brand: updatedProd.marca || p.brand,
            precio: precioNum,
            price: precioNum,
            stock:
              updatedProd.stock !== undefined && updatedProd.stock !== ''
                ? Number(updatedProd.stock)
                : p.stock ?? 10,
            descripcion: updatedProd.descripcion ?? p.descripcion,
            description: updatedProd.descripcion ?? p.description,
            image: img,
            mainImage: img,
            thumbnails: p.thumbnails?.length ? [img, ...p.thumbnails.slice(1)] : [img],
            freeShipping: precioNum >= 50000,
          };
        }
        return p;
      });
      catalogApi.saveProductsLocal(next);
      return next;
    });
  };

  const deleteProducto = (id) => {
    setProductos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      catalogApi.saveProductsLocal(next);
      return next;
    });
  };

  // ==================== CRUD SERVICIOS (OFERTA DE SERVICIOS) ====================
  const addServicio = (serv) => {
    const precioNum = Number(serv.precio) || 0;
    const img = serv.image || createDefaultServiceImage(serv.nombre);
    const newServ = {
      ...serv,
      id: Date.now(),
      tipo: 'Servicio',
      nombre: serv.nombre,
      title: serv.nombre,
      marca: serv.marca || serv.vendedorNombre || 'Profesional Vento',
      brand: serv.marca || serv.vendedorNombre || 'Profesional Vento',
      vendedorTipo: serv.vendedorTipo || 'Emprendedor',
      vendedorNombre: serv.vendedorNombre || serv.marca || 'Profesional Vento',
      categoria: serv.categoria || 'Servicios musicales',
      modalidad: serv.modalidad || 'Presencial',
      tiempoEstimado: serv.tiempoEstimado || 'A convenir',
      permiteCotizacion: serv.permiteCotizacion || 'no',
      restriccionEdad: serv.restriccionEdad || 'no',
      precio: precioNum,
      price: precioNum,
      descripcion: serv.descripcion || 'Servicio profesional verificado en Vento.',
      description: serv.descripcion || 'Servicio profesional verificado en Vento.',
      incluye: serv.incluye?.length
        ? serv.incluye
        : ['Atención personalizada', 'Garantía de satisfacción Vento'],
      image: img,
      mainImage: img,
      thumbnails: [],
      rating: 5.0,
      reviews: [],
    };

    setServicios((prev) => {
      const next = [newServ, ...prev];
      catalogApi.saveServicesLocal(next);
      return next;
    });
    return newServ;
  };

  const updateServicio = (updatedServ) => {
    const precioNum = Number(updatedServ.precio ?? updatedServ.price) || 0;
    setServicios((prev) => {
      const next = prev.map((s) => {
        if (s.id === updatedServ.id) {
          const img = updatedServ.image || s.image;
          return {
            ...s,
            ...updatedServ,
            tipo: 'Servicio',
            nombre: updatedServ.nombre || s.nombre,
            title: updatedServ.nombre || s.title,
            marca: updatedServ.marca || s.marca,
            brand: updatedServ.marca || s.brand,
            precio: precioNum,
            price: precioNum,
            descripcion: updatedServ.descripcion ?? s.descripcion,
            description: updatedServ.descripcion ?? s.description,
            image: img,
            mainImage: img,
          };
        }
        return s;
      });
      catalogApi.saveServicesLocal(next);
      return next;
    });
  };

  const deleteServicio = (id) => {
    setServicios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      catalogApi.saveServicesLocal(next);
      return next;
    });
  };

  // ==================== GESTIÓN REAL DE OFERTAS ====================
  const applyOfferToItem = ({
    productoAsociado,
    targetTipo = 'Producto',
    tipoOferta,
    porcentaje,
    precioFijo,
    inicio,
    fin,
  }) => {
    const updater = (list) =>
      list.map((item) => {
        if (String(item.id) !== String(productoAsociado)) return item;
        const basePrice = Number(item.originalPrice || item.price || item.precio);
        let newPrice = basePrice;
        let computedPct = 0;

        if (tipoOferta === 'porcentual') {
          const pct = Math.min(90, Math.max(1, Number(porcentaje) || 0));
          newPrice = Math.round(basePrice * (1 - pct / 100));
          computedPct = pct;
        } else {
          newPrice = Math.max(1, Number(precioFijo) || basePrice);
          computedPct =
            basePrice > newPrice ? Math.round(((basePrice - newPrice) / basePrice) * 100) : 0;
        }

        return {
          ...item,
          originalPrice: basePrice,
          price: newPrice,
          precio: newPrice,
          descuentoPorcentaje: computedPct,
          ofertaActiva: true,
          ofertaInicio: inicio || '',
          ofertaFin: fin || '',
          freeShipping: item.tipo === 'Producto' ? newPrice >= 50000 : false,
        };
      });

    if (targetTipo === 'Servicio') {
      setServicios((prev) => {
        const next = updater(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setProductos((prev) => {
        const next = updater(prev);
        catalogApi.saveProductsLocal(next);
        return next;
      });
    }
  };

  // ==================== RESEÑAS ====================
  const addReview = (itemId, itemTipo, reviewData) => {
    const newReview = {
      id: `rev-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      ...reviewData,
    };

    const appendReview = (list) =>
      list.map((item) => {
        if (String(item.id) !== String(itemId)) return item;
        const nextReviews = [newReview, ...(item.reviews || [])];
        const avg =
          nextReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / nextReviews.length;
        return {
          ...item,
          reviews: nextReviews,
          rating: Number(avg.toFixed(1)),
        };
      });

    if (itemTipo === 'Servicio') {
      setServicios((prev) => {
        const next = appendReview(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setProductos((prev) => {
        const next = appendReview(prev);
        catalogApi.saveProductsLocal(next);
        return next;
      });
    }
  };

  // ==================== LISTA DE DESEOS (WISHLIST) ====================
  const toggleWishlist = (id) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      storageApi.saveWishlist(next);
      showToast(
        exists ? 'Eliminado de tu lista de deseos' : 'Guardado en tu lista de deseos',
        'info'
      );
      return next;
    });
  };

  const isInWishlist = (id) => wishlistIds.includes(id);

  // ==================== COTIZACIONES DE SERVICIOS ====================
  const submitServiceQuote = async (quoteData) => {
    const response = await storageApi.createQuote(quoteData);
    if (response.success) {
      setQuotes((prev) => [response.data, ...prev]);
      showToast(response.message, 'success');
    }
    return response;
  };

  // Búsqueda por ID en ambos catálogos para vistas de detalle
  const findItemById = (id) => {
    const numericId = Number(id);
    return (
      productos.find((p) => p.id === numericId) ||
      servicios.find((s) => s.id === numericId) ||
      null
    );
  };

  return (
    <ProductContext.Provider
      value={{
        productos,
        servicios,
        isLoadingCatalog,
        catalogError,
        reloadCatalog: loadCatalog,
        addProducto,
        updateProducto,
        deleteProducto,
        addServicio,
        updateServicio,
        deleteServicio,
        applyOfferToItem,
        addReview,
        findItemById,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        quotes,
        submitServiceQuote,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
