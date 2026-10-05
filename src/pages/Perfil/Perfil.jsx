import React, { useState } from 'react';
import { TextField, Button, Avatar, Divider, Paper } from '@mui/material';
import { getInitials } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';

const Perfil = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser } = useAuth();
  
  // Si no hay usuario en sesión, mostramos datos de prueba
  const user = currentUser || { 
    nombre: 'Javier Reyes', 
    rut: '12.345.678-9', 
    correo: 'javier@vento.cl',
    telefono: '+56 9 1234 5678',
    direccion: 'Av. Siempre Viva 123, Santiago'
  };

  const [formData, setFormData] = useState(user);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log('Datos de perfil actualizados:', formData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 uppercase tracking-wider">Mi Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna Izquierda: Avatar y Resumen */}
          <div className="md:col-span-1">
            <Paper elevation={0} className="p-6 flex flex-col items-center border border-gray-200 text-center">
              <Avatar sx={{ width: 100, height: 100, bgcolor: '#000', fontSize: '2rem', mb: 2 }}>
                {getInitials(formData.nombre)}
              </Avatar>
              <h2 className="text-xl font-bold text-gray-800">{formData.nombre}</h2>
              <p className="text-sm text-gray-500 mb-4">{formData.correo}</p>
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ color: '#000', borderColor: '#000', '&:hover': { borderColor: '#333', bgcolor: '#f9fafb' } }}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar Edición' : 'Editar Perfil'}
              </Button>
            </Paper>
          </div>

          {/* Columna Derecha: Formulario de Datos */}
          <div className="md:col-span-2">
            <Paper elevation={0} className="p-8 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Información Personal</h3>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <TextField
                    label="Nombre Completo"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="RUT"
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Correo Electrónico"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
                
                <TextField
                  label="Dirección de Envío"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  disabled={!isEditing}
                  fullWidth
                  size="small"
                />

                {isEditing && (
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      variant="contained" 
                      sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </form>
            </Paper>

            {/* Historial de Pedidos */}
            <Paper elevation={0} className="p-8 mt-8 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Mis Pedidos Recientes</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="font-bold text-sm">Pedido #10045</p>
                    <p className="text-xs text-gray-500">Realizado el 02 de Octubre, 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">$65.000</p>
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-800 rounded-full uppercase tracking-wide">
                      Entregado
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="font-bold text-sm">Pedido #10089</p>
                    <p className="text-xs text-gray-500">Realizado el 05 de Octubre, 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">$15.000</p>
                    <span className="px-2 py-1 text-[10px] font-bold bg-yellow-100 text-yellow-800 rounded-full uppercase tracking-wide">
                      En Tránsito
                    </span>
                  </div>
                </div>
              </div>
            </Paper>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
