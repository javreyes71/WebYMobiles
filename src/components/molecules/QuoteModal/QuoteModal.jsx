import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
} from '@mui/material';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { validateEmail } from '@/utils/validators';

const QuoteModal = ({ isOpen, onClose, service }) => {
  const { currentUser } = useAuth();
  const { submitServiceQuote } = useProducts();

  const [formData, setFormData] = useState({
    nombreContacto: '',
    correoContacto: '',
    telefonoContacto: '',
    fechaDeseada: '',
    modalidadPreferida: 'Presencial',
    detalles: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombreContacto: currentUser?.nombre || '',
        correoContacto: currentUser?.correo || '',
        telefonoContacto: currentUser?.telefono || '',
        fechaDeseada: '',
        modalidadPreferida: service?.modalidad || 'Presencial',
        detalles: '',
      });
      setError('');
    }
  }, [isOpen, currentUser, service]);

  if (!service) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombreContacto.trim()) {
      setError('Ingresa tu nombre de contacto.');
      return;
    }
    if (!validateEmail(formData.correoContacto)) {
      setError('Ingresa un correo electrónico válido para recibir la cotización.');
      return;
    }
    if (!formData.detalles.trim() || formData.detalles.trim().length < 10) {
      setError('Describe brevemente lo que necesitas (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);
    await submitServiceQuote({
      servicioId: service.id,
      servicioNombre: service.title || service.nombre,
      proveedor: service.vendedorNombre || service.brand,
      precioReferencial: service.price,
      ...formData,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={() => !isSubmitting && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Solicitar Cotización de Servicio
        <span className="block text-xs font-medium text-sky-700 mt-0.5">
          {service.title || service.nombre} · {service.vendedorNombre || service.brand}
        </span>
      </DialogTitle>

      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers className="space-y-4">
          {error && <Alert severity="error">{error}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTextField
              name="nombreContacto"
              label="Tu nombre"
              value={formData.nombreContacto}
              onChange={handleChange}
              required
            />
            <CustomTextField
              name="correoContacto"
              label="Correo electrónico"
              type="email"
              value={formData.correoContacto}
              onChange={handleChange}
              required
            />
            <CustomTextField
              name="telefonoContacto"
              label="Teléfono / WhatsApp"
              placeholder="+56 9 1234 5678"
              value={formData.telefonoContacto}
              onChange={handleChange}
            />
            <CustomTextField
              name="fechaDeseada"
              label="Fecha estimada"
              type="date"
              value={formData.fechaDeseada}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <CustomTextField
            select
            name="modalidadPreferida"
            label="Modalidad preferida"
            value={formData.modalidadPreferida}
            onChange={handleChange}
          >
            <MenuItem value="Presencial">Presencial</MenuItem>
            <MenuItem value="Online">Online / Remoto</MenuItem>
            <MenuItem value="A domicilio">A domicilio / En ubicación del evento</MenuItem>
          </CustomTextField>

          <CustomTextField
            name="detalles"
            label="Requerimientos y detalles de tu solicitud"
            placeholder="Indica cantidad, medidas, duración, ubicación u objetivos del servicio..."
            value={formData.detalles}
            onChange={handleChange}
            multiline
            rows={4}
            required
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <CustomButton variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </CustomButton>
          <CustomButton type="submit" variant="secondary" isLoading={isSubmitting}>
            Enviar solicitud de cotización
          </CustomButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuoteModal;
