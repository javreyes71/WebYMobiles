import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Avatar,
  Alert,
} from '@mui/material';
import {
  ShieldCheck,
  Users,
  UserCheck,
  FileCheck2,
  Ticket,
  Tag,
  Building2,
  CheckCircle2,
  XCircle,
  Star,
  Ban,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  Upload,
  TrendingUp,
  Search,
  Database,
  Layers,
  AlertOctagon,
  Activity,
  RefreshCw,
  MapPin,
  FolderTree,
} from 'lucide-react';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import { API_URL, apiFetch, authApi, usersApi, storageApi, analyticsApi } from '@/services/api';
import {
  validateRUT,
  formatRUT,
  handleRutKeyDown,
  validateEmail,
  formatCurrency,
  getInitials,
} from '@/utils/validators';
import {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  MODERATION_STATUS,
  MODERATION_BADGE_STYLES,
  getRoleLabel,
} from '@/utils/roles';

const AdminUsuarios = () => {
  const logoInputRef = useRef(null);
  const { currentUser, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();
  const { allOrders } = useCart();
  const {
    allProductos,
    allServicios,
    quotes,
    moderateCatalogItem,
    toggleFeaturedItem,
  } = useProducts();

  /* ── Pestaña activa del Centro de Gobierno ── */
  const [activeTab, setActiveTab] = useState('cuentas');

  /* ── Estado Usuarios Reales, Cupones, Tickets y Empresa ── */
  const [usersList, setUsersList] = useState(() => usersApi.getAllUsers());
  const [coupons, setCoupons] = useState(() => storageApi.getCoupons());
  const [tickets, setTickets] = useState(() => storageApi.getTickets());
  const [empresa, setEmpresa] = useState(() => storageApi.getCompany());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!API_URL) return;
    usersApi.fetchAllUsersAsync().then((res) => {
      if (res?.success && Array.isArray(res.data)) setUsersList(res.data);
    });
    apiFetch('/cupones').then((res) => {
      if (res?.success && Array.isArray(res.data)) setCoupons(res.data);
    });
    apiFetch('/admin/tickets').then((res) => {
      if (res?.success && Array.isArray(res.data)) setTickets(res.data);
    });
    apiFetch('/empresa').then((res) => {
      if (res?.success && res.data) setEmpresa((prev) => ({ ...prev, ...res.data }));
    });
  }, []);

  /* ── Vistas Analíticas PostgreSQL (BD2) ── */
  const [bd2SubTab, setBd2SubTab] = useState('inventario'); // 'inventario' | 'rendimiento' | 'facturas' | 'unificado' | 'geo' | 'jerarquia'
  const [bd2Loading, setBd2Loading] = useState(false);
  const [inventarioData, setInventarioData] = useState({ vistaInventarioCritico: [], alertasTriggerTrg08: [] });
  const [rendimientoData, setRendimientoData] = useState({ vistaRendimientoEmprendedor: [], kpisGlobales: null });
  const [facturasData, setFacturasData] = useState([]);
  const [unificadoData, setUnificadoData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [jerarquiaData, setJerarquiaData] = useState([]);
  const [unificadoQuery, setUnificadoQuery] = useState('');

  const loadBd2Views = async () => {
    setBd2Loading(true);
    try {
      const [invRes, rendRes, factRes, unifRes, geoRes, jerRes] = await Promise.all([
        analyticsApi.getInventarioCritico(),
        analyticsApi.getRendimientoEmprendedores(),
        analyticsApi.getFacturasFiscales(),
        analyticsApi.getCatalogoUnificado(),
        analyticsApi.getGeoEmpresas(),
        analyticsApi.getCategoriasJerarquia(),
      ]);
      if (invRes?.success && invRes.data) setInventarioData(invRes.data);
      if (rendRes?.success && rendRes.data) setRendimientoData(rendRes.data);
      if (factRes?.success && Array.isArray(factRes.data)) setFacturasData(factRes.data);
      if (unifRes?.success && Array.isArray(unifRes.data)) setUnificadoData(unifRes.data);
      if (geoRes?.success && Array.isArray(geoRes.data)) setGeoData(geoRes.data);
      if (jerRes?.success && Array.isArray(jerRes.data)) setJerarquiaData(jerRes.data);
    } catch {
      showToast('No fue posible consultar las vistas analíticas en PostgreSQL.', 'error');
    } finally {
      setBd2Loading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vistas-bd2') {
      loadBd2Views();
    }
  }, [activeTab]);

  /* ── Filtros de Moderación y Directorio de Usuarios ── */
  const [modCatalogType, setModCatalogType] = useState('Producto'); // 'Producto' | 'Servicio'
  const [modViewScope, setModViewScope] = useState('pendientes'); // 'pendientes' | 'todos'
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('Todos');

  /* ── Modal de Rechazo (Cuenta Comercial o Publicación) ── */
  const [rejectModal, setRejectModal] = useState({
    open: false,
    mode: 'cuenta', // 'cuenta' | 'publicacion'
    targetId: null,
    targetRole: null,
    targetTipo: 'Producto',
    targetTitle: '',
    motivo: '',
  });

  /* ── Modal Crear / Editar Usuario por Admin ── */
  const [userModal, setUserModal] = useState({
    open: false,
    isEditing: false,
    id: null,
    nombre: '',
    rut: '',
    correo: '',
    rol: ROLES.COMPRADOR,
    nombreTienda: '',
    password: '',
  });

  /* ── Formulario Nuevo Cupón ── */
  const [couponForm, setCouponForm] = useState({
    code: '',
    pct: '15',
    label: '',
  });

  /* ── Respuestas en Bandeja de Tickets ── */
  const [ticketReplies, setTicketReplies] = useState({});

  const reloadUsers = () => {
    const fresh = usersApi.getAllUsers();
    setUsersList(fresh);
    refreshCurrentUser();
  };

  /* ── Métricas Ejecutivas (KPIs Globales) ── */
  const pendingAccounts = useMemo(
    () =>
      usersList.filter(
        (u) =>
          u.estadoAprobacion === APPROVAL_STATUS.PENDIENTE ||
          Object.values(u.aprobacionesPorRol || {}).includes(APPROVAL_STATUS.PENDIENTE)
      ),
    [usersList]
  );

  const pendingProducts = useMemo(
    () => allProductos.filter((p) => p.estadoModeracion === MODERATION_STATUS.PENDIENTE),
    [allProductos]
  );

  const pendingServices = useMemo(
    () => allServicios.filter((s) => s.estadoModeracion === MODERATION_STATUS.PENDIENTE),
    [allServicios]
  );

  const openTickets = useMemo(
    () => tickets.filter((t) => t.estado !== 'Resuelto'),
    [tickets]
  );

  const totalGmv = useMemo(() => {
    const ordersSum = (allOrders || []).reduce((acc, o) => acc + Number(o.total || 0), 0);
    const servicesSum = (quotes || [])
      .filter((q) => q.estado === 'Completado')
      .reduce((acc, q) => acc + Number(q.propuestaProveedor?.monto || 0), 0);
    return ordersSum + servicesSum;
  }, [allOrders, quotes]);

  /* ── Cola de Moderación de Publicaciones (Productos separados de Servicios) ── */
  const moderationItems = useMemo(() => {
    const base = modCatalogType === 'Servicio' ? allServicios : allProductos;
    if (modViewScope === 'pendientes') {
      return base.filter((it) => it.estadoModeracion === MODERATION_STATUS.PENDIENTE);
    }
    return base;
  }, [modCatalogType, modViewScope, allProductos, allServicios]);

  /* ── Usuarios filtrados ── */
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return usersList.filter((u) => {
      const roleMatch = userRoleFilter === 'Todos' || u.rol === userRoleFilter;
      const searchMatch =
        !q ||
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.rut || '').toLowerCase().includes(q) ||
        (u.correo || '').toLowerCase().includes(q) ||
        (u.nombreTienda || '').toLowerCase().includes(q);
      return roleMatch && searchMatch;
    });
  }, [usersList, userSearch, userRoleFilter]);

  /* ══════════════ ACCIONES DE GOBIERNO ══════════════ */

  const handleApproveCommercialAccount = async (user, markVerified = true) => {
    setIsLoading(true);
    await usersApi.moderateUserRole(user.id, 'Todos', APPROVAL_STATUS.APROBADO);
    if (markVerified) {
      await usersApi.updateUserByAdmin(user.id, { verificado: true });
    }
    reloadUsers();
    setIsLoading(false);
    showToast(
      `Cuenta comercial de ${user.nombreTienda || user.nombre} aprobada${markVerified ? ' y verificada' : ''}.`,
      'success'
    );
  };

  const handleApproveCatalogItem = (item) => {
    moderateCatalogItem(item.id, item.tipo, MODERATION_STATUS.APROBADO);
    showToast(
      `${item.tipo} "${item.nombre || item.title}" aprobado y visible en el catálogo público.`,
      'success'
    );
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.motivo.trim()) {
      showToast('Debes especificar el motivo del rechazo para retroalimentar al usuario.', 'warning');
      return;
    }

    if (rejectModal.mode === 'cuenta') {
      setIsLoading(true);
      await usersApi.moderateUserRole(
        rejectModal.targetId,
        rejectModal.targetRole || 'Todos',
        APPROVAL_STATUS.RECHAZADO,
        rejectModal.motivo.trim()
      );
      reloadUsers();
      setIsLoading(false);
      showToast(`Solicitud comercial rechazada con observación.`, 'info');
    } else {
      moderateCatalogItem(
        rejectModal.targetId,
        rejectModal.targetTipo,
        MODERATION_STATUS.RECHAZADO,
        rejectModal.motivo.trim()
      );
      showToast(`Publicación "${rejectModal.targetTitle}" rechazada.`, 'info');
    }

    setRejectModal({
      open: false,
      mode: 'cuenta',
      targetId: null,
      targetRole: null,
      targetTipo: 'Producto',
      targetTitle: '',
      motivo: '',
    });
  };

  const handleToggleSuspendUser = async (user) => {
    if (user.id === currentUser?.id) {
      showToast('No puedes suspender tu propia sesión activa de Administrador.', 'warning');
      return;
    }
    const nextState =
      user.estadoCuenta === ACCOUNT_STATUS.SUSPENDIDO
        ? ACCOUNT_STATUS.ACTIVO
        : ACCOUNT_STATUS.SUSPENDIDO;
    await usersApi.updateUserByAdmin(user.id, { estadoCuenta: nextState });
    reloadUsers();
    showToast(
      nextState === ACCOUNT_STATUS.SUSPENDIDO
        ? `Cuenta de ${user.nombre} suspendida (acceso bloqueado con HTTP 403).`
        : `Cuenta de ${user.nombre} reactivada.`,
      nextState === ACCOUNT_STATUS.SUSPENDIDO ? 'warning' : 'success'
    );
  };

  const handleToggleVerifyUser = async (user) => {
    await usersApi.updateUserByAdmin(user.id, { verificado: !user.verificado });
    reloadUsers();
    showToast(
      !user.verificado
        ? `Insignia "Verificado" otorgada a ${user.nombre}.`
        : `Insignia "Verificado" retirada de ${user.nombre}.`,
      'info'
    );
  };

  const handleOpenCreateUser = () => {
    setUserModal({
      open: true,
      isEditing: false,
      id: null,
      nombre: '',
      rut: '',
      correo: '',
      rol: ROLES.ADMIN,
      nombreTienda: '',
      password: '',
    });
  };

  const handleOpenEditUser = (u) => {
    setUserModal({
      open: true,
      isEditing: true,
      id: u.id,
      nombre: u.nombre || '',
      rut: u.rut || '',
      correo: u.correo || '',
      rol: u.rol || ROLES.COMPRADOR,
      nombreTienda: u.nombreTienda || '',
      password: '',
    });
  };

  const handleSubmitUserModal = async (e) => {
    e.preventDefault();
    if (!userModal.nombre.trim() || !validateRUT(userModal.rut) || !validateEmail(userModal.correo)) {
      showToast('Verifica nombre, RUT chileno válido (Módulo 11) y correo electrónico.', 'error');
      return;
    }

    setIsLoading(true);
    if (userModal.isEditing) {
      const rolesSet = new Set([ROLES.COMPRADOR, userModal.rol]);
      const isCommercial =
        userModal.rol === ROLES.VENDEDOR_PRODUCTO ||
        userModal.rol === ROLES.PROVEEDOR_SERVICIO;
      await usersApi.updateUserByAdmin(userModal.id, {
        nombre: userModal.nombre.trim(),
        rut: formatRUT(userModal.rut),
        correo: userModal.correo.trim().toLowerCase(),
        rol: userModal.rol,
        tipoCuenta: userModal.rol,
        rolesHabilitados: Array.from(rolesSet),
        nombreTienda: userModal.nombreTienda.trim(),
        estadoAprobacion:
          userModal.rol === ROLES.ADMIN || isCommercial
            ? APPROVAL_STATUS.APROBADO
            : APPROVAL_STATUS.NO_APLICA,
        aprobacionesPorRol: isCommercial
          ? { [userModal.rol]: APPROVAL_STATUS.APROBADO }
          : userModal.rol === ROLES.ADMIN
            ? { [ROLES.ADMIN]: APPROVAL_STATUS.APROBADO }
            : {},
      });
      reloadUsers();
      showToast('Usuario actualizado correctamente.', 'success');
    } else {
      if ((userModal.password || '').length < 8) {
        setIsLoading(false);
        showToast('La contraseña inicial debe tener al menos 8 caracteres.', 'warning');
        return;
      }
      const prevSession = authApi.getSession();
      const regRes = await authApi.register({
        nombre: userModal.nombre.trim(),
        rut: userModal.rut,
        correo: userModal.correo.trim(),
        direccion: 'Registrado por Administración Vento',
        tipoCuenta: userModal.rol === ROLES.ADMIN ? ROLES.COMPRADOR : userModal.rol,
        nombreTienda: userModal.nombreTienda.trim(),
        password: userModal.password,
        confirmPassword: userModal.password,
      });

      if (!regRes.success) {
        if (prevSession) authApi.saveSession(prevSession);
        setIsLoading(false);
        showToast(regRes.errors?.[0] || regRes.message, 'error');
        return;
      }

      // Restaurar sesión del Admin actual y aplicar rol privilegiado aprobado
      if (prevSession) authApi.saveSession(prevSession);
      await usersApi.updateUserByAdmin(regRes.data.id, {
        rol: userModal.rol,
        tipoCuenta: userModal.rol,
        rolesHabilitados: [userModal.rol, ROLES.COMPRADOR],
        estadoAprobacion:
          userModal.rol === ROLES.COMPRADOR
            ? APPROVAL_STATUS.NO_APLICA
            : APPROVAL_STATUS.APROBADO,
        aprobacionesPorRol:
          userModal.rol === ROLES.COMPRADOR
            ? {}
            : { [userModal.rol]: APPROVAL_STATUS.APROBADO },
        verificado: userModal.rol !== ROLES.COMPRADOR,
      });
      reloadUsers();
      showToast(`Cuenta creada con rol ${getRoleLabel(userModal.rol)}.`, 'success');
    }

    setIsLoading(false);
    setUserModal((prev) => ({ ...prev, open: false }));
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      showToast('No puedes eliminar tu propia cuenta de Administrador.', 'warning');
      return;
    }
    await usersApi.deleteUserByAdmin(user.id);
    reloadUsers();
    showToast(`Usuario ${user.nombre} eliminado.`, 'info');
  };

  /* ── Motor Dinámico de Cupones ── */
  const handleCreateCoupon = (e) => {
    e.preventDefault();
    const cleanCode = couponForm.code.trim().toUpperCase().replace(/\s+/g, '');
    const pctNum = Math.min(80, Math.max(1, Number(couponForm.pct) || 10));
    if (!cleanCode) {
      showToast('Ingresa un código promocional (ej: INVIERNO25).', 'warning');
      return;
    }
    if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      showToast('Ese código de cupón ya existe.', 'error');
      return;
    }
    const newCoupon = {
      code: cleanCode,
      rate: Number((pctNum / 100).toFixed(2)),
      label: couponForm.label.trim() || `${pctNum}% OFF Promoción Vento`,
      active: true,
    };
    const next = [newCoupon, ...coupons];
    setCoupons(next);
    storageApi.saveCoupons(next);
    setCouponForm({ code: '', pct: '15', label: '' });
    showToast(`Cupón ${cleanCode} (${pctNum}% OFF) habilitado en Carrito y Checkout.`, 'success');
  };

  const handleToggleCoupon = (code) => {
    const next = coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c));
    setCoupons(next);
    storageApi.saveCoupons(next);
    showToast(`Estado del cupón ${code} actualizado.`, 'info');
  };

  const handleDeleteCoupon = (code) => {
    const next = coupons.filter((c) => c.code !== code);
    setCoupons(next);
    storageApi.saveCoupons(next);
    showToast(`Cupón ${code} eliminado.`, 'info');
  };

  /* ── Soporte / Tickets de Contacto ── */
  const handleResolveTicket = (tckId) => {
    const reply = (ticketReplies[tckId] || '').trim();
    const next = tickets.map((t) =>
      t.id === tckId
        ? {
            ...t,
            estado: 'Resuelto',
            respuestaAdmin:
              reply || t.respuestaAdmin || 'Atendido satisfactoriamente por Soporte Vento.',
          }
        : t
    );
    setTickets(next);
    storageApi.saveTickets(next);
    showToast(`Ticket ${tckId} marcado como Resuelto.`, 'success');
  };

  /* ── Identidad Corporativa ── */
  const handleSaveEmpresa = async (e) => {
    e.preventDefault();
    if (!validateRUT(empresa.rut)) {
      showToast('El RUT corporativo ingresado no es válido.', 'error');
      return;
    }
    if (!empresa.nombre.trim()) {
      showToast('La razón social es obligatoria.', 'error');
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    storageApi.saveCompany(empresa);
    setIsLoading(false);
    showToast('Identidad corporativa de Vento actualizada.', 'success');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEmpresa((prev) => ({ ...prev, logo: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const adminTabs = [
    {
      id: 'cuentas',
      label: `Aprobación Cuentas (${pendingAccounts.length})`,
      icon: UserCheck,
    },
    {
      id: 'moderacion',
      label: `Moderación Catálogo (${pendingProducts.length + pendingServices.length})`,
      icon: FileCheck2,
    },
    {
      id: 'usuarios',
      label: `Usuarios y Roles (${usersList.length})`,
      icon: Users,
    },
    {
      id: 'cupones',
      label: `Cupones (${coupons.length})`,
      icon: Tag,
    },
    {
      id: 'soporte',
      label: `Soporte (${openTickets.length})`,
      icon: Ticket,
    },
    {
      id: 'empresa',
      label: 'Datos Corporativos',
      icon: Building2,
    },
    {
      id: 'vistas-bd2',
      label: 'Vistas PostgreSQL (BD2)',
      icon: Database,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 my-8 space-y-8">
      {/* Cabecera Ejecutiva */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Gobierno General del Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Centro de Control Administrativo
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Moderación estricta de cuentas comerciales, publicaciones, usuarios, cupones y soporte
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/productos">
            <CustomButton variant="outline" size="sm">
              Catálogo Productos
            </CustomButton>
          </Link>
          <Link to="/admin/servicios">
            <CustomButton variant="secondary" size="sm">
              Catálogo Servicios
            </CustomButton>
          </Link>
        </div>
      </header>

      {/* KPIs Ejecutivos Globales */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        aria-label="Métricas globales de la plataforma"
      >
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">GMV Global</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totalGmv)}</p>
          <span className="text-[11px] text-gray-400">
            {(allOrders || []).length} órdenes registradas
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">Comunidad</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">{usersList.length}</p>
          <span className="text-[11px] text-gray-400">Cuentas con RUT validado</span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            pendingAccounts.length > 0
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-gray-600">
              Cuentas por Aprobar
            </span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">{pendingAccounts.length}</p>
          <span className="text-[11px] text-gray-500">Vendedores / Proveedores</span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            pendingProducts.length + pendingServices.length > 0
              ? 'bg-sky-50/60 border-sky-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-gray-600">
              Ítems por Moderar
            </span>
            <FileCheck2 className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">
            {pendingProducts.length + pendingServices.length}
          </p>
          <span className="text-[11px] text-gray-500">
            {pendingProducts.length} prod. · {pendingServices.length} serv.
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">Soporte Abierto</span>
            <Ticket className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">{openTickets.length}</p>
          <span className="text-[11px] text-gray-400">Tickets de Contacto</span>
        </div>
      </section>

      {/* Barra de Navegación del Centro de Gobierno */}
      <nav
        className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm"
        aria-label="Módulos de administración"
      >
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
                active
                  ? 'bg-indigo-900 text-white shadow-sm'
                  : tab.id === 'vistas-bd2'
                  ? 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ══════════════════ 1. COLA DE APROBACIÓN DE CUENTAS COMERCIALES ══════════════════ */}
      {activeTab === 'cuentas' && (
        <section
          className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5"
          aria-label="Cola de aprobación de cuentas comerciales"
        >
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Solicitudes de Habilitación Comercial ({pendingAccounts.length})
            </h2>
            <p className="text-xs text-gray-500">
              Regla de Moderación Estricta: ningún vendedor o proveedor puede publicar en el
              catálogo sin aprobación previa del Administrador.
            </p>
          </div>

          {pendingAccounts.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              ¡Al día! No existen postulaciones comerciales pendientes de revisión.
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingAccounts.map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-gray-900">
                        {u.nombreTienda || u.nombre}
                      </span>
                      <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {getRoleLabel(u.rol)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Titular: <strong>{u.nombre}</strong> ({u.rut} · {u.correo})
                      </span>
                    </div>
                    {u.especialidad && (
                      <p className="text-xs font-semibold text-gray-700">
                        Rubro / Especialidad: {u.especialidad}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      {u.biografiaTienda || 'Sin biografía comercial adjunta.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <CustomButton
                      variant="success"
                      size="sm"
                      isLoading={isLoading}
                      startIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => handleApproveCommercialAccount(u, true)}
                    >
                      Aprobar + Sello Verificado
                    </CustomButton>
                    <CustomButton
                      variant="outline"
                      size="sm"
                      isLoading={isLoading}
                      onClick={() => handleApproveCommercialAccount(u, false)}
                    >
                      Aprobar Estándar
                    </CustomButton>
                    <CustomButton
                      variant="danger"
                      size="sm"
                      startIcon={<XCircle className="w-4 h-4" />}
                      onClick={() =>
                        setRejectModal({
                          open: true,
                          mode: 'cuenta',
                          targetId: u.id,
                          targetRole: 'Todos',
                          targetTipo: 'Producto',
                          targetTitle: u.nombreTienda || u.nombre,
                          motivo: '',
                        })
                      }
                    >
                      Rechazar
                    </CustomButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════ 2. COLA DE MODERACIÓN DE PUBLICACIONES ══════════════════ */}
      {activeTab === 'moderacion' && (
        <section
          className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6"
          aria-label="Cola de moderación de productos y servicios"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Moderación y Destacados de Catálogo
              </h2>
              <p className="text-xs text-gray-500">
                Revisa publicaciones nuevas o editadas manteniendo separados Productos de Servicios
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModCatalogType('Producto')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors ${
                  modCatalogType === 'Producto'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Productos en Venta ({pendingProducts.length} pend.)
              </button>
              <button
                type="button"
                onClick={() => setModCatalogType('Servicio')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors ${
                  modCatalogType === 'Servicio'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                Servicios Profesionales ({pendingServices.length} pend.)
              </button>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setModViewScope('pendientes')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                modViewScope === 'pendientes'
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Solo Pendientes de Revisión
            </button>
            <button
              type="button"
              onClick={() => setModViewScope('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                modViewScope === 'todos'
                  ? 'bg-indigo-100 text-indigo-900'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Ver Todo el Catálogo y Destacados
            </button>
          </div>

          {moderationItems.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              No hay {modCatalogType === 'Servicio' ? 'servicios' : 'productos'} pendientes de
              moderación en este momento.
            </Alert>
          ) : (
            <div className="space-y-4">
              {moderationItems.map((item) => {
                const st = item.estadoModeracion || MODERATION_STATUS.APROBADO;
                const badgeStyle =
                  MODERATION_BADGE_STYLES[st] || MODERATION_BADGE_STYLES.Aprobado;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.image}
                        alt={item.nombre || item.title}
                        className="w-16 h-16 rounded-xl object-cover bg-white border border-gray-200 shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold text-gray-900">
                            {item.nombre || item.title}
                          </h3>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                          >
                            {st}
                          </span>
                          {item.destacado && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Destacado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Publicado por: <strong>{item.vendedorNombre || item.brand}</strong> ·
                          Categoría: {item.categoria} · Precio:{' '}
                          <strong className="text-gray-900">
                            {formatCurrency(item.price ?? item.precio)}
                          </strong>
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {item.descripcion || item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {st !== MODERATION_STATUS.APROBADO && (
                        <CustomButton
                          variant="success"
                          size="sm"
                          onClick={() => handleApproveCatalogItem(item)}
                        >
                          Aprobar
                        </CustomButton>
                      )}
                      {st !== MODERATION_STATUS.RECHAZADO && (
                        <CustomButton
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setRejectModal({
                              open: true,
                              mode: 'publicacion',
                              targetId: item.id,
                              targetRole: null,
                              targetTipo: item.tipo,
                              targetTitle: item.nombre || item.title,
                              motivo: '',
                            })
                          }
                        >
                          Rechazar
                        </CustomButton>
                      )}
                      <CustomButton
                        variant="outline"
                        size="sm"
                        startIcon={<Star className="w-3.5 h-3.5" />}
                        onClick={() => {
                          toggleFeaturedItem(item.id, item.tipo);
                          showToast(
                            !item.destacado
                              ? 'Ítem marcado como Destacado en portada.'
                              : 'Ítem removido de Destacados.',
                            'info'
                          );
                        }}
                      >
                        {item.destacado ? 'Quitar Destacado' : 'Destacar'}
                      </CustomButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════ 3. CRUD UNIFICADO DE USUARIOS Y ROLES ══════════════════ */}
      {activeTab === 'usuarios' && (
        <section
          className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5"
          aria-label="Directorio general de usuarios"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Gestión Unificada de Usuarios ({filteredUsers.length})
              </h2>
              <p className="text-xs text-gray-500">
                Administra permisos RBAC, insignias de verificación y suspensiones de acceso (403)
              </p>
            </div>
            <CustomButton
              variant="primary"
              size="sm"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreateUser}
            >
              Crear Usuario / Admin
            </CustomButton>
          </div>

          {/* Buscador y filtro por rol */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Buscar usuario por nombre, RUT o correo"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre, tienda, RUT o correo..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-gray-900"
              />
            </div>
            <CustomTextField
              select
              label="Filtrar por Rol"
              name="roleFilter"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <MenuItem value="Todos">Todos los Roles</MenuItem>
              <MenuItem value={ROLES.ADMIN}>Administrador General</MenuItem>
              <MenuItem value={ROLES.VENDEDOR_PRODUCTO}>Vendedor de Productos</MenuItem>
              <MenuItem value={ROLES.PROVEEDOR_SERVICIO}>Proveedor de Servicios</MenuItem>
              <MenuItem value={ROLES.COMPRADOR}>Comprador</MenuItem>
            </CustomTextField>
          </div>

          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Usuario / Tienda</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>RUT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Rol Principal</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => {
                  const isSuspended = u.estadoCuenta === ACCOUNT_STATUS.SUSPENDIDO;
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <div className="flex items-center gap-2.5 py-1">
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: '0.75rem',
                              bgcolor: u.rol === ROLES.ADMIN ? '#312e81' : '#111827',
                            }}
                          >
                            {getInitials(u.nombre)}
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 text-sm">{u.nombre}</span>
                              {u.verificado && (
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-emerald-600"
                                  aria-label="Usuario verificado"
                                />
                              )}
                            </div>
                            <span className="text-xs text-gray-500 block">
                              {u.correo}
                              {u.nombreTienda ? ` · ${u.nombreTienda}` : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{u.rut}</TableCell>
                      <TableCell>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                          {getRoleLabel(u.rol)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isSuspended
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.estadoCuenta || 'Activo'}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title={u.verificado ? 'Quitar insignia Verificado' : 'Otorgar Verificado'}
                            aria-label={`Alternar verificación de ${u.nombre}`}
                            onClick={() => handleToggleVerifyUser(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.verificado
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="Editar usuario o rol"
                            aria-label={`Editar ${u.nombre}`}
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title={isSuspended ? 'Reactivar cuenta' : 'Suspender cuenta (403)'}
                            aria-label={isSuspended ? `Reactivar ${u.nombre}` : `Suspender ${u.nombre}`}
                            onClick={() => handleToggleSuspendUser(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuspended
                                ? 'text-emerald-700 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {isSuspended ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Eliminar cuenta"
                            aria-label={`Eliminar ${u.nombre}`}
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </section>
      )}

      {/* ══════════════════ 4. MOTOR DINÁMICO DE CUPONES ══════════════════ */}
      {activeTab === 'cupones' && (
        <section
          className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6"
          aria-label="Motor dinámico de cupones promocionales"
        >
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Motor Dinámico de Cupones de Descuento
            </h2>
            <p className="text-xs text-gray-500">
              Los cupones activos funcionan en tiempo real dentro del Carrito de Compras y Checkout
            </p>
          </div>

          <form
            onSubmit={handleCreateCoupon}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 items-end"
          >
            <CustomTextField
              label="Código (ej: CYBER25)"
              name="code"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
              required
            />
            <CustomTextField
              label="% Descuento (1-80)"
              name="pct"
              type="number"
              value={couponForm.pct}
              onChange={(e) => setCouponForm({ ...couponForm, pct: e.target.value })}
              required
            />
            <CustomTextField
              label="Etiqueta visible"
              name="label"
              placeholder="Ej: 25% OFF Especial Cyber"
              value={couponForm.label}
              onChange={(e) => setCouponForm({ ...couponForm, label: e.target.value })}
            />
            <CustomButton type="submit" variant="primary" size="md">
              Crear Cupón
            </CustomButton>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.code}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  c.active !== false
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-gray-100 border-gray-200 opacity-75'
                }`}
              >
                <div>
                  <span className="text-base font-extrabold text-gray-900 tracking-wider block">
                    {c.code}
                  </span>
                  <span className="text-xs text-gray-600">{c.label}</span>
                  <span className="block text-[11px] font-bold text-indigo-700 mt-0.5">
                    Descuento: {Math.round(c.rate * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleCoupon(c.code)}
                  >
                    {c.active !== false ? 'Pausar' : 'Activar'}
                  </CustomButton>
                  <button
                    type="button"
                    aria-label={`Eliminar cupón ${c.code}`}
                    onClick={() => handleDeleteCoupon(c.code)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════ 5. BANDEJA DE TICKETS DE CONTACTO ══════════════════ */}
      {activeTab === 'soporte' && (
        <section
          className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5"
          aria-label="Bandeja de tickets de soporte"
        >
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Bandeja de Consultas y Soporte ({tickets.length})
            </h2>
            <p className="text-xs text-gray-500">
              Mensajes enviados desde la vista pública de Contacto
            </p>
          </div>

          {tickets.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No se han recibido tickets de soporte todavía.
            </p>
          ) : (
            <div className="space-y-4">
              {tickets.map((tck) => (
                <div
                  key={tck.id}
                  className="p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-indigo-700">{tck.id}</span>
                      <h3 className="text-sm font-extrabold text-gray-900">{tck.asunto}</h3>
                      <span className="text-xs text-gray-500">
                        Remitente: <strong>{tck.nombre}</strong> ({tck.correo}) · {tck.fecha}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        tck.estado === 'Resuelto'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tck.estado}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-white p-3.5 rounded-lg border border-gray-200">
                    {tck.mensaje}
                  </p>

                  {tck.estado === 'Resuelto' ? (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <strong>Respuesta Administración:</strong> {tck.respuestaAdmin}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        aria-label={`Responder ticket ${tck.id}`}
                        placeholder="Escribe una nota de resolución o respuesta al usuario..."
                        value={ticketReplies[tck.id] || ''}
                        onChange={(e) =>
                          setTicketReplies({ ...ticketReplies, [tck.id]: e.target.value })
                        }
                        className="flex-1 px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-900"
                      />
                      <CustomButton
                        variant="success"
                        size="sm"
                        onClick={() => handleResolveTicket(tck.id)}
                      >
                        Responder y Cerrar Ticket
                      </CustomButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════ 6. DATOS CORPORATIVOS DE EMPRESA ══════════════════ */}
      {activeTab === 'empresa' && (
        <section
          className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl"
          aria-label="Datos corporativos de la plataforma"
        >
          <h2 className="text-lg font-extrabold text-gray-900 mb-6">
            Identidad Legal y Corporativa de Vento
          </h2>

          <form onSubmit={handleSaveEmpresa}>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <CustomTextField
                  name="nombre"
                  label="Razón Social / Nombre Empresa"
                  value={empresa.nombre}
                  onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
                  required
                />
                <CustomTextField
                  name="rut"
                  label="RUT Empresa"
                  value={empresa.rut}
                  onChange={(e) =>
                    setEmpresa({ ...empresa, rut: formatRUT(e.target.value) })
                  }
                  onKeyDown={handleRutKeyDown}
                  inputProps={{ maxLength: 12 }}
                  helperText="Solo números y K (máx. 9 dígitos). Puntos y guion automáticos."
                  required
                />
                <CustomTextField
                  name="sitioWeb"
                  label="Sitio Web Oficial"
                  value={empresa.sitioWeb}
                  onChange={(e) => setEmpresa({ ...empresa, sitioWeb: e.target.value })}
                />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-600 mb-2">Logo Corporativo</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  aria-label="Subir logo corporativo"
                  className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden p-2"
                >
                  {empresa.logo ? (
                    <img
                      src={empresa.logo}
                      alt="Logo empresa"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-[11px] text-gray-500">Subir logo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <CustomButton type="submit" variant="success" isLoading={isLoading}>
                Guardar Datos Corporativos
              </CustomButton>
            </div>
          </form>
        </section>
      )}

      {/* ==================== PESTAÑA VISTAS ANALÍTICAS POSTGRESQL (BD2) ==================== */}
      {activeTab === 'vistas-bd2' && (
        <section className="space-y-6" aria-label="Vistas Analíticas BD2">
          {/* Cabecera de la sección analítica */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <Database className="w-4 h-4" /> Motor Relacional PostgreSQL 17
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Vistas Analíticas y Triggers de Base de Datos Avanzadas (BD2)
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Estas tablas se alimentan directamente de las vistas SQL y los triggers automáticos
                en PL/pgSQL compilados en PostgreSQL (<code className="text-sky-300 font-mono">vento_bd2</code>).
              </p>
            </div>
            <CustomButton
              variant="outline"
              size="sm"
              onClick={loadBd2Views}
              isLoading={bd2Loading}
              className="bg-slate-800 text-sky-400 hover:bg-slate-700 border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refrescar Vistas
            </CustomButton>
          </div>

          {/* Sub-pestañas de Vistas */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {[
              { id: 'inventario', label: '1. Inventario Crítico & Trigger 08', icon: AlertOctagon },
              { id: 'rendimiento', label: '2. Rendimiento Emprendedores', icon: TrendingUp },
              { id: 'facturas', label: '3. Facturación Cliente (IVA 19%)', icon: Layers },
              { id: 'unificado', label: '4. Catálogo Unificado', icon: Activity },
              { id: 'geo', label: '5. Presencia Geográfica Empresas', icon: MapPin },
              { id: 'jerarquia', label: '6. Jerarquía de Categorías', icon: FolderTree },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setBd2SubTab(st.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  bd2SubTab === st.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <st.icon className="w-3.5 h-3.5" />
                {st.label}
              </button>
            ))}
          </div>

          {/* Sub-vista 1: Inventario Crítico & Trigger 08 */}
          {bd2SubTab === 'inventario' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl text-xs text-amber-900">
                <p className="font-extrabold mb-1">
                  🔍 Definición SQL: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">vista_inventario_critico</code> + <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">trg_08_alerta_inventario_critico</code>
                </p>
                <p>
                  PostgreSQL filtra automáticamente productos con stock &le; 3 y dispara el Trigger 8
                  cuando la cantidad cae por debajo de 10 unidades, registrando la alerta en la tabla transaccional.
                </p>
              </div>

              {/* Tabla vista_inventario_critico */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  Productos en Inventario Crítico (Stock &le; 3)
                </h3>
                {inventarioData.vistaInventarioCritico?.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    No hay productos con stock crítico (&le; 3) en este momento.
                  </p>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Producto</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Stock Actual</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Estado BD2</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventarioData.vistaInventarioCritico.map((row) => (
                          <TableRow key={row.sku} hover>
                            <TableCell className="font-mono font-bold text-xs">{row.sku}</TableCell>
                            <TableCell className="text-xs font-semibold">{row.nombre}</TableCell>
                            <TableCell align="center">
                              <span className="inline-block bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                                {row.stockActual} unidades
                              </span>
                            </TableCell>
                            <TableCell align="center">
                              <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wide">
                                Crítico (&le; 3)
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>

              {/* Registro de Alertas automáticas generadas por el Trigger 8 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  Alertas Generadas por Trigger en PostgreSQL (<code className="font-mono text-xs">trg_08</code>)
                </h3>
                {inventarioData.alertasTriggerTrg08?.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">
                    Aún no se han disparado alertas de trigger en la tabla transaccional.
                  </p>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>ID Alerta</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Stock Disparador</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Mensaje Automático Trigger</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventarioData.alertasTriggerTrg08.map((a) => (
                          <TableRow key={a.idAlerta || a.id} hover>
                            <TableCell className="font-mono text-xs">#{a.idAlerta || a.id}</TableCell>
                            <TableCell className="font-mono font-bold text-xs">{a.skuProducto || 'N/A'}</TableCell>
                            <TableCell align="center" className="text-xs font-bold text-amber-700">
                              {a.cantidad}
                            </TableCell>
                            <TableCell className="text-xs text-gray-700">{a.mensaje}</TableCell>
                            <TableCell className="text-[11px] text-gray-500">
                              {a.fecha ? new Date(a.fecha).toLocaleString('es-CL') : 'Automático'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            </div>
          )}

          {/* Sub-vista 2: Rendimiento Emprendedores */}
          {bd2SubTab === 'rendimiento' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900">
                <p className="font-extrabold mb-1">
                  🔍 Definición SQL: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">vista_rendimiento_emprendedor</code>
                </p>
                <p>
                  Calcula la facturación trimestral consolidada y el conteo de transacciones exitosas
                  por cada emprendedor registrado en la tabla <code className="font-mono">usuario</code> vinculando con <code className="font-mono">venta</code> y <code className="font-mono">medio_pago</code>.
                </p>
              </div>

              {/* KPIs de Rendimiento */}
              {rendimientoData.kpisGlobales && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Total Usuarios</span>
                    <p className="text-lg font-extrabold text-gray-900">{rendimientoData.kpisGlobales.totalUsuarios}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Cuentas Pendientes</span>
                    <p className="text-lg font-extrabold text-amber-600">{rendimientoData.kpisGlobales.cuentasPendientes}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Ventas Brutas CLP</span>
                    <p className="text-lg font-extrabold text-emerald-600">{formatCurrency(rendimientoData.kpisGlobales.ventasBrutasClp || 0)}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Comisión Vento (5%)</span>
                    <p className="text-lg font-extrabold text-indigo-600">{formatCurrency(rendimientoData.kpisGlobales.comisionPlataforma5Porciento || 0)}</p>
                  </div>
                </div>
              )}

              {/* Tabla vista_rendimiento_emprendedor */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Métricas de Facturación por Emprendedor
                </h3>
                {rendimientoData.vistaRendimientoEmprendedor?.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    No se registran compras cerradas este trimestre. Al completar una orden en Checkout, se calculará aquí.
                  </p>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>RUN Emprendedor</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Nombre Emprendedor</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Facturación Trimestral</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Rango / Clasificación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rendimientoData.vistaRendimientoEmprendedor.map((r) => (
                          <TableRow key={r.run} hover>
                            <TableCell className="font-mono font-bold text-xs">{r.run}</TableCell>
                            <TableCell className="text-xs font-semibold">{r.nombre}</TableCell>
                            <TableCell align="right" className="text-xs font-extrabold text-emerald-700">
                              {formatCurrency(r.facturacionTrimestral || 0)}
                            </TableCell>
                            <TableCell align="center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                  r.rango === 'Alto'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : r.rango === 'Medio'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {r.rango || 'Bajo'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            </div>
          )}

          {/* Sub-vista 3: Facturación Cliente (IVA 19%) */}
          {bd2SubTab === 'facturas' && (
            <div className="space-y-6">
              <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl text-xs text-sky-900">
                <p className="font-extrabold mb-1">
                  🔍 Definición SQL: <code className="font-mono bg-sky-100 px-1 py-0.5 rounded">vista_factura_cliente</code>
                </p>
                <p>
                  Muestra la liquidación tributaria chilena calculada por el motor relacional:
                  <strong> Valor Neto</strong>, <strong>IVA 19%</strong> y <strong>Total Pagado</strong>,
                  vinculando las tablas <code className="font-mono">usuario</code> y <code className="font-mono">venta</code>.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Facturación Fiscal y Desglose Tributario (BD2)
                </h3>
                {facturasData.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    Aún no se registran facturas en la base de datos.
                  </p>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>ID Venta</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>RUN Cliente</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Nombre Cliente</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Valor Neto (CLP)</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">IVA (19%)</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Envío / Despacho</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Total Factura</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {facturasData.map((f) => (
                          <TableRow key={f.idVenta} hover>
                            <TableCell className="font-mono font-bold text-xs">#{f.idVenta}</TableCell>
                            <TableCell className="font-mono text-xs">{f.run}</TableCell>
                            <TableCell className="text-xs font-semibold">{f.cliente}</TableCell>
                            <TableCell align="right" className="text-xs">{formatCurrency(f.valorNeto || 0)}</TableCell>
                            <TableCell align="right" className="text-xs text-amber-700">{formatCurrency(f.impuestoIva ?? f.iva ?? 0)}</TableCell>
                            <TableCell align="right" className="text-xs text-slate-600">{formatCurrency(f.recargoEnvio || 0)}</TableCell>
                            <TableCell align="right" className="text-xs font-extrabold text-emerald-700">
                              {formatCurrency(f.totalFactura ?? f.totalPagado ?? 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            </div>
          )}

          {/* Sub-vista 4: Catálogo Unificado */}
          {bd2SubTab === 'unificado' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl text-xs text-indigo-900">
                <p className="font-extrabold mb-1">
                  🔍 Definición SQL: <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded">vista_catalogo_unificado</code>
                </p>
                <p>
                  Unifica en una sola vista polimórfica la oferta completa del marketplace (Productos físicos y Servicios profesionales),
                  resolviendo diferencias de columnas mediante el operador <code className="font-mono">UNION ALL</code> en PostgreSQL.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Matriz de Catálogo Unificado ({unificadoData.length} ítems en PostgreSQL)
                  </h3>
                  <div className="w-full sm:w-64">
                    <CustomTextField
                      size="small"
                      placeholder="Buscar por código o nombre..."
                      value={unificadoQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUnificadoQuery(val);
                        analyticsApi.getCatalogoUnificado(val).then((res) => {
                          if (res.success && Array.isArray(res.data)) setUnificadoData(res.data);
                        });
                      }}
                    />
                  </div>
                </div>

                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Código / SKU</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Título / Publicación</TableCell>
                        <TableCell sx={{ fontWeight: 800 }} align="center">Tipo de Ítem</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Detalle (Marca / Tiempo)</TableCell>
                        <TableCell sx={{ fontWeight: 800 }} align="center">Restricción Edad</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unificadoData.map((item) => (
                        <TableRow key={item.codigo} hover>
                          <TableCell className="font-mono font-bold text-xs">{item.codigo}</TableCell>
                          <TableCell className="text-xs font-semibold">{item.nombre}</TableCell>
                          <TableCell align="center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                item.tipo === 'Producto'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.tipo}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">{item.detalle || 'Estándar'}</TableCell>
                          <TableCell align="center">
                            {item.restriccionEdad ? (
                              <span className="text-[11px] font-bold text-rose-600 uppercase">+18 años</span>
                            ) : (
                              <span className="text-[11px] font-medium text-gray-400">Todo público</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </div>
          )}

          {/* Sub-vista 5: Cobertura Geográfica de Empresas */}
          {bd2SubTab === 'geo' && (
            <div className="space-y-6">
              <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl text-xs text-purple-900">
                <p className="font-extrabold mb-1">
                  🔍 Definición SQL: <code className="font-mono bg-purple-100 px-1 py-0.5 rounded">vista_geo_empresas</code>
                </p>
                <p>
                  Mapea la cobertura geográfica y superficie comunal total (km²) de las empresas
                  asociadas en el ecosistema, vinculando <code className="font-mono">empresa</code>, <code className="font-mono">direccion</code>, <code className="font-mono">comuna</code> y el catálogo en <code className="font-mono">comercializa</code>.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Presencia Geográfica y Superficie de Operación ({geoData.length} empresas activas)
                </h3>
                {geoData.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    No se registran datos geográficos para las empresas.
                  </p>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>RUT Empresa</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Razón Social / Empresa</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Giro Comercial</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Superficie Comunas (km²)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {geoData.map((g) => (
                          <TableRow key={`${g.runEmpresa}-${g.giro}`} hover>
                            <TableCell className="font-mono font-bold text-xs">{g.runEmpresa}</TableCell>
                            <TableCell className="text-xs font-semibold">{g.empresa}</TableCell>
                            <TableCell align="center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                                {g.giro}
                              </span>
                            </TableCell>
                            <TableCell align="right" className="text-xs font-mono font-bold text-purple-800">
                              {Number(g.superficieTotalComunas || 0).toLocaleString('es-CL')} km²
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            </div>
          )}

          {/* Sub-vista 6: Jerarquía de Categorías */}
          {bd2SubTab === 'jerarquia' && (
            <div className="space-y-6">
              <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-xl text-xs text-teal-900">
                <p className="font-extrabold mb-1">
                  🔍 Definición SQL: <code className="font-mono bg-teal-100 px-1 py-0.5 rounded">vista_categorias_jerarquia</code>
                </p>
                <p>
                  Estructura la taxonomía multinivel de productos y servicios modelada en la relación autorreferente
                  de subclasificación <code className="font-mono">subdivide</code> (<code className="font-mono">nombre_a_categoria</code> &rarr; <code className="font-mono">nombre_b_categoria</code>).
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-teal-600" />
                  Taxonomía y Árbol de Subdivisión de Categorías ({jerarquiaData.length} ramas registradas)
                </h3>
                {jerarquiaData.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    No se registran jerarquías de subcategorías en la tabla subdivide.
                  </p>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Categoría Padre (Nivel 1)</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Relación</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Subcategoría Hija (Nivel 2)</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Tipo Taxonomía</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {jerarquiaData.map((j, idx) => (
                          <TableRow key={`${j.categoriaPadre}-${j.subcategoria}-${idx}`} hover>
                            <TableCell className="text-xs font-bold text-gray-900">
                              📁 {j.categoriaPadre}
                            </TableCell>
                            <TableCell align="center" className="text-xs text-gray-400 font-mono">
                              &rarr;
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-teal-700">
                              📂 {j.subcategoria}
                            </TableCell>
                            <TableCell align="center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                                Subdivisión Especializada
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modal de Rechazo con Motivo Obligatorio */}
      <Dialog
        open={rejectModal.open}
        onClose={() => setRejectModal((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Rechazar {rejectModal.mode === 'cuenta' ? 'Solicitud Comercial' : 'Publicación'}
        </DialogTitle>
        <form onSubmit={handleConfirmReject}>
          <DialogContent dividers className="space-y-3">
            <p className="text-xs text-gray-600">
              Objetivo: <strong>{rejectModal.targetTitle}</strong>. Indica la observación para que
              el titular pueda corregirla.
            </p>
            <CustomTextField
              label="Motivo del rechazo"
              name="motivoRechazo"
              multiline
              rows={3}
              placeholder="Ej: Falta detallar garantía o imágenes reales del producto/servicio..."
              value={rejectModal.motivo}
              onChange={(e) => setRejectModal({ ...rejectModal, motivo: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setRejectModal((prev) => ({ ...prev, open: false }))}
              color="inherit"
            >
              Cancelar
            </Button>
            <CustomButton type="submit" variant="danger" size="sm">
              Confirmar Rechazo
            </CustomButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Crear / Editar Usuario por Administración */}
      <Dialog
        open={userModal.open}
        onClose={() => setUserModal((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {userModal.isEditing ? 'Editar Usuario y Rol' : 'Registrar Nuevo Usuario'}
        </DialogTitle>
        <form onSubmit={handleSubmitUserModal}>
          <DialogContent dividers className="space-y-4">
            <CustomTextField
              label="Nombre completo"
              name="nombre"
              value={userModal.nombre}
              onChange={(e) => setUserModal({ ...userModal, nombre: e.target.value })}
              required
            />
            <CustomTextField
              label="RUT chileno"
              name="rut"
              value={userModal.rut}
              onChange={(e) => setUserModal({ ...userModal, rut: formatRUT(e.target.value) })}
              onKeyDown={handleRutKeyDown}
              inputProps={{ maxLength: 12 }}
              helperText="Solo números y K (máx. 9 dígitos). Puntos y guion automáticos."
              required
            />
            <CustomTextField
              label="Correo electrónico"
              name="correo"
              type="email"
              value={userModal.correo}
              onChange={(e) => setUserModal({ ...userModal, correo: e.target.value })}
              required
            />
            <CustomTextField
              select
              label="Rol Principal (RBAC)"
              name="rol"
              value={userModal.rol}
              onChange={(e) => setUserModal({ ...userModal, rol: e.target.value })}
            >
              <MenuItem value={ROLES.ADMIN}>Administrador General</MenuItem>
              <MenuItem value={ROLES.VENDEDOR_PRODUCTO}>Vendedor de Productos</MenuItem>
              <MenuItem value={ROLES.PROVEEDOR_SERVICIO}>Proveedor de Servicios</MenuItem>
              <MenuItem value={ROLES.COMPRADOR}>Comprador</MenuItem>
            </CustomTextField>

            {userModal.rol !== ROLES.COMPRADOR && (
              <CustomTextField
                label="Nombre Tienda / Estudio"
                name="nombreTienda"
                value={userModal.nombreTienda}
                onChange={(e) => setUserModal({ ...userModal, nombreTienda: e.target.value })}
              />
            )}

            {!userModal.isEditing && (
              <CustomTextField
                label="Contraseña inicial (mín. 8 caracteres)"
                name="password"
                type="password"
                value={userModal.password}
                onChange={(e) => setUserModal({ ...userModal, password: e.target.value })}
                required
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setUserModal((prev) => ({ ...prev, open: false }))}
              color="inherit"
            >
              Cancelar
            </Button>
            <CustomButton type="submit" variant="primary" size="sm" isLoading={isLoading}>
              {userModal.isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
            </CustomButton>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
