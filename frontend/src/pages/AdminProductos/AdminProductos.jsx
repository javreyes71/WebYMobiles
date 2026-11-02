import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  Delete,
  CloudUpload,
  LocalOffer,
  Add,
  Pause,
  PlayArrow,
  LocalShipping,
  Inventory2,
  OpenInNew,
} from '@mui/icons-material';
import {
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useToast } from '@/context/ToastContext';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/validators';
import {
  ROLES,
  MODERATION_STATUS,
  MODERATION_BADGE_STYLES,
  APPROVAL_STATUS,
  hasRole,
  canAccessProductPanel,
  canAccessServicePanel,
  getCommercialApprovalStatus,
  isApprovedForCommercialRole,
} from '@/utils/roles';

const PRODUCT_CATEGORIES = ['Zapatos', 'Ropa', 'Accesorios', 'Instrumentos musicales'];
const SERVICE_CATEGORIES = [
  'Mantención y Limpieza',
  'Personalización y Diseño',
  'Servicios musicales',
  'Eventos y Sonido',
  'Asesoría de Imagen',
];
const COURIERS_CHILE = ['Starken', 'Chilexpress', 'Bluexpress', 'Correos de Chile', 'Despacho Propio'];

const AdminProductos = ({ mode = 'productos' }) => {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { sellerOrders, updateOrderStatus } = useCart();
  const {
    allProductos,
    allServicios,
    receivedQuotes,
    updateQuoteStatus,
    addProducto,
    updateProducto,
    deleteProducto,
    addServicio,
    updateServicio,
    deleteServicio,
    togglePauseItem,
    applyOfferToItem,
  } = useProducts();

  const isServiceMode = mode === 'servicios';
  const isAdmin = hasRole(currentUser, ROLES.ADMIN);
  const targetRole = isServiceMode ? ROLES.PROVEEDOR_SERVICIO : ROLES.VENDEDOR_PRODUCTO;
  const roleApprovalStatus = getCommercialApprovalStatus(currentUser, targetRole);
  const isRoleApproved = isApprovedForCommercialRole(currentUser, targetRole);
  const canSwitchBothPortals =
    canAccessProductPanel(currentUser) && canAccessServicePanel(currentUser);

  const sourceList = isServiceMode ? allServicios : allProductos;
  const activeItems = isAdmin
    ? sourceList
    : sourceList.filter((item) => String(item.ownerId) === String(currentUser?.id));

  // 'list' | 'form-item' | 'form-oferta'
  const [view, setView] = useState('list');
  // Sub-pestaña en modo productos: 'inventario' | 'despachos'
  const [productSection, setProductSection] = useState('inventario');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  const [offerForm, setOfferForm] = useState({
    tipoOferta: 'porcentual',
    porcentaje: '15',
    precioFijo: '',
    inicio: '',
    fin: '',
    productoAsociado: '',
  });
  const [deleteId, setDeleteId] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de despacho con Courier + Código de Seguimiento
  const [shippingModal, setShippingModal] = useState({
    open: false,
    order: null,
    courier: 'Starken',
    trackingCodigo: '',
  });

  // Filtro y Modal de Propuesta Formal para el CRM de Cotizaciones (ProveedorServicio)
  const [quoteFilter, setQuoteFilter] = useState('Todas');
  const [proposalModal, setProposalModal] = useState({
    open: false,
    quote: null,
    monto: '',
    plazo: '48 horas hábiles',
    validez: '7 días corridos',
    detalle: '',
  });

  const serviceKpis = useMemo(() => {
    const pendientes = receivedQuotes.filter((q) => q.estado === 'Pendiente').length;
    const enCurso = receivedQuotes.filter(
      (q) => q.estado === 'Aceptada' || q.estado === 'En Ejecución'
    ).length;
    const ingresosCotizados = receivedQuotes
      .filter((q) => q.estado === 'En Ejecución' || q.estado === 'Completado')
      .reduce((acc, q) => acc + Number(q.propuestaProveedor?.monto || q.precioReferencial || 0), 0);
    const activos = activeItems.filter(
      (s) => (s.estadoModeracion || MODERATION_STATUS.APROBADO) === MODERATION_STATUS.APROBADO
    ).length;
    return { pendientes, enCurso, ingresosCotizados, activos };
  }, [receivedQuotes, activeItems]);

  const filteredQuotes = useMemo(() => {
    if (quoteFilter === 'Todas') return receivedQuotes;
    return receivedQuotes.filter((q) => q.estado === quoteFilter);
  }, [receivedQuotes, quoteFilter]);

  const handleOpenProposalModal = (quote) => {
    setProposalModal({
      open: true,
      quote,
      monto: String(quote.propuestaProveedor?.monto || quote.precioReferencial || ''),
      plazo: quote.propuestaProveedor?.plazo || '48 horas hábiles',
      validez: quote.propuestaProveedor?.validez || '7 días corridos',
      detalle:
        quote.propuestaProveedor?.detalle ||
        `Propuesta personalizada para ${quote.servicioNombre} según requerimientos del cliente.`,
    });
  };

  const handleSendFormalProposal = (e) => {
    e.preventDefault();
    const montoNum = Number(proposalModal.monto);
    if (!proposalModal.quote || montoNum <= 0) {
      showToast('Ingresa un presupuesto válido mayor a $0 CLP.', 'warning');
      return;
    }
    updateQuoteStatus(proposalModal.quote.id, {
      estado: 'Cotizado',
      propuestaProveedor: {
        monto: montoNum,
        plazo: proposalModal.plazo.trim() || 'A convenir',
        validez: proposalModal.validez.trim() || '7 días corridos',
        detalle: proposalModal.detalle.trim(),
      },
    });
    showToast(
      `Propuesta formal enviada al cliente (${formatCurrency(montoNum)}).`,
      'success'
    );
    setProposalModal({
      open: false,
      quote: null,
      monto: '',
      plazo: '48 horas hábiles',
      validez: '7 días corridos',
      detalle: '',
    });
  };

  // Pedidos que contienen productos físicos de este vendedor (o todos si es Admin)
  const productSellerOrders = useMemo(() => {
    return (sellerOrders || []).filter((ord) =>
      ord.items?.some(
        (it) =>
          it.tipo !== 'Servicio' &&
          (isAdmin || String(it.ownerId) === String(currentUser?.id))
      )
    );
  }, [sellerOrders, isAdmin, currentUser]);

  // KPIs del Dashboard Vendedor de Productos
  const sellerKpis = useMemo(() => {
    let totalVentas = 0;
    let pendientesEnvio = 0;

    productSellerOrders.forEach((ord) => {
      if (ord.estado !== 'Entregado') pendientesEnvio += 1;
      ord.items?.forEach((it) => {
        if (
          it.tipo !== 'Servicio' &&
          (isAdmin || String(it.ownerId) === String(currentUser?.id))
        ) {
          totalVentas += Number(it.price || 0) * Number(it.quantity || 1);
        }
      });
    });

    const publicados = activeItems.filter(
      (i) => (i.estadoModeracion || MODERATION_STATUS.APROBADO) === MODERATION_STATUS.APROBADO
    ).length;

    const stockCritico = activeItems.filter((i) => Number(i.stock ?? 10) <= 3).length;

    return { totalVentas, pendientesEnvio, publicados, stockCritico };
  }, [productSellerOrders, activeItems, isAdmin, currentUser]);

  const buildEmptyProduct = () => ({
    tipo: 'Producto',
    nombre: '',
    sku: '',
    marca: '',
    categoria: 'Zapatos',
    genero: 'Unisex',
    stock: 10,
    descripcion: '',
    restriccionEdad: 'no',
    precio: '',
    image: '',
    vendedorNombre: currentUser?.nombreTienda || currentUser?.nombre || 'Tienda Vento',
    vendedorTipo: currentUser?.tipoCuenta === 'Empresa' ? 'Empresa' : 'Emprendedor',
  });

  const buildEmptyService = () => ({
    tipo: 'Servicio',
    nombre: '',
    sku: '',
    marca: currentUser?.nombreTienda || currentUser?.nombre || 'Profesional Vento',
    categoria: 'Mantención y Limpieza',
    modalidad: 'Presencial',
    tiempoEstimado: '',
    descripcion: '',
    restriccionEdad: 'no',
    permiteCotizacion: 'no',
    precio: '',
    image: '',
    vendedorNombre: currentUser?.nombreTienda || currentUser?.nombre || 'Profesional Vento',
    vendedorTipo: currentUser?.tipoCuenta === 'Empresa' ? 'Empresa' : 'Emprendedor',
  });

  useEffect(() => {
    setView('list');
    setProductSection('inventario');
    if (location.state?.initialView === 'form-servicio' && isServiceMode) {
      setIsEditing(false);
      setCurrentItem(buildEmptyService());
      setView('form-item');
    } else if (location.state?.initialView === 'form-producto' && !isServiceMode) {
      setIsEditing(false);
      setCurrentItem(buildEmptyProduct());
      setView('form-item');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, location.state]);

  const handleOpenCreate = () => {
    if (!isRoleApproved) {
      showToast(
        'Tu cuenta comercial aún está pendiente de aprobación por un Administrador.',
        'warning'
      );
      return;
    }
    setIsEditing(false);
    setCurrentItem(isServiceMode ? buildEmptyService() : buildEmptyProduct());
    setView('form-item');
  };

  const handleOpenOffer = () => {
    if (!isRoleApproved) {
      showToast(
        'Debes contar con aprobación del Administrador para crear ofertas.',
        'warning'
      );
      return;
    }
    setOfferForm({
      tipoOferta: 'porcentual',
      porcentaje: '15',
      precioFijo: '',
      inicio: '',
      fin: '',
      productoAsociado: activeItems[0]?.id || '',
    });
    setView('form-oferta');
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem({
      ...item,
      nombre: item.nombre || item.title,
      marca: item.marca || item.brand,
      precio: item.precio ?? item.price,
      descripcion: item.descripcion || item.description,
    });
    setView('form-item');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Selecciona un archivo de imagen válido (PNG, JPG, WEBP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentItem((prev) => ({ ...prev, image: String(reader.result) }));
      showToast('Imagen cargada en vista previa.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!currentItem.nombre?.trim() || Number(currentItem.precio) <= 0) {
      showToast('Ingresa un nombre y un precio mayor a $0.', 'warning');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (isServiceMode) {
      if (isEditing) {
        const res = updateServicio(currentItem);
        showToast(
          res?.resetToPending
            ? 'Servicio actualizado y enviado a moderación del Administrador.'
            : 'Servicio actualizado correctamente.',
          res?.resetToPending ? 'info' : 'success'
        );
      } else {
        const created = addServicio(currentItem);
        showToast(
          created.estadoModeracion === MODERATION_STATUS.APROBADO
            ? 'Servicio publicado en la sección Servicios.'
            : 'Servicio creado y enviado a revisión del Administrador (Pendiente).',
          created.estadoModeracion === MODERATION_STATUS.APROBADO ? 'success' : 'info'
        );
      }
    } else {
      if (isEditing) {
        const res = updateProducto(currentItem);
        showToast(
          res?.resetToPending
            ? 'Producto actualizado y enviado a moderación del Administrador.'
            : 'Stock o estado del producto actualizado de inmediato.',
          res?.resetToPending ? 'info' : 'success'
        );
      } else {
        const created = addProducto(currentItem);
        showToast(
          created.estadoModeracion === MODERATION_STATUS.APROBADO
            ? 'Producto publicado en la Tienda.'
            : 'Producto creado y enviado a revisión del Administrador (Pendiente).',
          created.estadoModeracion === MODERATION_STATUS.APROBADO ? 'success' : 'info'
        );
      }
    }

    setIsLoading(false);
    setView('list');
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.productoAsociado) {
      showToast('Selecciona el ítem al que deseas aplicar la oferta.', 'warning');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    applyOfferToItem({
      ...offerForm,
      targetTipo: isServiceMode ? 'Servicio' : 'Producto',
    });

    showToast('¡Oferta aplicada exitosamente sobre el ítem seleccionado!', 'success');
    setIsLoading(false);
    setView('list');
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    if (isServiceMode) {
      deleteServicio(deleteId);
      showToast('Servicio eliminado.', 'info');
    } else {
      deleteProducto(deleteId);
      showToast('Producto eliminado.', 'info');
    }
    setIsLoading(false);
    setOpenDelete(false);
  };

  /* ── Flujo Logístico de Despachos (VendedorProducto - Alineado con BD2) ── */
  const handleAdvanceOrderState = (order, nextState) => {
    if (nextState === 'Despachado' || nextState === 'Enviado') {
      setShippingModal({
        open: true,
        order,
        courier: order.courier || 'Starken',
        trackingCodigo:
          order.trackingCodigo ||
          `STARKEN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      });
      return;
    }

    const updatedItems = (order.items || []).map((it) =>
      isAdmin || String(it.ownerId) === String(currentUser?.id)
        ? { ...it, estadoDespachoItem: nextState }
        : it
    );
    updateOrderStatus(order.id, { estado: nextState, items: updatedItems });
    showToast(`Pedido #${order.id} actualizado a "${nextState}".`, 'success');
  };

  const handleConfirmShipping = (e) => {
    e.preventDefault();
    const { order, courier, trackingCodigo } = shippingModal;
    if (!order || !trackingCodigo.trim()) {
      showToast('Ingresa el código de seguimiento del envío.', 'warning');
      return;
    }
    const updatedItems = (order.items || []).map((it) =>
      isAdmin || String(it.ownerId) === String(currentUser?.id)
        ? { ...it, estadoDespachoItem: 'Despachado' }
        : it
    );
    updateOrderStatus(order.id, {
      estado: 'Despachado',
      courier,
      trackingCodigo: trackingCodigo.trim().toUpperCase(),
      items: updatedItems,
    });
    showToast(
      `Despacho registrado (${courier} · ${trackingCodigo.trim().toUpperCase()}).`,
      'success'
    );
    setShippingModal({ open: false, order: null, courier: 'Starken', trackingCodigo: '' });
  };

  // ==================== VISTA CREAR OFERTA REAL ====================
  if (view === 'form-oferta') {
    return (
      <div className="max-w-4xl mx-auto p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Aplicar Oferta a {isServiceMode ? 'Servicio' : 'Producto'}
            </h1>
            <p className="text-xs text-gray-500">
              El descuento actualizará el precio visible y mostrará la etiqueta de % OFF
            </p>
          </div>
          <CustomButton variant="outline" size="sm" onClick={() => setView('list')}>
            Volver al listado
          </CustomButton>
        </div>

        <form
          onSubmit={handleSubmitOffer}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 space-y-6">
            <CustomTextField
              select
              name="productoAsociado"
              label={`Selecciona ${isServiceMode ? 'el servicio' : 'el producto'} a ofertar`}
              value={offerForm.productoAsociado}
              onChange={(e) =>
                setOfferForm({ ...offerForm, productoAsociado: e.target.value })
              }
              required
            >
              {activeItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nombre || item.title} — Precio actual: {formatCurrency(item.price)}
                </MenuItem>
              ))}
            </CustomTextField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-xs font-bold uppercase text-gray-600 block mb-2">
                  Modalidad de Descuento
                </span>
                <RadioGroup
                  name="tipoOferta"
                  value={offerForm.tipoOferta}
                  onChange={(e) => setOfferForm({ ...offerForm, tipoOferta: e.target.value })}
                >
                  <FormControlLabel
                    value="porcentual"
                    control={<Radio size="small" />}
                    label={<span className="text-sm">Descuento porcentual (%)</span>}
                  />
                  <FormControlLabel
                    value="fijo"
                    control={<Radio size="small" />}
                    label={<span className="text-sm">Nuevo precio fijo ($)</span>}
                  />
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <CustomTextField
                  name="porcentaje"
                  label="Porcentaje de descuento (%)"
                  type="number"
                  value={offerForm.porcentaje}
                  onChange={(e) => setOfferForm({ ...offerForm, porcentaje: e.target.value })}
                  disabled={offerForm.tipoOferta !== 'porcentual'}
                />
                <CustomTextField
                  name="precioFijo"
                  label="Nuevo precio fijo ($ CLP)"
                  type="number"
                  value={offerForm.precioFijo}
                  onChange={(e) => setOfferForm({ ...offerForm, precioFijo: e.target.value })}
                  disabled={offerForm.tipoOferta !== 'fijo'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomTextField
                name="inicio"
                label="Fecha de inicio"
                type="date"
                value={offerForm.inicio}
                onChange={(e) => setOfferForm({ ...offerForm, inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <CustomTextField
                name="fin"
                label="Fecha de término"
                type="date"
                value={offerForm.fin}
                onChange={(e) => setOfferForm({ ...offerForm, fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </div>

            <div className="flex justify-end pt-2">
              <CustomButton
                type="submit"
                variant="success"
                size="lg"
                isLoading={isLoading}
              >
                Aplicar y Publicar Oferta
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==================== VISTA FORMULARIO CREAR / EDITAR ====================
  if (view === 'form-item') {
    return (
      <div className="max-w-4xl mx-auto p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            {isEditing
              ? `Editar ${isServiceMode ? 'Servicio Profesional' : 'Producto en Venta'}`
              : `Publicar Nuevo ${isServiceMode ? 'Servicio Profesional' : 'Producto en Venta'}`}
          </h1>
          <CustomButton variant="outline" size="sm" onClick={() => setView('list')}>
            Volver
          </CustomButton>
        </div>

        <form
          onSubmit={handleSubmitItem}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-200">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
              Información de {isServiceMode ? 'la Oferta de Servicio' : 'la Publicación de Venta'}
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomTextField
                  label={`Título del ${isServiceMode ? 'Servicio' : 'Producto'}`}
                  name="nombre"
                  value={currentItem.nombre || ''}
                  onChange={handleChange}
                  required
                />
                <CustomTextField
                  label="Código SKU"
                  name="sku"
                  placeholder={isServiceMode ? 'SRV-001' : 'PRD-001'}
                  value={currentItem.sku || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isServiceMode ? (
                  <CustomTextField
                    label="Tiempo estimado / Duración"
                    name="tiempoEstimado"
                    placeholder="Ej: 48 horas o 90 minutos"
                    value={currentItem.tiempoEstimado || ''}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomTextField
                    label="Marca"
                    name="marca"
                    placeholder="Ej: Nike, Jordan, Vento"
                    value={currentItem.marca || ''}
                    onChange={handleChange}
                  />
                )}

                <CustomTextField
                  select
                  label="Categoría"
                  name="categoria"
                  value={
                    currentItem.categoria ||
                    (isServiceMode ? SERVICE_CATEGORIES[0] : PRODUCT_CATEGORIES[0])
                  }
                  onChange={handleChange}
                >
                  {(isServiceMode ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </div>

              {isServiceMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomTextField
                    select
                    label="Modalidad de Atención"
                    name="modalidad"
                    value={currentItem.modalidad || 'Presencial'}
                    onChange={handleChange}
                  >
                    <MenuItem value="Presencial">Presencial</MenuItem>
                    <MenuItem value="Online">Online / Remoto</MenuItem>
                    <MenuItem value="A domicilio">A domicilio</MenuItem>
                  </CustomTextField>

                  <CustomTextField
                    label="Nombre Proveedor / Estudio"
                    name="vendedorNombre"
                    value={currentItem.vendedorNombre || ''}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomTextField
                    select
                    label="Género"
                    name="genero"
                    value={currentItem.genero || 'Unisex'}
                    onChange={handleChange}
                  >
                    <MenuItem value="Unisex">Unisex</MenuItem>
                    <MenuItem value="Hombre">Hombre</MenuItem>
                    <MenuItem value="Mujer">Mujer</MenuItem>
                  </CustomTextField>

                  <CustomTextField
                    label="Stock disponible"
                    name="stock"
                    type="number"
                    value={currentItem.stock ?? 10}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <CustomTextField
                label="Descripción detallada"
                name="descripcion"
                value={currentItem.descripcion || ''}
                onChange={handleChange}
                multiline
                rows={3}
                required
              />

              <div className="flex flex-wrap gap-6 items-center pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Restricción +18:</span>
                  <RadioGroup
                    row
                    name="restriccionEdad"
                    value={currentItem.restriccionEdad || 'no'}
                    onChange={handleChange}
                  >
                    <FormControlLabel
                      value="sí"
                      control={<Radio size="small" />}
                      label={<span className="text-xs">Sí</span>}
                    />
                    <FormControlLabel
                      value="no"
                      control={<Radio size="small" />}
                      label={<span className="text-xs">No</span>}
                    />
                  </RadioGroup>
                </div>

                {isServiceMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">Permite cotización:</span>
                    <RadioGroup
                      row
                      name="permiteCotizacion"
                      value={currentItem.permiteCotizacion || 'no'}
                      onChange={handleChange}
                    >
                      <FormControlLabel
                        value="sí"
                        control={<Radio size="small" />}
                        label={<span className="text-xs">Sí (Cotizable)</span>}
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio size="small" />}
                        label={<span className="text-xs">No (Tarifa fija)</span>}
                      />
                    </RadioGroup>
                  </div>
                )}

                <div className="w-44">
                  <CustomTextField
                    label={isServiceMode ? 'Tarifa base ($)' : 'Precio ($)'}
                    name="precio"
                    type="number"
                    value={currentItem.precio || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Subida real de imagen con previsualización */}
            <div className="flex flex-col justify-between md:border-l border-gray-100 md:pl-8">
              <div>
                <span className="text-xs font-bold uppercase text-gray-600 mb-2 block">
                  Fotografía / Portada
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden p-2"
                >
                  {currentItem.image ? (
                    <img
                      src={currentItem.image}
                      alt="Vista previa"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <CloudUpload className="text-gray-400 mb-2" fontSize="large" />
                      <span className="text-xs font-semibold text-gray-600">
                        Haz clic para subir imagen
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1">PNG, JPG o WEBP</span>
                    </>
                  )}
                </button>

                {currentItem.image && (
                  <button
                    type="button"
                    onClick={() => setCurrentItem((prev) => ({ ...prev, image: '' }))}
                    className="mt-2 text-xs text-red-600 font-semibold hover:underline"
                  >
                    Quitar imagen seleccionada
                  </button>
                )}
              </div>

              <CustomButton
                type="submit"
                variant={isServiceMode ? 'secondary' : 'success'}
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-6"
              >
                {isEditing ? 'Guardar cambios' : 'Guardar y Publicar'}
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==================== VISTA PRINCIPAL (SEPARADA PRODUCTOS VS SERVICIOS) ====================
  return (
    <div className="max-w-6xl mx-auto p-6 my-8 space-y-8">
      {/* Cabecera y botones de acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          {canSwitchBothPortals && (
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/admin/productos"
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors ${
                  !isServiceMode
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Portal Ventas (Productos)
              </Link>
              <Link
                to="/admin/servicios"
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors ${
                  isServiceMode
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                Portal Oferta de Servicios
              </Link>
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-gray-900">
            {isServiceMode
              ? isAdmin
                ? 'Catálogo Global de Servicios Profesionales'
                : 'Mi Portafolio de Servicios Profesionales'
              : isAdmin
                ? 'Catálogo Global de Productos en Venta'
                : 'Portal Vendedor de Productos'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAdmin
              ? 'Vista con privilegios de Administrador sobre todas las publicaciones'
              : `Tienda activa: ${currentUser?.nombreTienda || currentUser?.nombre}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {currentUser && (
            <Link
              to={
                isServiceMode
                  ? `/servicios/proveedor/${currentUser.id}`
                  : `/tienda/vendedor/${currentUser.id}`
              }
            >
              <CustomButton
                variant="outline"
                size="sm"
                startIcon={<OpenInNew fontSize="small" />}
              >
                {isServiceMode ? 'Ver Mi Perfil Profesional' : 'Ver Mi Tienda Pública'}
              </CustomButton>
            </Link>
          )}
          <CustomButton
            variant="outline"
            size="sm"
            disabled={!isRoleApproved || activeItems.length === 0}
            startIcon={<LocalOffer fontSize="small" />}
            onClick={handleOpenOffer}
          >
            Crear Oferta
          </CustomButton>
          <CustomButton
            variant={isServiceMode ? 'secondary' : 'primary'}
            size="sm"
            disabled={!isRoleApproved}
            startIcon={<Add fontSize="small" />}
            onClick={handleOpenCreate}
          >
            {isServiceMode ? 'Publicar Servicio' : 'Agregar Producto'}
          </CustomButton>
        </div>
      </div>

      {!isRoleApproved && (
        <Alert
          severity={roleApprovalStatus === APPROVAL_STATUS.RECHAZADO ? 'error' : 'warning'}
          sx={{ borderRadius: 2 }}
        >
          {roleApprovalStatus === APPROVAL_STATUS.RECHAZADO ? (
            <span>
              <strong>Solicitud comercial rechazada:</strong>{' '}
              {currentUser?.motivoRechazoRol ||
                'Revisa tus antecedentes comerciales o contacta a Administración.'}
            </span>
          ) : (
            <span>
              <strong>Cuenta pendiente de aprobación previa:</strong> Tu perfil comercial está en
              cola de validación del Administrador. Podrás crear publicaciones en cuanto sea
              aprobado. Mientras tanto, puedes seguir comprando normalmente en el Marketplace.
            </span>
          )}
        </Alert>
      )}

      {/* ==================== DASHBOARD KPI DEL PROVEEDOR DE SERVICIOS ==================== */}
      {isServiceMode && (
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          aria-label="Indicadores profesionales de servicios"
        >
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm">
            <span className="text-xs font-bold uppercase text-sky-700 block mb-1">
              Por Cotizar
            </span>
            <p className="text-2xl font-extrabold text-gray-900">{serviceKpis.pendientes}</p>
            <span className="text-[11px] text-gray-500">Solicitudes esperando propuesta</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm">
            <span className="text-xs font-bold uppercase text-sky-700 block mb-1">
              En Ejecución
            </span>
            <p className="text-2xl font-extrabold text-gray-900">{serviceKpis.enCurso}</p>
            <span className="text-[11px] text-gray-500">Servicios aceptados o en marcha</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm">
            <span className="text-xs font-bold uppercase text-sky-700 block mb-1">
              Facturación Cotizada
            </span>
            <p className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(serviceKpis.ingresosCotizados)}
            </p>
            <span className="text-[11px] text-gray-500">En proyectos confirmados</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm">
            <span className="text-xs font-bold uppercase text-sky-700 block mb-1">
              Portafolio Activo
            </span>
            <p className="text-2xl font-extrabold text-gray-900">
              {serviceKpis.activos}{' '}
              <span className="text-xs font-normal text-gray-400">
                / {activeItems.length} total
              </span>
            </p>
            <span className="text-[11px] text-gray-500">Servicios visibles en Directorio</span>
          </div>
        </section>
      )}

      {/* ==================== DASHBOARD KPI + PESTAÑAS DEL VENDEDOR DE PRODUCTOS ==================== */}
      {!isServiceMode && (
        <>
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            aria-label="Indicadores de desempeño de ventas"
          >
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-gray-500">
                  Ingresos Acumulados
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">
                {formatCurrency(sellerKpis.totalVentas)}
              </p>
              <span className="text-[11px] text-gray-500">
                En {productSellerOrders.length} pedidos recibidos
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-gray-500">
                  Despachos Activos
                </span>
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">
                {sellerKpis.pendientesEnvio}
              </p>
              <span className="text-[11px] text-gray-500">
                Pedidos por preparar o en tránsito
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-gray-500">
                  Productos Publicados
                </span>
                <PackageCheck className="w-4 h-4 text-gray-800" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">
                {sellerKpis.publicados}{' '}
                <span className="text-xs font-normal text-gray-400">
                  / {activeItems.length} total
                </span>
              </p>
              <span className="text-[11px] text-gray-500">
                Visibles en el catálogo público
              </span>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-sm ${
                sellerKpis.stockCritico > 0
                  ? 'bg-red-50/50 border-red-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-gray-500">
                  Stock Crítico (≤ 3 un.)
                </span>
                <AlertTriangle
                  className={`w-4 h-4 ${
                    sellerKpis.stockCritico > 0 ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">
                {sellerKpis.stockCritico}
              </p>
              <span className="text-[11px] text-gray-500">
                {sellerKpis.stockCritico > 0
                  ? 'Requieren reposición pronta'
                  : 'Inventario saludable'}
              </span>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProductSection('inventario')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                productSection === 'inventario'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Inventory2 fontSize="small" />
              Mi Inventario ({activeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setProductSection('despachos')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                productSection === 'despachos'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LocalShipping fontSize="small" />
              Bandeja de Pedidos y Despachos ({productSellerOrders.length})
            </button>
          </div>
        </>
      )}

      {/* ==================== BANDEJA DE DESPACHOS (SOLO MODO PRODUCTOS) ==================== */}
      {!isServiceMode && productSection === 'despachos' ? (
        <section
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4"
          aria-label="Gestión logística de pedidos recibidos"
        >
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Bandeja de Pedidos y Despachos ({productSellerOrders.length})
            </h2>
            <p className="text-xs text-gray-500">
              Actualiza el estado de preparación, asigna courier con código de seguimiento y
              confirma entregas
            </p>
          </div>

          {productSellerOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              Aún no registras pedidos sobre tus productos publicados.
            </p>
          ) : (
            <div className="space-y-4">
              {productSellerOrders.map((ord) => {
                const relevantItems = (ord.items || []).filter(
                  (it) =>
                    it.tipo !== 'Servicio' &&
                    (isAdmin || String(it.ownerId) === String(currentUser?.id))
                );
                return (
                  <div
                    key={ord.id}
                    className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-extrabold text-gray-900">
                          Pedido #{ord.id}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          · {ord.fecha} · Cliente: <strong>{ord.compradorNombre}</strong>
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-extrabold uppercase px-3 py-0.5 rounded-full ${
                          ord.estado === 'Entregado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.estado === 'Despachado' ||
                                ord.estado === 'Enviado' ||
                                ord.estado === 'En reparto'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.estado}
                      </span>
                    </div>

                    {ord.cliente?.direccion && (
                      <p className="text-xs text-gray-600">
                        <strong>Destino:</strong> {ord.cliente.direccion}
                        {ord.cliente.ciudad ? `, ${ord.cliente.ciudad}` : ''}
                      </p>
                    )}

                    {ord.trackingCodigo && (
                      <p className="text-xs text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg inline-block font-semibold">
                        Courier: {ord.courier || 'Starken'} · Tracking: {ord.trackingCodigo}
                      </p>
                    )}

                    <ul className="text-xs text-gray-700 space-y-1 bg-white p-3 rounded-lg border border-gray-100">
                      {relevantItems.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            {it.quantity} × {it.title}
                            {it.talla ? ` (${it.talla})` : ''}
                          </span>
                          <span className="font-bold">
                            {formatCurrency(it.price * it.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {ord.estado === 'Confirmado' && (
                        <CustomButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdvanceOrderState(ord, 'En Preparación')}
                        >
                          Pasar a En Preparación
                        </CustomButton>
                      )}
                      {(ord.estado === 'Confirmado' || ord.estado === 'En Preparación') && (
                        <CustomButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleAdvanceOrderState(ord, 'Despachado')}
                        >
                          Despachar y Asignar Tracking
                        </CustomButton>
                      )}
                      {(ord.estado === 'Despachado' || ord.estado === 'Enviado') && (
                        <CustomButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdvanceOrderState(ord, 'En reparto')}
                        >
                          Marcar En Reparto
                        </CustomButton>
                      )}
                      {(ord.estado === 'Despachado' ||
                        ord.estado === 'Enviado' ||
                        ord.estado === 'En reparto') && (
                        <CustomButton
                          variant="success"
                          size="sm"
                          onClick={() => handleAdvanceOrderState(ord, 'Entregado')}
                        >
                          Confirmar Entrega Final
                        </CustomButton>
                      )}
                      {ord.estado === 'Entregado' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Despacho completado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Tabla Desktop */}
          <div className="hidden md:block">
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead className="bg-gray-50">
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Ítem</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Categoría</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {isServiceMode ? 'Modalidad / Tipo' : 'Stock'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Moderación</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">
                      {isServiceMode ? 'Tarifa Base' : 'Precio'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#6b7280' }}>
                        Aún no tienes publicaciones registradas en este portal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeItems.map((item) => {
                      const status = item.estadoModeracion || MODERATION_STATUS.APROBADO;
                      const badgeClass =
                        MODERATION_BADGE_STYLES[status] || MODERATION_BADGE_STYLES.Aprobado;
                      const canTogglePause =
                        status === MODERATION_STATUS.APROBADO ||
                        (status === MODERATION_STATUS.PAUSADO && item.aprobadoPorAdmin);

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.nombre || item.title}
                                className="w-11 h-11 rounded-lg object-cover bg-gray-100 border border-gray-200"
                              />
                              <div>
                                <p className="font-bold text-gray-900 text-sm">
                                  {item.nombre || item.title}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {item.marca || item.brand} {item.sku ? `· ${item.sku}` : ''}
                                  {isAdmin && item.vendedorNombre ? ` · ${item.vendedorNombre}` : ''}
                                </span>
                                {status === MODERATION_STATUS.RECHAZADO && item.motivoRechazo && (
                                  <span className="block text-[11px] font-semibold text-red-600 mt-0.5">
                                    Motivo rechazo: {item.motivoRechazo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell>
                            {isServiceMode ? (
                              <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full">
                                {item.modalidad || 'Presencial'} ·{' '}
                                {item.permiteCotizacion === 'sí' ? 'Cotizable' : 'Fijo'}
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  (item.stock ?? 10) <= 3
                                    ? 'bg-red-100 text-red-800'
                                    : 'text-gray-700 bg-gray-100'
                                }`}
                              >
                                {item.stock ?? 10} un.
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                            >
                              {status}
                            </span>
                          </TableCell>
                          <TableCell align="right">
                            <span className="font-extrabold text-gray-900">
                              {formatCurrency(item.price ?? item.precio)}
                            </span>
                            {item.ofertaActiva && item.descuentoPorcentaje > 0 && (
                              <span className="block text-[10px] font-bold text-green-700">
                                Oferta -{item.descuentoPorcentaje}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {canTogglePause && (
                              <Tooltip
                                title={
                                  status === MODERATION_STATUS.PAUSADO
                                    ? 'Reactivar publicación'
                                    : 'Pausar publicación'
                                }
                              >
                                <IconButton
                                  color={status === MODERATION_STATUS.PAUSADO ? 'success' : 'default'}
                                  aria-label={`Pausar o reactivar ${item.nombre || item.title}`}
                                  onClick={() => {
                                    togglePauseItem(item.id, item.tipo);
                                    showToast(
                                      status === MODERATION_STATUS.PAUSADO
                                        ? 'Publicación reactivada en el catálogo.'
                                        : 'Publicación pausada temporalmente.',
                                      'info'
                                    );
                                  }}
                                >
                                  {status === MODERATION_STATUS.PAUSADO ? (
                                    <PlayArrow fontSize="small" />
                                  ) : (
                                    <Pause fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              color="primary"
                              aria-label={`Editar ${item.nombre || item.title}`}
                              onClick={() => handleEdit(item)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              aria-label={`Eliminar ${item.nombre || item.title}`}
                              onClick={() => {
                                setDeleteId(item.id);
                                setOpenDelete(true);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Tarjetas Móvil */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">{item.nombre || item.title}</h2>
                    <span className="text-xs text-gray-500">{item.categoria}</span>
                  </div>
                  <span className="font-extrabold text-gray-900">
                    {formatCurrency(item.price ?? item.precio)}
                  </span>
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-gray-100">
                  <IconButton
                    size="small"
                    aria-label={`Editar ${item.nombre || item.title}`}
                    onClick={() => handleEdit(item)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Eliminar ${item.nombre || item.title}`}
                    onClick={() => {
                      setDeleteId(item.id);
                      setOpenDelete(true);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CRM Interactivo de Cotizaciones (visible solo en el Portal de Servicios) */}
      {isServiceMode && (
        <section
          className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm space-y-4"
          aria-label="CRM de solicitudes de cotización recibidas"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                CRM de Cotizaciones y Proyectos ({receivedQuotes.length})
              </h2>
              <p className="text-xs text-gray-500">
                Envía propuestas formales en CLP; cuando el comprador acepte y pague podrás
                gestionar la ejecución hasta el cierre
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['Todas', 'Pendiente', 'Cotizado', 'En Ejecución', 'Completado'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setQuoteFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    quoteFilter === st
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredQuotes.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No hay cotizaciones registradas bajo el filtro seleccionado.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-sky-700">{q.id}</span>
                        <span className="text-xs text-gray-400">· {q.fechaCreacion}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mt-0.5">
                        {q.servicioNombre}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{q.detalles}</p>
                      <p className="text-xs text-gray-500 mt-1.5">
                        Cliente: <strong>{q.nombreContacto}</strong> ({q.correoContacto}
                        {q.telefonoContacto ? ` · ${q.telefonoContacto}` : ''}) · Modalidad:{' '}
                        <strong>{q.modalidadPreferida || 'A convenir'}</strong>
                        {q.fechaDeseada ? ` · Fecha deseada: ${q.fechaDeseada}` : ''}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span
                        className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          q.estado === 'Completado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.estado === 'En Ejecución'
                              ? 'bg-amber-100 text-amber-800'
                              : q.estado === 'Cotizado'
                                ? 'bg-indigo-100 text-indigo-800'
                                : q.estado === 'Rechazada'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {q.estado}
                      </span>
                    </div>
                  </div>

                  {q.propuestaProveedor && (
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 text-xs text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="font-bold text-gray-500 block">Presupuesto Enviado</span>
                        <span className="text-sm font-extrabold text-indigo-900">
                          {formatCurrency(q.propuestaProveedor.monto)}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block">Plazo Comprometido</span>
                        <span>{q.propuestaProveedor.plazo}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block">Vigencia</span>
                        <span>{q.propuestaProveedor.validez}</span>
                      </div>
                      {q.propuestaProveedor.detalle && (
                        <div className="sm:col-span-3 pt-1 border-t border-gray-100">
                          <span className="font-bold text-gray-500">Alcance: </span>
                          {q.propuestaProveedor.detalle}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    {(q.estado === 'Pendiente' || q.estado === 'Cotizado') && (
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        disabled={!isRoleApproved}
                        onClick={() => handleOpenProposalModal(q)}
                      >
                        {q.propuestaProveedor
                          ? 'Actualizar Propuesta Formal'
                          : 'Enviar Propuesta Formal'}
                      </CustomButton>
                    )}

                    {q.estado === 'Aceptada' && (
                      <CustomButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          updateQuoteStatus(q.id, { estado: 'En Ejecución' });
                          showToast(`Proyecto ${q.id} iniciado en ejecución.`, 'info');
                        }}
                      >
                        Iniciar Ejecución
                      </CustomButton>
                    )}

                    {q.estado === 'En Ejecución' && (
                      <CustomButton
                        variant="success"
                        size="sm"
                        onClick={() => {
                          updateQuoteStatus(q.id, { estado: 'Completado' });
                          showToast(
                            `¡Servicio ${q.id} marcado como Completado exitosamente!`,
                            'success'
                          );
                        }}
                      >
                        Marcar Servicio Completado
                      </CustomButton>
                    )}

                    {q.estado === 'Completado' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Trabajo entregado y cerrado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal Propuesta Formal de Servicio (CRM ProveedorServicio) */}
      <Dialog
        open={proposalModal.open}
        onClose={() =>
          setProposalModal({
            open: false,
            quote: null,
            monto: '',
            plazo: '48 horas hábiles',
            validez: '7 días corridos',
            detalle: '',
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Propuesta Formal · {proposalModal.quote?.id}
        </DialogTitle>
        <form onSubmit={handleSendFormalProposal}>
          <DialogContent dividers className="space-y-4">
            <p className="text-xs text-gray-600">
              Cliente: <strong>{proposalModal.quote?.nombreContacto}</strong> · Servicio:{' '}
              <strong>{proposalModal.quote?.servicioNombre}</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomTextField
                label="Presupuesto final ($ CLP)"
                name="monto"
                type="number"
                value={proposalModal.monto}
                onChange={(e) =>
                  setProposalModal({ ...proposalModal, monto: e.target.value })
                }
                required
              />
              <CustomTextField
                label="Plazo estimado de entrega"
                name="plazo"
                placeholder="Ej: 72 horas hábiles"
                value={proposalModal.plazo}
                onChange={(e) =>
                  setProposalModal({ ...proposalModal, plazo: e.target.value })
                }
                required
              />
            </div>

            <CustomTextField
              label="Vigencia de la cotización"
              name="validez"
              placeholder="Ej: 7 días corridos"
              value={proposalModal.validez}
              onChange={(e) =>
                setProposalModal({ ...proposalModal, validez: e.target.value })
              }
            />

            <CustomTextField
              label="Alcance técnico y condiciones del servicio"
              name="detalle"
              multiline
              rows={3}
              value={proposalModal.detalle}
              onChange={(e) =>
                setProposalModal({ ...proposalModal, detalle: e.target.value })
              }
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() =>
                setProposalModal({
                  open: false,
                  quote: null,
                  monto: '',
                  plazo: '48 horas hábiles',
                  validez: '7 días corridos',
                  detalle: '',
                })
              }
              color="inherit"
            >
              Cancelar
            </Button>
            <CustomButton type="submit" variant="secondary" size="sm">
              Enviar Propuesta al Cliente
            </CustomButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Asignación de Courier y Código de Seguimiento */}
      <Dialog
        open={shippingModal.open}
        onClose={() =>
          setShippingModal({ open: false, order: null, courier: 'Starken', trackingCodigo: '' })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Despachar Pedido #{shippingModal.order?.id}
        </DialogTitle>
        <form onSubmit={handleConfirmShipping}>
          <DialogContent dividers className="space-y-4">
            <CustomTextField
              select
              label="Empresa de Transporte / Courier"
              name="courier"
              value={shippingModal.courier}
              onChange={(e) =>
                setShippingModal({ ...shippingModal, courier: e.target.value })
              }
            >
              {COURIERS_CHILE.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </CustomTextField>

            <CustomTextField
              label="Código de Seguimiento (Tracking)"
              name="trackingCodigo"
              placeholder="Ej: STARKEN-8841209"
              value={shippingModal.trackingCodigo}
              onChange={(e) =>
                setShippingModal({ ...shippingModal, trackingCodigo: e.target.value })
              }
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() =>
                setShippingModal({
                  open: false,
                  order: null,
                  courier: 'Starken',
                  trackingCodigo: '',
                })
              }
              color="inherit"
            >
              Cancelar
            </Button>
            <CustomButton type="submit" variant="primary" size="sm">
              Confirmar Envío
            </CustomButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={openDelete} onClose={() => !isLoading && setOpenDelete(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de eliminar este {isServiceMode ? 'servicio' : 'producto'}? Esta acción no
            se puede deshacer.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDelete(false)} color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminProductos;
