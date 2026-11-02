import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuItem, Alert } from '@mui/material';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { formatCurrency, validateEmail } from '@/utils/validators';
import { REGIONES_CHILE, getComunasByRegion } from '@/utils/chileGeo';

const Checkout = () => {
  const {
    cartItems,
    subtotal,
    discountAmount,
    shippingCost,
    ivaAmount,
    finalTotal,
    recordOrder,
  } = useCart();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('VISA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [customer, setCustomer] = useState({
    correo: '',
    nombre: '',
    apellido: '',
    direccion: '',
    region: 'RM',
    ciudad: 'Santiago',
  });

  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.nombre || '').split(' ');
      const defaultAddr =
        currentUser.direcciones?.find((d) => d.esPredeterminada) ||
        currentUser.direcciones?.[0] ||
        null;

      setCustomer((prev) => ({
        ...prev,
        correo: currentUser.correo || prev.correo,
        nombre: parts[0] || prev.nombre,
        apellido: parts.slice(1).join(' ') || prev.apellido,
        direccion: defaultAddr?.calle || currentUser.direccion || prev.direccion,
        region: defaultAddr?.region || prev.region,
        ciudad: defaultAddr?.comuna || prev.ciudad,
      }));
    }
  }, [currentUser]);

  if (cartItems.length === 0) {
    return (
      <section className="max-w-lg mx-auto py-20 px-6 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          No hay artículos para procesar el pago
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Agrega productos o servicios a tu carrito antes de ir al checkout.
        </p>
        <Link to="/tienda">
          <CustomButton variant="primary">Volver a la Tienda</CustomButton>
        </Link>
      </section>
    );
  }

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleRegionChange = (e) => {
    const reg = e.target.value;
    setCustomer((prev) => ({
      ...prev,
      region: reg,
      ciudad: getComunasByRegion(reg)[0] || '',
    }));
  };

  const handlePagar = async (e) => {
    e.preventDefault();
    setError('');

    const rawDigits = cardNumber.replace(/\s/g, '');
    if (rawDigits.length < 16) {
      setError('Ingresa los 16 dígitos de tu tarjeta.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setError('Ingresa la fecha de vencimiento en formato MM/AA.');
      return;
    }
    if (cardCvv.replace(/\D/g, '').length < 3) {
      setError('Ingresa un código de seguridad (CVV) válido de 3 o 4 dígitos.');
      return;
    }
    if (!validateEmail(customer.correo)) {
      setError('Ingresa un correo electrónico válido para enviar tu comprobante.');
      return;
    }
    if (!customer.nombre.trim() || !customer.apellido.trim() || !customer.direccion.trim()) {
      setError('Completa todos los datos personales y dirección de entrega.');
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const order = recordOrder(customer);
      showToast(`¡Pago aprobado! Pedido #${order.id} registrado con éxito.`, 'success');
      navigate('/perfil?tab=pedidos');
    } catch {
      setError('Ocurrió un problema procesando el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        <Link
          to="/carrito"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Carrito
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <header className="border-b border-gray-200 px-6 sm:px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Finalizar Compra</h1>
              <p className="text-xs text-gray-500">Transacción encriptada y protegida</p>
            </div>
            <Lock className="w-5 h-5 text-green-600" aria-hidden="true" />
          </header>

          {error && (
            <div className="px-6 sm:px-8 pt-5">
              <Alert severity="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handlePagar} className="grid grid-cols-1 lg:grid-cols-2" noValidate>
            {/* Columna Izquierda: Medio de Pago y Resumen Exacto */}
            <section
              className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col"
              aria-label="Datos de tarjeta y resumen"
            >
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 mb-4">
                1. Medio de Pago
              </h2>

              <div className="flex gap-3 mb-6">
                {[
                  { id: 'VISA', label: 'VISA', style: 'text-blue-900 bg-blue-50 border-blue-200' },
                  {
                    id: 'MasterCard',
                    label: 'MasterCard',
                    style: 'text-red-700 bg-red-50 border-red-200',
                  },
                  {
                    id: 'Webpay',
                    label: 'Webpay Plus',
                    style: 'text-purple-800 bg-purple-50 border-purple-200',
                  },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`px-3.5 py-2 border rounded-xl text-xs font-extrabold transition-all ${
                      method.style
                    } ${paymentMethod === method.id ? 'ring-2 ring-gray-900' : 'opacity-65'}`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mb-8">
                <CustomTextField
                  name="cardNumber"
                  label="Número de tarjeta"
                  placeholder="4532 0158 1234 5678"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <CustomTextField
                    name="cardExpiry"
                    label="Vencimiento (MM/AA)"
                    placeholder="08/29"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    required
                  />
                  <CustomTextField
                    name="cardCvv"
                    label="CVV / Código"
                    type="password"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                  />
                </div>
              </div>

              {/* Desglose idéntico al Carrito */}
              <div className="mt-auto bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} líneas)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Descuento aplicado</span>
                    <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Despacho</span>
                  <span className="font-semibold text-gray-900">
                    {shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>IVA (19% incluido)</span>
                  <span>{formatCurrency(ivaAmount)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
                  <span className="text-base font-extrabold text-gray-900">Total a Pagar:</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>
            </section>

            {/* Columna Derecha: Datos de Despacho y Facturación */}
            <section
              className="p-6 sm:p-8 flex flex-col bg-gray-50/60"
              aria-label="Datos de envío y contacto"
            >
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 mb-4">
                2. Datos de Envío y Comprobante
              </h2>

              {currentUser?.direcciones?.length > 0 && (
                <div className="mb-4">
                  <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">
                    Usar dirección de mi libreta:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.direcciones.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() =>
                          setCustomer((prev) => ({
                            ...prev,
                            direccion: addr.calle,
                            region: addr.region,
                            ciudad: addr.comuna,
                          }))
                        }
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                          customer.direccion === addr.calle
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {addr.alias} ({addr.comuna})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <CustomTextField
                  name="correo"
                  label="Correo electrónico"
                  type="email"
                  value={customer.correo}
                  onChange={(e) => setCustomer({ ...customer, correo: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomTextField
                    name="nombre"
                    label="Nombre"
                    value={customer.nombre}
                    onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })}
                    required
                  />
                  <CustomTextField
                    name="apellido"
                    label="Apellido"
                    value={customer.apellido}
                    onChange={(e) => setCustomer({ ...customer, apellido: e.target.value })}
                    required
                  />
                </div>

                <CustomTextField
                  name="direccion"
                  label="Dirección de entrega"
                  placeholder="Calle, número, depto."
                  value={customer.direccion}
                  onChange={(e) => setCustomer({ ...customer, direccion: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomTextField
                    select
                    name="region"
                    label="Región"
                    value={customer.region}
                    onChange={handleRegionChange}
                    required
                  >
                    {REGIONES_CHILE.map((reg) => (
                      <MenuItem key={reg.codigo} value={reg.codigo}>
                        {reg.nombre}
                      </MenuItem>
                    ))}
                  </CustomTextField>

                  <CustomTextField
                    select
                    name="ciudad"
                    label="Comuna / Ciudad"
                    value={customer.ciudad}
                    onChange={(e) => setCustomer({ ...customer, ciudad: e.target.value })}
                    required
                  >
                    {getComunasByRegion(customer.region).map((comuna) => (
                      <MenuItem key={comuna} value={comuna}>
                        {comuna}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <CustomButton
                  type="submit"
                  variant="success"
                  size="lg"
                  fullWidth
                  isLoading={isProcessing}
                >
                  Confirmar y Pagar {formatCurrency(finalTotal)}
                </CustomButton>
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Compra protegida por Garantía Vento Marketplace
                </p>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
