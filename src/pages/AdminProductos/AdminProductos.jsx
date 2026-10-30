import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { Edit, Delete, CloudUpload, LocalOffer, Add } from '@mui/icons-material';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useToast } from '@/context/ToastContext';
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/validators';

const PRODUCT_CATEGORIES = ['Zapatos', 'Ropa', 'Accesorios', 'Instrumentos musicales'];
const SERVICE_CATEGORIES = [
  'Mantención y Limpieza',
  'Personalización y Diseño',
  'Servicios musicales',
  'Eventos y Sonido',
  'Asesoría de Imagen',
];

const AdminProductos = ({ mode = 'productos' }) => {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const {
    productos,
    servicios,
    quotes,
    addProducto,
    updateProducto,
    deleteProducto,
    addServicio,
    updateServicio,
    deleteServicio,
    applyOfferToItem,
  } = useProducts();

  const isServiceMode = mode === 'servicios';
  const activeItems = isServiceMode ? servicios : productos;

  // 'list' | 'form-item' | 'form-oferta'
  const [view, setView] = useState('list');
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
    vendedorNombre: currentUser?.nombre || 'Tienda Vento',
    vendedorTipo: currentUser?.tipoCuenta === 'Empresa' ? 'Empresa' : 'Emprendedor',
  });

  const buildEmptyService = () => ({
    tipo: 'Servicio',
    nombre: '',
    sku: '',
    marca: currentUser?.nombre || 'Profesional Vento',
    categoria: 'Mantención y Limpieza',
    modalidad: 'Presencial',
    tiempoEstimado: '',
    descripcion: '',
    restriccionEdad: 'no',
    permiteCotizacion: 'no',
    precio: '',
    image: '',
    vendedorNombre: currentUser?.nombre || 'Profesional Vento',
    vendedorTipo: currentUser?.tipoCuenta === 'Empresa' ? 'Empresa' : 'Emprendedor',
  });

  useEffect(() => {
    setView('list');
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
    setIsEditing(false);
    setCurrentItem(isServiceMode ? buildEmptyService() : buildEmptyProduct());
    setView('form-item');
  };

  const handleOpenOffer = () => {
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
        updateServicio(currentItem);
        showToast('Servicio actualizado correctamente.', 'success');
      } else {
        addServicio(currentItem);
        showToast('Servicio publicado en la sección Servicios.', 'success');
      }
    } else {
      if (isEditing) {
        updateProducto(currentItem);
        showToast('Producto actualizado correctamente.', 'success');
      } else {
        addProducto(currentItem);
        showToast('Producto publicado en la Tienda.', 'success');
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

  // ==================== VISTA PRINCIPAL (TABLA SEPARADA PRODUCTOS VS SERVICIOS) ====================
  return (
    <div className="max-w-6xl mx-auto p-6 my-8 space-y-8">
      {/* Selector superior para alternar entre los portales separados */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
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
          <h1 className="text-2xl font-extrabold text-gray-900">
            {isServiceMode
              ? 'Gestión de Servicios Profesionales'
              : 'Gestión de Ventas de Productos'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <CustomButton
            variant="outline"
            size="sm"
            startIcon={<LocalOffer fontSize="small" />}
            onClick={handleOpenOffer}
          >
            Crear Oferta
          </CustomButton>
          <CustomButton
            variant={isServiceMode ? 'secondary' : 'primary'}
            size="sm"
            startIcon={<Add fontSize="small" />}
            onClick={handleOpenCreate}
          >
            {isServiceMode ? 'Publicar Servicio' : 'Agregar Producto'}
          </CustomButton>
        </div>
      </div>

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
                <TableCell sx={{ fontWeight: 800 }} align="right">
                  {isServiceMode ? 'Tarifa Base' : 'Precio'}
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="center">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeItems.map((item) => (
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
                        </span>
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
                      <span className="text-xs font-bold text-gray-700">
                        {item.stock ?? 10} un.
                      </span>
                    )}
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
              ))}
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

      {/* Bandeja de Solicitudes de Cotización (visible solo en el Portal de Servicios) */}
      {isServiceMode && (
        <section
          className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm"
          aria-label="Solicitudes de cotización recibidas"
        >
          <h2 className="text-lg font-extrabold text-gray-900 mb-1">
            Solicitudes de Cotización Recibidas ({quotes.length})
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Requerimientos enviados por clientes desde las fichas de servicios cotizables
          </p>

          {quotes.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              Aún no se han recibido solicitudes de cotización.
            </p>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-extrabold text-sky-700">{q.id}</span>
                    <h3 className="text-sm font-bold text-gray-900">{q.servicioNombre}</h3>
                    <p className="text-xs text-gray-600 mt-1">{q.detalles}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cliente: <strong>{q.nombreContacto}</strong> ({q.correoContacto})
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-block text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                      {q.estado}
                    </span>
                    <span className="block text-xs text-gray-400 mt-1">{q.fechaCreacion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
