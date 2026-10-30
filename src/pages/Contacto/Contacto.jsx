import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Users, Mail, Send, MapPin, Phone } from 'lucide-react';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useToast } from '@/context/ToastContext';
import { validateEmail } from '@/utils/validators';

const Contacto = () => {
  const [activeTab, setActiveTab] = useState('nosotros'); // 'nosotros' | 'sostenibilidad'
  const [contactForm, setContactForm] = useState({
    nombre: '',
    correo: '',
    asunto: '',
    mensaje: '',
  });
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.nombre.trim() || !validateEmail(contactForm.correo) || !contactForm.mensaje.trim()) {
      showToast('Completa tu nombre, un correo válido y tu mensaje.', 'warning');
      return;
    }
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsSending(false);
    setContactForm({ nombre: '', correo: '', asunto: '', mensaje: '' });
    showToast('¡Mensaje enviado! Nuestro equipo te responderá dentro de 24 horas.', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-6xl space-y-12">
        {/* Selector superior fiel al diseño con estados interactivos */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('nosotros')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
                activeTab === 'nosotros'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sobre Nosotros
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sostenibilidad')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
                activeTab === 'sostenibilidad'
                  ? 'bg-green-700 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sostenibilidad +Verde
            </button>
          </div>

          <div className="flex gap-3">
            <Link to="/tienda">
              <CustomButton variant="outline" size="sm">
                Ir a Tienda
              </CustomButton>
            </Link>
            <Link to="/servicios">
              <CustomButton variant="secondary" size="sm">
                Ir a Servicios
              </CustomButton>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Información institucional / Sostenibilidad */}
          <section className="lg:col-span-5 space-y-6" aria-label="Información de Vento">
            {activeTab === 'nosotros' ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                  <Users className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Conoce Vento Marketplace</h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Nacimos para conectar en una sola plataforma segura a compradores exigentes,
                  marcas oficiales, emprendedores locales y prestadores de servicios profesionales.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Mantenemos experiencias especializadas y separadas: nuestra{' '}
                  <Link to="/tienda" className="font-bold text-gray-900 underline">
                    Tienda de Productos
                  </Link>{' '}
                  con despacho a todo Chile y nuestro{' '}
                  <Link to="/servicios" className="font-bold text-sky-700 underline">
                    Directorio de Servicios
                  </Link>{' '}
                  con reservas y cotizaciones directas.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-green-200 rounded-2xl p-7 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
                  <Leaf className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Compromiso +Verde</h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Promovemos la economía circular extendiendo la vida útil de tus prendas y calzado
                  a través de nuestra red de servicios de restauración, limpieza ecológica y
                  personalización local.
                </p>
                <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
                  <li>Empaques 100% reciclables en envíos de tienda</li>
                  <li>Impulso a talleres y emprendedores regionales</li>
                  <li>Reducción de residuos textiles mediante restauración profesional</li>
                </ul>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3 text-sm text-gray-700">
              <h2 className="font-extrabold text-gray-900 text-base">Canales Directos</h2>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>contacto@vento.cl</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>+56 9 1234 5678 (Lunes a Viernes 09:00 a 18:30 hrs)</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Chile · Cobertura Nacional</span>
              </div>
            </div>
          </section>

          {/* Formulario de Contacto */}
          <section
            className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-7 sm:p-8 shadow-sm"
            aria-label="Formulario de contacto"
          >
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Envíanos un mensaje</h2>
            <p className="text-sm text-gray-500 mb-6">
              ¿Tienes dudas sobre un pedido, deseas vender como empresa o necesitas soporte?
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomTextField
                  name="nombre"
                  label="Nombre completo"
                  value={contactForm.nombre}
                  onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                  required
                />
                <CustomTextField
                  name="correo"
                  label="Correo electrónico"
                  type="email"
                  value={contactForm.correo}
                  onChange={(e) => setContactForm({ ...contactForm, correo: e.target.value })}
                  required
                />
              </div>

              <CustomTextField
                name="asunto"
                label="Asunto"
                placeholder="Ej: Consulta sobre despacho o alianza comercial"
                value={contactForm.asunto}
                onChange={(e) => setContactForm({ ...contactForm, asunto: e.target.value })}
              />

              <CustomTextField
                name="mensaje"
                label="Mensaje"
                placeholder="Escribe tu consulta aquí..."
                value={contactForm.mensaje}
                onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                multiline
                rows={4}
                required
              />

              <div className="flex justify-end pt-2">
                <CustomButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSending}
                  startIcon={<Send className="w-4 h-4" />}
                >
                  Enviar Mensaje
                </CustomButton>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contacto;
