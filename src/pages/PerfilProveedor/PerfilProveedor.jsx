import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Avatar } from '@mui/material';
import {
  Briefcase,
  CheckCircle2,
  MapPin,
  Star,
  Award,
  Clock,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import ServiceCard from '@/components/molecules/ServiceCard/ServiceCard';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useProducts } from '@/context/ProductContext';
import { usersApi } from '@/services/api';
import { getInitials } from '@/utils/validators';

/**
 * Perfil Profesional Público de Proveedor de Servicios (/servicios/proveedor/:id)
 * Exclusivo para la oferta de servicios profesionales (separado de venta de productos).
 */
const PerfilProveedor = () => {
  const { id } = useParams();
  const { servicios } = useProducts();
  const [selectedModalidad, setSelectedModalidad] = useState('Todas');

  const providerRecord = useMemo(() => usersApi.getPublicUserById(id), [id]);

  const providerServices = useMemo(
    () =>
      servicios.filter(
        (s) => String(s.ownerId || s.proveedorId || 3) === String(id)
      ),
    [servicios, id]
  );

  const studioName =
    providerRecord?.nombreTienda ||
    providerServices[0]?.vendedorNombre ||
    providerRecord?.nombre ||
    'Estudio Profesional Vento';

  const specialty =
    providerRecord?.especialidad ||
    providerServices[0]?.categoria ||
    'Servicios Especializados Verificados';

  const bio =
    providerRecord?.biografiaTienda ||
    'Profesional acreditado en el Directorio de Servicios de Vento Marketplace con atención personalizada y garantía de satisfacción.';

  const locationText =
    providerRecord?.ciudadBase || providerRecord?.direccion || 'Atención Presencial y Online · Chile';

  const experienceYears = providerRecord?.experienciaAnios || 5;
  const certifications = providerRecord?.certificaciones || [
    'Prestador Verificado por Vento Marketplace',
    'Garantía Técnica de Satisfacción',
  ];

  const isVerified = Boolean(
    providerRecord?.verificado || providerServices.some((s) => s.verificado)
  );

  const avgRating = useMemo(() => {
    if (providerServices.length === 0) return '5.0';
    const sum = providerServices.reduce((acc, s) => acc + Number(s.rating || 4.9), 0);
    return (sum / providerServices.length).toFixed(1);
  }, [providerServices]);

  const modalidades = useMemo(() => {
    const mods = new Set(providerServices.map((s) => s.modalidad).filter(Boolean));
    return ['Todas', ...Array.from(mods)];
  }, [providerServices]);

  const filteredServices = useMemo(() => {
    if (selectedModalidad === 'Todas') return providerServices;
    return providerServices.filter((s) => s.modalidad === selectedModalidad);
  }, [providerServices, selectedModalidad]);

  if (!providerRecord && providerServices.length === 0) {
    return (
      <section className="max-w-lg mx-auto py-20 px-6 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Perfil profesional no encontrado
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          No existen servicios activos asociados al prestador consultado.
        </p>
        <Link to="/servicios">
          <CustomButton variant="secondary">Volver al Directorio de Servicios</CustomButton>
        </Link>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-6 max-w-6xl space-y-8">
        <Link
          to="/servicios"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Directorio de Servicios
        </Link>

        {/* Cabecera Profesional */}
        <header className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-sky-900 via-slate-900 to-sky-700" />
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 mb-5">
              <div className="flex items-end gap-4">
                <Avatar
                  sx={{
                    width: 88,
                    height: 88,
                    bgcolor: '#0369a1',
                    border: '4px solid #ffffff',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                  }}
                >
                  {getInitials(studioName)}
                </Avatar>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-gray-900">{studioName}</h1>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Profesional Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-sky-700 mt-0.5">{specialty}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    {locationText}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-sky-50/70 border border-sky-100 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-gray-900">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {avgRating}
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-sky-800">
                    Valoración
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-sky-50/70 border border-sky-100 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-gray-900">
                    <Clock className="w-4 h-4 text-sky-700" />
                    +{experienceYears} años
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-sky-800">
                    Experiencia
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-sky-50/70 border border-sky-100 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm font-extrabold text-gray-900">
                    <Briefcase className="w-4 h-4 text-sky-700" />
                    {providerServices.length}
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-sky-800">
                    Servicios
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed max-w-3xl mb-5">{bio}</p>

            {/* Certificaciones y respaldos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-gray-100">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-sky-600" /> Credenciales y Especialidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {certificacionesList(certifications).map((cert, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-full"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center md:justify-end">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Pagos y cotizaciones respaldados por Garantía Vento Servicios
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Portafolio de Servicios del Proveedor */}
        <section aria-label="Portafolio de servicios profesionales">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              Portafolio de Servicios ({filteredServices.length})
            </h2>

            {modalidades.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {modalidades.map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModalidad(mod)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      selectedModalidad === mod
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-sky-200 text-gray-700 hover:bg-sky-50'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-100 p-10 text-center">
              <p className="text-sm text-gray-500">
                Este proveedor no tiene servicios aprobados en la modalidad seleccionada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((srv) => (
                <ServiceCard key={srv.id} {...srv} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

function certificacionesList(raw) {
  if (Array.isArray(raw) && raw.length > 0) return raw;
  return ['Prestador Verificado Vento'];
}

export default PerfilProveedor;
