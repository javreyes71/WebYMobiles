import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { catalogApi, storageApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  ROLES,
  MODERATION_STATUS,
  hasRole,
  didCommercialContentChange,
} from '@/utils/roles';

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
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Estado completo interno (incluye Pendientes, Aprobados, Pausados y Rechazados)
  const [allProductos, setAllProductos] = useState([]);
  const [allServicios, setAllServicios] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  const userKey = currentUser?.id || 'guest';
  const [wishlistIds, setWishlistIds] = useState(() => storageApi.getWishlist(userKey));
  const [quotes, setQuotes] = useState(() => storageApi.getQuotes());

  useEffect(() => {
    setWishlistIds(storageApi.getWishlist(userKey));
  }, [userKey]);

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
        setAllProductos(prodRes.data || []);
        setAllServicios(servRes.data || []);
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

  // Catálogos públicos estrictos: solo muestran publicaciones APROBADAS por el Admin
  const productos = useMemo(
    () =>
      allProductos.filter(
        (p) => (p.estadoModeracion || MODERATION_STATUS.APROBADO) === MODERATION_STATUS.APROBADO
      ),
    [allProductos]
  );

  const servicios = useMemo(
    () =>
      allServicios.filter(
        (s) => (s.estadoModeracion || MODERATION_STATUS.APROBADO) === MODERATION_STATUS.APROBADO
      ),
    [allServicios]
  );

  // ==================== CRUD PRODUCTOS (CON PROPIEDAD Y MODERACIÓN ESTRICTA) ====================
  const addProducto = (prod) => {
    const isAdmin = hasRole(currentUser, ROLES.ADMIN);
    const ownerId = prod.ownerId || currentUser?.id || 2;
    const precioNum = Number(prod.precio) || 0;
    const img = prod.image || createDefaultProductImage(prod.nombre);
    const estadoInicial = isAdmin
      ? MODERATION_STATUS.APROBADO
      : MODERATION_STATUS.PENDIENTE;

    const newProd = {
      ...prod,
      id: Date.now(),
      tipo: 'Producto',
      ownerId,
      vendedorId: ownerId,
      estadoModeracion: estadoInicial,
      aprobadoPorAdmin: isAdmin,
      motivoRechazo: '',
      verificado: Boolean(currentUser?.verificado || isAdmin),
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
      vendedorNombre:
        prod.vendedorNombre ||
        currentUser?.nombreTienda ||
        currentUser?.nombre ||
        'Vendedor Vento',
      descripcion: prod.descripcion || 'Sin descripción especificada.',
      description: prod.descripcion || 'Sin descripción especificada.',
      image: img,
      mainImage: img,
      thumbnails: [img],
      freeShipping: precioNum >= 50000,
      rating: 5.0,
      reviews: [],
    };

    setAllProductos((prev) => {
      const next = [newProd, ...prev];
      catalogApi.saveProductsLocal(next);
      return next;
    });
    return newProd;
  };

  const updateProducto = (updatedProd) => {
    const isAdmin = hasRole(currentUser, ROLES.ADMIN);
    const precioNum = Number(updatedProd.precio ?? updatedProd.price) || 0;
    let resetToPending = false;

    setAllProductos((prev) => {
      const next = prev.map((p) => {
        if (p.id !== updatedProd.id) return p;

        // Regla A2: Si no es Admin y cambió contenido comercial público -> vuelve a Pendiente
        const commercialChanged = didCommercialContentChange(p, updatedProd);
        let nextModeration = updatedProd.estadoModeracion || p.estadoModeracion || MODERATION_STATUS.APROBADO;
        if (!isAdmin && commercialChanged) {
          nextModeration = MODERATION_STATUS.PENDIENTE;
          resetToPending = true;
        }

        const img = updatedProd.image || p.image;
        return {
          ...p,
          ...updatedProd,
          tipo: 'Producto',
          estadoModeracion: nextModeration,
          motivoRechazo: resetToPending ? '' : p.motivoRechazo || '',
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
      });
      catalogApi.saveProductsLocal(next);
      return next;
    });

    return { resetToPending };
  };

  const deleteProducto = (id) => {
    setAllProductos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      catalogApi.saveProductsLocal(next);
      return next;
    });
  };

  const deductProductStock = (purchasedItems = []) => {
    if (!purchasedItems.length) return;
    setAllProductos((prev) => {
      const next = prev.map((p) => {
        const boughtQty = purchasedItems
          .filter((it) => it.id === p.id && it.tipo !== 'Servicio')
          .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        if (boughtQty <= 0) return p;
        return {
          ...p,
          stock: Math.max(0, (Number(p.stock) || 0) - boughtQty),
        };
      });
      catalogApi.saveProductsLocal(next);
      return next;
    });
  };

  // ==================== CRUD SERVICIOS (CON PROPIEDAD Y MODERACIÓN ESTRICTA) ====================
  const addServicio = (serv) => {
    const isAdmin = hasRole(currentUser, ROLES.ADMIN);
    const ownerId = serv.ownerId || currentUser?.id || 3;
    const precioNum = Number(serv.precio) || 0;
    const img = serv.image || createDefaultServiceImage(serv.nombre);
    const estadoInicial = isAdmin
      ? MODERATION_STATUS.APROBADO
      : MODERATION_STATUS.PENDIENTE;

    const newServ = {
      ...serv,
      id: Date.now(),
      tipo: 'Servicio',
      ownerId,
      proveedorId: ownerId,
      estadoModeracion: estadoInicial,
      aprobadoPorAdmin: isAdmin,
      motivoRechazo: '',
      verificado: Boolean(currentUser?.verificado || isAdmin),
      nombre: serv.nombre,
      title: serv.nombre,
      marca: serv.marca || currentUser?.nombreTienda || currentUser?.nombre || 'Profesional Vento',
      brand: serv.marca || currentUser?.nombreTienda || currentUser?.nombre || 'Profesional Vento',
      vendedorTipo: serv.vendedorTipo || 'Emprendedor',
      vendedorNombre:
        serv.vendedorNombre ||
        currentUser?.nombreTienda ||
        currentUser?.nombre ||
        'Profesional Vento',
      categoria: serv.categoria || 'Servicios musicales',
      modalidad: serv.modalidad || 'Presencial',
      tiempoEstimado: serv.tiempoEstimado || 'A convenir',
      cobertura: serv.cobertura || 'A convenir con el cliente',
      garantia: serv.garantia || 'Garantía de satisfacción Vento',
      permiteCotizacion: serv.permiteCotizacion || 'no',
      restriccionEdad: serv.restriccionEdad || 'no',
      precio: precioNum,
      price: precioNum,
      descripcion: serv.descripcion || 'Servicio profesional en Vento.',
      description: serv.descripcion || 'Servicio profesional en Vento.',
      incluye: serv.incluye?.length
        ? serv.incluye
        : ['Atención personalizada', 'Garantía de satisfacción Vento'],
      image: img,
      mainImage: img,
      thumbnails: [],
      rating: 5.0,
      reviews: [],
    };

    setAllServicios((prev) => {
      const next = [newServ, ...prev];
      catalogApi.saveServicesLocal(next);
      return next;
    });
    return newServ;
  };

  const updateServicio = (updatedServ) => {
    const isAdmin = hasRole(currentUser, ROLES.ADMIN);
    const precioNum = Number(updatedServ.precio ?? updatedServ.price) || 0;
    let resetToPending = false;

    setAllServicios((prev) => {
      const next = prev.map((s) => {
        if (s.id !== updatedServ.id) return s;

        const commercialChanged = didCommercialContentChange(s, updatedServ);
        let nextModeration =
          updatedServ.estadoModeracion || s.estadoModeracion || MODERATION_STATUS.APROBADO;
        if (!isAdmin && commercialChanged) {
          nextModeration = MODERATION_STATUS.PENDIENTE;
          resetToPending = true;
        }

        const img = updatedServ.image || s.image;
        return {
          ...s,
          ...updatedServ,
          tipo: 'Servicio',
          estadoModeracion: nextModeration,
          motivoRechazo: resetToPending ? '' : s.motivoRechazo || '',
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
      });
      catalogApi.saveServicesLocal(next);
      return next;
    });

    return { resetToPending };
  };

  const deleteServicio = (id) => {
    setAllServicios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      catalogApi.saveServicesLocal(next);
      return next;
    });
  };

  // Regla A2: Pausar o reactivar un ítem ya aprobado por Admin sin requerir re-aprobación
  const togglePauseItem = (id, tipo = 'Producto') => {
    const toggleFn = (list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        if (item.estadoModeracion === MODERATION_STATUS.APROBADO) {
          return { ...item, estadoModeracion: MODERATION_STATUS.PAUSADO };
        }
        if (item.estadoModeracion === MODERATION_STATUS.PAUSADO && item.aprobadoPorAdmin) {
          return { ...item, estadoModeracion: MODERATION_STATUS.APROBADO };
        }
        return item;
      });

    if (tipo === 'Servicio') {
      setAllServicios((prev) => {
        const next = toggleFn(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setAllProductos((prev) => {
        const next = toggleFn(prev);
        catalogApi.saveProductsLocal(next);
        return next;
      });
    }
  };

  // Moderación exclusiva del Administrador (Aprobar / Rechazar con motivo / Destacar)
  const moderateCatalogItem = (id, tipo, decision, motivoRechazo = '') => {
    const moderateFn = (list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          estadoModeracion: decision,
          aprobadoPorAdmin:
            decision === MODERATION_STATUS.APROBADO ? true : item.aprobadoPorAdmin,
          motivoRechazo: decision === MODERATION_STATUS.RECHAZADO ? motivoRechazo : '',
        };
      });

    if (tipo === 'Servicio') {
      setAllServicios((prev) => {
        const next = moderateFn(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setAllProductos((prev) => {
        const next = moderateFn(prev);
        catalogApi.saveProductsLocal(next);
        return next;
      });
    }
  };

  const toggleFeaturedItem = (id, tipo = 'Producto') => {
    const flip = (list) =>
      list.map((item) =>
        item.id === id ? { ...item, destacado: !item.destacado } : item
      );

    if (tipo === 'Servicio') {
      setAllServicios((prev) => {
        const next = flip(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setAllProductos((prev) => {
        const next = flip(prev);
        catalogApi.saveProductsLocal(next);
        return next;
      });
    }
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
      setAllServicios((prev) => {
        const next = updater(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setAllProductos((prev) => {
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
      autorId: currentUser?.id || null,
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
      setAllServicios((prev) => {
        const next = appendReview(prev);
        catalogApi.saveServicesLocal(next);
        return next;
      });
    } else {
      setAllProductos((prev) => {
        const next = appendReview(prev);
        catalogApi.saveProductsLocal(next);
        return next;
      });
    }
  };

  // ==================== LISTA DE DESEOS AISLADA POR USUARIO ====================
  const toggleWishlist = (id) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      storageApi.saveWishlist(next, userKey);
      showToast(
        exists ? 'Eliminado de tu lista de deseos' : 'Guardado en tu lista de deseos',
        'info'
      );
      return next;
    });
  };

  const isInWishlist = (id) => wishlistIds.includes(id);

  // ==================== COTIZACIONES AISLADAS POR COMPRADOR Y PROVEEDOR ====================
  const submitServiceQuote = async (quoteData) => {
    const response = await storageApi.createQuote({
      ...quoteData,
      compradorId: currentUser?.id || null,
    });
    if (response.success) {
      setQuotes((prev) => [response.data, ...prev]);
      showToast(response.message, 'success');
    }
    return response;
  };

  const updateQuoteStatus = (quoteId, changes) => {
    setQuotes((prev) => {
      const next = prev.map((q) => (q.id === quoteId ? { ...q, ...changes } : q));
      storageApi.saveQuotes(next);
      return next;
    });
  };

  const myQuotes = useMemo(() => {
    if (!currentUser) return [];
    return quotes.filter((q) => String(q.compradorId) === String(currentUser.id));
  }, [quotes, currentUser]);

  const receivedQuotes = useMemo(() => {
    if (!currentUser) return [];
    if (hasRole(currentUser, ROLES.ADMIN)) return quotes;
    return quotes.filter((q) => String(q.proveedorId) === String(currentUser.id));
  }, [quotes, currentUser]);

  // Búsqueda por ID: visitantes/compradores solo ven Aprobados; Admin y dueño pueden previsualizar
  const findItemById = (id) => {
    const numericId = Number(id);
    const found =
      allProductos.find((p) => p.id === numericId) ||
      allServicios.find((s) => s.id === numericId) ||
      null;

    if (!found) return null;
    const status = found.estadoModeracion || MODERATION_STATUS.APROBADO;
    if (status === MODERATION_STATUS.APROBADO) return found;

    const isAdmin = hasRole(currentUser, ROLES.ADMIN);
    const isOwner =
      currentUser && String(found.ownerId) === String(currentUser.id);

    return isAdmin || isOwner ? found : null;
  };

  return (
    <ProductContext.Provider
      value={{
        productos,
        servicios,
        allProductos,
        allServicios,
        isLoadingCatalog,
        catalogError,
        reloadCatalog: loadCatalog,
        addProducto,
        updateProducto,
        deleteProducto,
        deductProductStock,
        addServicio,
        updateServicio,
        deleteServicio,
        togglePauseItem,
        moderateCatalogItem,
        toggleFeaturedItem,
        applyOfferToItem,
        addReview,
        findItemById,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        quotes,
        myQuotes,
        receivedQuotes,
        submitServiceQuote,
        updateQuoteStatus,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
