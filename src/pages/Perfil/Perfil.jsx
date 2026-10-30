import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Paper } from '@mui/material';
import { User, Package, FileText, Heart, Trash2 } from 'lucide-react';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { getInitials, formatRUT, formatCurrency } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';

const Perfil = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { orders } = useCart();
  const { productos, servicios, wishlistIds, toggleWishlist, quotes } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

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
    if (res.success) {
      setIsEditing(false);
    }
  };

  const allCatalog = [...productos, ...servicios];
  const wishlistItems = allCatalog.filter((item) => wishlistIds.includes(item.id));

  const tabs = [
    { id: 'datos', label: 'Datos Personales', icon: User },
    { id: 'pedidos', label: `Mis Pedidos (${orders.length})`, icon: Package },
    { id: 'cotizaciones', label: `Mis Cotizaciones (${quotes.length})`, icon: FileText },
    { id: 'favoritos', label: `Favoritos (${wishlistItems.length})`, icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Mi Cuenta</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Columna Izquierda: Tarjeta Usuario y Navegación */}
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
                {currentUser?.rol || 'Cliente'} · {currentUser?.tipoCuenta || 'Personal'}
              </span>
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

          {/* Columna Derecha: Contenido de la pestaña */}
          <section className="md:col-span-8">
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
                    label="Dirección de Envío"
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

            {activeTab === 'pedidos' && (
              <Paper elevation={0} className="p-6 sm:p-8 border border-gray-200 rounded-2xl">
                <h2 className="text-lg font-extrabold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                  Historial de Pedidos ({orders.length})
                </h2>

                {orders.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    Aún no registras pedidos.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                          <div>
                            <p className="font-extrabold text-sm text-gray-900">
                              Pedido #{order.id}
                            </p>
                            <p className="text-xs text-gray-500">Realizado el {order.fecha}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-base text-gray-900">
                              {formatCurrency(order.total)}
                            </p>
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${
                                order.estado === 'Entregado'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {order.estado}
                            </span>
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <ul className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                            {order.items.map((it, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>
                                  {it.quantity} × {it.title}
                                </span>
                                <span className="font-semibold">
                                  {formatCurrency(it.price * it.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Paper>
            )}

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

                {quotes.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No has solicitado cotizaciones de servicios todavía.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 bg-slate-50 rounded-xl border border-sky-100"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div>
                            <span className="text-xs font-extrabold text-sky-700">{q.id}</span>
                            <h3 className="text-sm font-bold text-gray-900">{q.servicioNombre}</h3>
                            <span className="text-xs text-gray-500">
                              Proveedor: {q.proveedor} · Modalidad: {q.modalidadPreferida}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                            {q.estado}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mt-2 bg-white p-3 rounded-lg border border-gray-100">
                          {q.detalles}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Paper>
            )}

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
                              <span
                                className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-0.5 ${
                                  isService
                                    ? 'bg-sky-100 text-sky-700'
                                    : 'bg-gray-200 text-gray-800'
                                }`}
                              >
                                {item.tipo}
                              </span>
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
