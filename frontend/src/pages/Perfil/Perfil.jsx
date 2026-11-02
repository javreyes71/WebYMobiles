import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Paper,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  User,
  Package,
  FileText,
  Heart,
  Trash2,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  ArrowUpCircle,
  CheckCircle2,
  Printer,
  Plus,
  Star,
} from 'lucide-react';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { getInitials, formatRUT, formatCurrency } from '@/utils/validators';
import { getRoleLabel, ROLES, APPROVAL_STATUS, hasRole } from '@/utils/roles';
import {
  REGIONES_CHILE,
  getComunasByRegion,
  getRegionLabel,
} from '@/utils/chileGeo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/context/ToastContext';

const ORDER_STEPS = ['Confirmado', 'En Preparación', 'Enviado', 'Entregado'];

const stepIndex = (estado) => {
  const idx = ORDER_STEPS.indexOf(estado);
  return idx >= 0 ? idx : 0;
};

const QUOTE_STATUS_COLORS = {
  Pendiente: 'bg-sky-100 text-sky-800',
  Cotizado: 'bg-indigo-100 text-indigo-800',
  Aceptada: 'bg-emerald-100 text-emerald-800',
  Rechazada: 'bg-red-100 text-red-800',
  'En Ejecución': 'bg-amber-100 text-amber-800',
  Completado: 'bg-green-100 text-green-800',
};

const Perfil = () => {
  const { currentUser, updateUserProfile, changePassword, requestRoleUpgrade } =
    useAuth();
  const { orders, myOrders, addToCart } = useCart();
  const {
    allProductos,
    allServicios,
    wishlistIds,
    toggleWishlist,
    myQuotes,
    updateQuoteStatus,
  } = useProducts();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = searchParams.get('tab') || 'datos';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    correo: '',
    telefono: '',
    direccion: '',
  });

  /* ── Libreta de Direcciones Chilenas ── */
  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    alias: '',
    calle: '',
    region: 'RM',
    comuna: 'Santiago',
    esPredeterminada: false,
  });

  /* ── Cambio de contraseña ── */
  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  /* ── Postulación a rol comercial ── */
  const [upgradeForm, setUpgradeForm] = useState({
    rolDeseado: ROLES.VENDEDOR_PRODUCTO,
    nombreTienda: '',
    biografiaTienda: '',
    especialidad: '',
  });
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  /* ── Pedido expandido (el más reciente expandido por defecto) ── */
  const userOrders = myOrders || orders || [];
  const [expandedOrder, setExpandedOrder] = useState(userOrders[0]?.id || null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        nombre: currentUser.nombre || '',
        rut: currentUser.rut || '',
        correo: currentUser.correo || '',
        telefono: currentUser.telefono || '',
        direccion: currentUser.direccion || '',
      });
      if (Array.isArray(currentUser.direcciones) && currentUser.direcciones.length > 0) {
        setAddresses(currentUser.direcciones);
      } else if (currentUser.direccion) {
        setAddresses([
          {
            id: 'addr-default',
            alias: 'Dirección Principal',
            calle: currentUser.direccion,
            region: 'RM',
            comuna: 'Santiago',
            esPredeterminada: true,
          },
        ]);
      } else {
        setAddresses([]);
      }
      setUpgradeForm((prev) => ({
        ...prev,
        nombreTienda: currentUser.nombreTienda || '',
        biografiaTienda: currentUser.biografiaTienda || '',
        especialidad: currentUser.especialidad || '',
      }));
    }
  }, [currentUser]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rut' ? formatRUT(value) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateUserProfile(formData);
    setIsSaving(false);
    if (res.success) setIsEditing(false);
  };

  /* ── Gestión de Libreta de Direcciones ── */
  const persistAddresses = async (nextAddresses) => {
    setAddresses(nextAddresses);
    const defaultAddr =
      nextAddresses.find((a) => a.esPredeterminada) || nextAddresses[0];
    const mainDirText = defaultAddr
      ? `${defaultAddr.calle}, ${defaultAddr.comuna}`
      : formData.direccion;

    await updateUserProfile({
      ...formData,
      direccion: mainDirText,
      direcciones: nextAddresses,
    });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addrForm.calle.trim()) {
      showToast('Ingresa la calle y numeración de la dirección.', 'warning');
      return;
    }
    const isFirst = addresses.length === 0;
    const makeDefault = isFirst || addrForm.esPredeterminada;

    const newEntry = {
      id: `addr-${Date.now()}`,
      alias: addrForm.alias.trim() || `Dirección ${addresses.length + 1}`,
      calle: addrForm.calle.trim(),
      region: addrForm.region,
      comuna: addrForm.comuna,
      esPredeterminada: makeDefault,
    };

    const next = makeDefault
      ? [...addresses.map((a) => ({ ...a, esPredeterminada: false })), newEntry]
      : [...addresses, newEntry];

    await persistAddresses(next);
    setAddrForm({
      alias: '',
      calle: '',
      region: 'RM',
      comuna: 'Santiago',
      esPredeterminada: false,
    });
    setShowAddrForm(false);
  };

  const handleSetDefaultAddress = async (addrId) => {
    const next = addresses.map((a) => ({
      ...a,
      esPredeterminada: a.id === addrId,
    }));
    await persistAddresses(next);
  };

  const handleDeleteAddress = async (addrId) => {
    const filtered = addresses.filter((a) => a.id !== addrId);
    if (filtered.length > 0 && !filtered.some((a) => a.esPredeterminada)) {
      filtered[0].esPredeterminada = true;
    }
    await persistAddresses(filtered);
  };

  /* ── Cambio de Contraseña Seguro ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next.length < 8) {
      setPwMsg({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setPwLoading(true);
    const res = await changePassword(pwForm.current, pwForm.next);
    setPwLoading(false);
    if (res.success) {
      setPwForm({ current: '', next: '', confirm: '' });
      setPwMsg({ type: 'success', text: res.message });
    } else {
      setPwMsg({ type: 'error', text: res.errors?.[0] || res.message });
    }
  };

  /* ── Postulación Comercial ── */
  const handleRoleUpgrade = async (e) => {
    e.preventDefault();
    if (!upgradeForm.nombreTienda.trim()) {
      showToast('Ingresa el nombre de tu tienda o estudio profesional.', 'warning');
      return;
    }
    setUpgradeLoading(true);
    await requestRoleUpgrade(upgradeForm.rolDeseado, {
      nombreTienda: upgradeForm.nombreTienda.trim(),
      biografiaTienda: upgradeForm.biografiaTienda.trim(),
      especialidad: upgradeForm.especialidad.trim(),
    });
    setUpgradeLoading(false);
  };

  /* ── Aceptar cotización: cargar al carrito al precio acordado y navegar a checkout ── */
  const handleAcceptQuote = (q) => {
    const serviceObj = allServicios.find((s) => Number(s.id) === Number(q.servicioId));
    updateQuoteStatus(q.id, { estado: 'Aceptada' });
    addToCart(
      {
        id: q.servicioId,
        quoteId: q.id,
        tipo: 'Servicio',
        title: `${q.servicioNombre} (${q.id})`,
        price: Number(q.propuestaProveedor?.monto || q.precioReferencial),
        ownerId: q.proveedorId,
        vendedorNombre: q.proveedor,
        stock: 99,
        image: serviceObj?.image || '',
        talla: q.modalidadPreferida || 'Servicio cotizado',
        color: q.propuestaProveedor?.plazo || 'A convenir',
      },
      1
    );
    showToast(
      `Propuesta ${q.id} aceptada. Completa el pago para iniciar el servicio.`,
      'success'
    );
    navigate('/checkout');
  };

  const handleRejectQuote = (q) => {
    updateQuoteStatus(q.id, { estado: 'Rechazada' });
    showToast(`Propuesta ${q.id} rechazada.`, 'info');
  };

  const handlePrintOrderReceipt = (order) => {
    const win = window.open('', '_blank', 'width=720,height=800');
    if (!win) {
      window.print();
      return;
    }
    const itemsHtml = (order.items || [])
      .map(
        (it) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb">${it.title}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${it.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(it.price * it.quantity)}</td>
          </tr>`
      )
      .join('');

    win.document.write(`
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Comprobante Pedido #${order.id} - Vento Marketplace</title>
      </head>
      <body style="font-family:Arial,sans-serif;padding:32px;color:#111827;max-width:650px;margin:0 auto">
        <h1 style="margin:0 0 4px">VENTO MARKETPLACE</h1>
        <p style="margin:0 0 20px;color:#6b7280;font-size:13px">Comprobante Electrónico de Compra · Pedido #${order.id}</p>
        <div style="background:#f9fafb;padding:14px;border-radius:8px;margin-bottom:20px;font-size:13px">
          <p style="margin:4px 0"><strong>Cliente:</strong> ${order.compradorNombre || formData.nombre} (${order.compradorRut || formData.rut})</p>
          <p style="margin:4px 0"><strong>Fecha:</strong> ${order.fecha}</p>
          <p style="margin:4px 0"><strong>Estado:</strong> ${order.estado} ${order.trackingCodigo ? `· Tracking: ${order.trackingCodigo} (${order.courier})` : ''}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;text-align:left">Detalle</th>
              <th style="padding:8px;text-align:center">Cant.</th>
              <th style="padding:8px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;font-size:14px">
          ${order.descuento > 0 ? `<p style="color:#15803d;margin:4px 0">Descuento: -${formatCurrency(order.descuento)}</p>` : ''}
          <p style="margin:4px 0">Envío: ${order.envio === 0 ? 'Gratis' : formatCurrency(order.envio || 0)}</p>
          <p style="font-size:18px;font-weight:bold;margin:8px 0">Total Pagado: ${formatCurrency(order.total)}</p>
        </div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const allCatalog = [...allProductos, ...allServicios];
  const wishlistItems = allCatalog.filter((item) => wishlistIds.includes(item.id));

  const hasPurchased = (itemId) =>
    userOrders.some((o) =>
      o.items?.some((it) => String(it.id) === String(itemId))
    );

  const isAdmin = hasRole(currentUser, ROLES.ADMIN);
  const canApplyCommercial = !isAdmin;

  const tabs = [
    { id: 'datos', label: 'Datos Personales', icon: User },
    { id: 'direcciones', label: `Mis Direcciones (${addresses.length})`, icon: MapPin },
    { id: 'seguridad', label: 'Seguridad y Clave', icon: Lock },
    { id: 'pedidos', label: `Mis Pedidos (${userOrders.length})`, icon: Package },
    { id: 'cotizaciones', label: `Mis Cotizaciones (${myQuotes.length})`, icon: FileText },
    { id: 'favoritos', label: `Favoritos (${wishlistItems.length})`, icon: Heart },
    ...(canApplyCommercial
      ? [{ id: 'upgrade', label: 'Perfil Comercial', icon: ArrowUpCircle }]
      : []),
  ];

  const renderPwToggle = (field, label) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
      className="absolute right-3 top-9 text-gray-500 hover:text-gray-800"
    >
      {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Mi Cuenta</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* ── Columna Izquierda: Tarjeta Usuario y Navegación ── */}
          <aside className="md:col-span-4 space-y-4">
            <Paper
              elevation={0}
              className="p-6 flex flex-col items-center border border-gray-200 rounded-2xl text-center"
            >
              <Avatar
                sx={{
                  width: 84,
                  height: 84,
                  bgcolor: '#111827',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  mb: 2,
                }}
              >
                {getInitials(formData.nombre)}
              </Avatar>
              <h2 className="text-lg font-extrabold text-gray-900">{formData.nombre}</h2>
              <p className="text-xs text-gray-500 mb-2">{formData.correo}</p>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-gray-100 text-gray-800">
                {getRoleLabel(currentUser?.rol)}
              </span>
              {currentUser?.verificado && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Cuenta Verificada
                </span>
              )}
              {currentUser?.estadoAprobacion === APPROVAL_STATUS.PENDIENTE && (
                <span className="mt-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Pendiente aprobación Admin
                </span>
              )}
            </Paper>

            <nav
              className="bg-white border border-gray-200 rounded-2xl p-2 space-y-1"
              aria-label="Secciones de perfil"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors text-left ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Columna Derecha: Contenido de la pestaña ── */}
          <section className="md:col-span-8">
            {/* ═══════════ TAB DATOS PERSONALES ═══════════ */}
            {activeTab === 'datos' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                  <h2 className="text-lg font-extrabold text-gray-900">Información Personal</h2>
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancelar' : 'Editar Perfil'}
                  </CustomButton>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomTextField
                      label="Nombre Completo"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                    <CustomTextField
                      label="RUT"
                      name="rut"
                      value={formData.rut}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                    <CustomTextField
                      label="Correo Electrónico"
                      name="correo"
                      type="email"
                      value={formData.correo}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                    <CustomTextField
                      label="Teléfono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <CustomTextField
                    label="Dirección Principal de Envío"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />

                  {isEditing && (
                    <div className="pt-3 flex justify-end">
                      <CustomButton type="submit" variant="primary" isLoading={isSaving}>
                        Guardar Cambios
                      </CustomButton>
                    </div>
                  )}
                </form>
              </Paper>
            )}

            {/* ═══════════ TAB LIBRETA DE DIRECCIONES CHILENAS ═══════════ */}
            {activeTab === 'direcciones' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">
                      Libreta de Direcciones
                    </h2>
                    <p className="text-xs text-gray-500">
                      Tus direcciones guardadas estarán disponibles con un clic en el Checkout
                    </p>
                  </div>
                  <CustomButton
                    variant="primary"
                    size="sm"
                    startIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowAddrForm(!showAddrForm)}
                  >
                    {showAddrForm ? 'Cancelar' : 'Nueva Dirección'}
                  </CustomButton>
                </div>

                {showAddrForm && (
                  <form
                    onSubmit={handleAddAddress}
                    className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomTextField
                        label="Alias (ej: Casa, Oficina, Estudio)"
                        name="alias"
                        value={addrForm.alias}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, alias: e.target.value })
                        }
                        required
                      />
                      <CustomTextField
                        label="Calle, número y depto."
                        name="calle"
                        placeholder="Ej: Av. Los Carrera 850, Depto 402"
                        value={addrForm.calle}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, calle: e.target.value })
                        }
                        required
                      />
                      <CustomTextField
                        select
                        label="Región"
                        name="region"
                        value={addrForm.region}
                        onChange={(e) => {
                          const reg = e.target.value;
                          const comunas = getComunasByRegion(reg);
                          setAddrForm({
                            ...addrForm,
                            region: reg,
                            comuna: comunas[0] || '',
                          });
                        }}
                      >
                        {REGIONES_CHILE.map((r) => (
                          <MenuItem key={r.codigo} value={r.codigo}>
                            {r.nombre}
                          </MenuItem>
                        ))}
                      </CustomTextField>

                      <CustomTextField
                        select
                        label="Comuna"
                        name="comuna"
                        value={addrForm.comuna}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, comuna: e.target.value })
                        }
                      >
                        {getComunasByRegion(addrForm.region).map((comuna) => (
                          <MenuItem key={comuna} value={comuna}>
                            {comuna}
                          </MenuItem>
                        ))}
                      </CustomTextField>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={addrForm.esPredeterminada}
                            onChange={(e) =>
                              setAddrForm({
                                ...addrForm,
                                esPredeterminada: e.target.checked,
                              })
                            }
                          />
                        }
                        label={
                          <span className="text-xs font-semibold text-gray-700">
                            Establecer como dirección predeterminada
                          </span>
                        }
                      />
                      <CustomButton type="submit" variant="success" size="sm">
                        Guardar Dirección
                      </CustomButton>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No tienes direcciones guardadas aún.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          addr.esPredeterminada
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-gray-900">
                              {addr.alias}
                            </span>
                            {addr.esPredeterminada && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <Star className="w-3 h-3" /> Predeterminada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 mt-1">{addr.calle}</p>
                          <p className="text-xs text-gray-500">
                            {addr.comuna} · Región {getRegionLabel(addr.region)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!addr.esPredeterminada && (
                            <CustomButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                            >
                              Predeterminar
                            </CustomButton>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            aria-label={`Eliminar dirección ${addr.alias}`}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Paper>
            )}

            {/* ═══════════ TAB SEGURIDAD (CAMBIO DE CONTRASEÑA) ═══════════ */}
            {activeTab === 'seguridad' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                  Seguridad y Cambio de Contraseña
                </h2>
                <p className="text-xs text-gray-500 mb-6 pb-3 border-b border-gray-100">
                  Verifica tu clave actual antes de establecer una nueva contraseña segura
                </p>

                {pwMsg && (
                  <Alert severity={pwMsg.type} sx={{ mb: 3, borderRadius: 2 }}>
                    {pwMsg.text}
                  </Alert>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="relative">
                    <CustomTextField
                      label="Contraseña actual"
                      name="currentPw"
                      type={showPw.current ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      required
                    />
                    {renderPwToggle('current', 'Mostrar u ocultar contraseña actual')}
                  </div>
                  <div className="relative">
                    <CustomTextField
                      label="Nueva contraseña (mín. 8 caracteres)"
                      name="newPw"
                      type={showPw.next ? 'text' : 'password'}
                      value={pwForm.next}
                      onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                      required
                    />
                    {renderPwToggle('next', 'Mostrar u ocultar nueva contraseña')}
                  </div>
                  <div className="relative">
                    <CustomTextField
                      label="Confirmar nueva contraseña"
                      name="confirmPw"
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      required
                    />
                    {renderPwToggle('confirm', 'Mostrar u ocultar confirmación de contraseña')}
                  </div>
                  <CustomButton type="submit" variant="primary" isLoading={pwLoading}>
                    Actualizar Contraseña
                  </CustomButton>
                </form>
              </Paper>
            )}

            {/* ═══════════ TAB PEDIDOS CON STEPPER Y COMPROBANTE ═══════════ */}
            {activeTab === 'pedidos' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <h2 className="text-lg font-extrabold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                  Historial y Seguimiento de Pedidos ({userOrders.length})
                </h2>

                {userOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    Aún no registras pedidos.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {userOrders.map((order) => {
                      const isExpanded = expandedOrder === order.id;
                      const currentStep = stepIndex(order.estado);
                      return (
                        <div
                          key={order.id}
                          className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrder(isExpanded ? null : order.id)
                            }
                            className="w-full flex flex-wrap justify-between items-center gap-2 p-4 text-left hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <p className="font-extrabold text-sm text-gray-900">
                                Pedido #{order.id}
                              </p>
                              <p className="text-xs text-gray-500">
                                Realizado el {order.fecha} · Ver seguimiento
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-base text-gray-900">
                                {formatCurrency(order.total)}
                              </p>
                              <span
                                className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${
                                  order.estado === 'Entregado'
                                    ? 'bg-green-100 text-green-800'
                                    : order.estado === 'Enviado'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {order.estado}
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-5 pt-4 border-t border-gray-200 bg-white">
                              <Stepper
                                activeStep={currentStep}
                                alternativeLabel
                                sx={{ mb: 3 }}
                              >
                                {ORDER_STEPS.map((label) => (
                                  <Step key={label}>
                                    <StepLabel
                                      sx={{
                                        '& .MuiStepLabel-label': {
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                        },
                                      }}
                                    >
                                      {label}
                                    </StepLabel>
                                  </Step>
                                ))}
                              </Stepper>

                              {order.trackingCodigo && (
                                <div className="bg-blue-50 p-3 rounded-lg mb-3 text-xs border border-blue-100">
                                  <span className="font-bold text-blue-800">
                                    Despacho en ruta:
                                  </span>{' '}
                                  <span className="text-blue-900 font-extrabold">
                                    {order.trackingCodigo}
                                  </span>
                                  {order.courier && (
                                    <span className="text-blue-700">
                                      {' '}
                                      vía {order.courier}
                                    </span>
                                  )}
                                </div>
                              )}

                              {order.items && order.items.length > 0 && (
                                <ul className="text-xs text-gray-700 space-y-1.5">
                                  {order.items.map((it, idx) => (
                                    <li
                                      key={idx}
                                      className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100"
                                    >
                                      <div>
                                        <span className="font-bold">
                                          {it.quantity} × {it.title}
                                        </span>
                                        {it.vendedorNombre && (
                                          <span className="block text-[11px] text-gray-500">
                                            Vendido por: {it.vendedorNombre}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <span className="font-extrabold">
                                          {formatCurrency(it.price * it.quantity)}
                                        </span>
                                        {it.estadoDespachoItem && (
                                          <span className="block text-[10px] text-gray-500">
                                            {it.estadoDespachoItem}
                                          </span>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs text-gray-500">
                                  {order.descuento > 0
                                    ? `Ahorro cupón: -${formatCurrency(order.descuento)}`
                                    : 'IVA (19%) incluido en el total'}
                                </span>
                                <CustomButton
                                  variant="outline"
                                  size="sm"
                                  startIcon={<Printer className="w-3.5 h-3.5" />}
                                  onClick={() => handlePrintOrderReceipt(order)}
                                >
                                  Imprimir Boleta / Comprobante
                                </CustomButton>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Paper>
            )}

            {/* ═══════════ TAB COTIZACIONES INTERACTIVAS ═══════════ */}
            {activeTab === 'cotizaciones' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Mis Solicitudes de Cotización de Servicios
                  </h2>
                  <Link to="/servicios">
                    <CustomButton variant="secondary" size="sm">
                      Explorar Servicios
                    </CustomButton>
                  </Link>
                </div>

                {myQuotes.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No has solicitado cotizaciones de servicios todavía.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myQuotes.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 bg-slate-50 rounded-xl border border-sky-100"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div>
                            <span className="text-xs font-extrabold text-sky-700">
                              {q.id}
                            </span>
                            <h3 className="text-sm font-bold text-gray-900">
                              {q.servicioNombre}
                            </h3>
                            <span className="text-xs text-gray-500">
                              Proveedor: {q.proveedor} · Modalidad: {q.modalidadPreferida}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              QUOTE_STATUS_COLORS[q.estado] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {q.estado}
                          </span>
                        </div>

                        <p className="text-xs text-gray-700 mt-2 bg-white p-3 rounded-lg border border-gray-100">
                          {q.detalles}
                        </p>

                        {/* Propuesta formal recibida del proveedor */}
                        {q.propuestaProveedor && (
                          <div className="mt-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                            <h4 className="text-xs font-extrabold uppercase text-indigo-800 mb-2">
                              Propuesta Formal del Proveedor
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 mb-3">
                              <div>
                                <span className="font-bold">Presupuesto final:</span>{' '}
                                <span className="text-indigo-900 font-extrabold text-sm">
                                  {formatCurrency(q.propuestaProveedor.monto)}
                                </span>
                              </div>
                              <div>
                                <span className="font-bold">Plazo de entrega:</span>{' '}
                                {q.propuestaProveedor.plazo}
                              </div>
                              {q.propuestaProveedor.detalle && (
                                <div className="sm:col-span-2">
                                  <span className="font-bold">Alcance y condiciones:</span>{' '}
                                  {q.propuestaProveedor.detalle}
                                </div>
                              )}
                              {q.propuestaProveedor.validez && (
                                <div className="sm:col-span-2 text-gray-500">
                                  <span className="font-bold">Vigencia:</span>{' '}
                                  {q.propuestaProveedor.validez}
                                </div>
                              )}
                            </div>

                            {q.estado === 'Cotizado' && (
                              <div className="flex flex-wrap gap-2">
                                <CustomButton
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleAcceptQuote(q)}
                                >
                                  Aceptar y Pagar ({formatCurrency(q.propuestaProveedor.monto)})
                                </CustomButton>
                                <CustomButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectQuote(q)}
                                >
                                  Rechazar Propuesta
                                </CustomButton>
                              </div>
                            )}
                          </div>
                        )}

                        {q.estado === 'En Ejecución' && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                            Servicio pagado y actualmente en ejecución por el proveedor.
                          </div>
                        )}
                        {q.estado === 'Completado' && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Servicio finalizado satisfactoriamente.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Paper>
            )}

            {/* ═══════════ TAB FAVORITOS ═══════════ */}
            {activeTab === 'favoritos' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <h2 className="text-lg font-extrabold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                  Mi Lista de Deseos ({wishlistItems.length})
                </h2>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">
                      Aún no tienes productos ni servicios guardados en favoritos.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Link to="/tienda">
                        <CustomButton variant="primary" size="sm">
                          Ir a Tienda
                        </CustomButton>
                      </Link>
                      <Link to="/servicios">
                        <CustomButton variant="secondary" size="sm">
                          Ver Servicios
                        </CustomButton>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishlistItems.map((item) => {
                      const isService = item.tipo === 'Servicio';
                      const verified = hasPurchased(item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-gray-200 bg-gray-50"
                        >
                          <Link
                            to={isService ? `/servicio/${item.id}` : `/producto/${item.id}`}
                            className="flex items-center gap-3.5 flex-1 min-w-0"
                          >
                            <img
                              src={item.image}
                              alt={item.title || item.nombre}
                              className="w-14 h-14 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span
                                  className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    isService
                                      ? 'bg-sky-100 text-sky-700'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}
                                >
                                  {item.tipo}
                                </span>
                                {verified && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Adquirido
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {item.title || item.nombre}
                              </p>
                              <p className="text-xs font-extrabold text-gray-700">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          </Link>

                          <button
                            type="button"
                            onClick={() => toggleWishlist(item.id)}
                            aria-label={`Quitar ${item.title || item.nombre} de favoritos`}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Paper>
            )}

            {/* ═══════════ TAB POSTULACIÓN / ESTADO PERFIL COMERCIAL ═══════════ */}
            {activeTab === 'upgrade' && canApplyCommercial && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                    Habilitación de Perfil Comercial
                  </h2>
                  <p className="text-xs text-gray-500">
                    Postula para vender productos en Tienda, ofrecer servicios profesionales o
                    ambos. Conservarás siempre tu capacidad de comprador.
                  </p>
                </div>

                {currentUser?.estadoAprobacion === APPROVAL_STATUS.PENDIENTE && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <strong>Solicitud en revisión:</strong> Tu postulación comercial para{' '}
                    <strong>{currentUser.nombreTienda}</strong> está pendiente de validación por
                    un Administrador.
                  </Alert>
                )}

                {currentUser?.estadoAprobacion === APPROVAL_STATUS.RECHAZADO && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    <strong>Postulación observada:</strong>{' '}
                    {currentUser.motivoRechazoRol ||
                      'Completa nuevamente tus antecedentes comerciales para reenviar a revisión.'}
                  </Alert>
                )}

                {currentUser?.estadoAprobacion === APPROVAL_STATUS.APROBADO && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <strong>Perfil comercial activo:</strong> Ya cuentas con aprobación para{' '}
                    <strong>{getRoleLabel(currentUser.rol)}</strong>. Si deseas ampliar tu giro al
                    otro portal comercial, puedes solicitarlo abajo.
                  </Alert>
                )}

                <form onSubmit={handleRoleUpgrade} className="space-y-4 max-w-lg">
                  <CustomTextField
                    select
                    label="Modalidad comercial solicitada"
                    name="rolDeseado"
                    value={upgradeForm.rolDeseado}
                    onChange={(e) =>
                      setUpgradeForm({ ...upgradeForm, rolDeseado: e.target.value })
                    }
                    required
                  >
                    <MenuItem value={ROLES.VENDEDOR_PRODUCTO}>
                      Vendedor de Productos (Catálogo Tienda)
                    </MenuItem>
                    <MenuItem value={ROLES.PROVEEDOR_SERVICIO}>
                      Proveedor de Servicios Profesionales (Directorio Servicios)
                    </MenuItem>
                    <MenuItem value="Ambos">
                      Ambos Perfiles (Productos + Servicios separados)
                    </MenuItem>
                  </CustomTextField>

                  <CustomTextField
                    label="Nombre de tu Tienda o Estudio Profesional"
                    name="nombreTienda"
                    placeholder="Ej: UrbanFit Store / SneakerCare Studio"
                    value={upgradeForm.nombreTienda}
                    onChange={(e) =>
                      setUpgradeForm({ ...upgradeForm, nombreTienda: e.target.value })
                    }
                    required
                  />

                  <CustomTextField
                    label="Especialidad o Rubro Principal"
                    name="especialidad"
                    placeholder="Ej: Calzado urbano limitado / Luthería y calibración"
                    value={upgradeForm.especialidad}
                    onChange={(e) =>
                      setUpgradeForm({ ...upgradeForm, especialidad: e.target.value })
                    }
                  />

                  <CustomTextField
                    label="Biografía / Presentación Pública"
                    name="biografiaTienda"
                    placeholder="Describe tu experiencia, garantías y propuesta de valor..."
                    value={upgradeForm.biografiaTienda}
                    onChange={(e) =>
                      setUpgradeForm({ ...upgradeForm, biografiaTienda: e.target.value })
                    }
                    multiline
                    rows={3}
                    required
                  />

                  <CustomButton
                    type="submit"
                    variant="primary"
                    isLoading={upgradeLoading}
                  >
                    Enviar Postulación al Administrador
                  </CustomButton>
                </form>
              </Paper>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
