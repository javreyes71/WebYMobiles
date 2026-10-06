import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Avatar
} from '@mui/material';
import { Edit, Delete, Add, CloudUpload } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';

const AdminUsuarios = () => {
  const [empresa, setEmpresa] = useState({
    rut: '77.777.777-7',
    nombre: 'Music On',
    sitioWeb: 'musicon.com'
  });

  const [usuarios, setUsuarios] = useState([
    { id: 1, nombre: 'Marco Cerda', rol: 'Admin', estado: 'Activo' },
    { id: 2, nombre: 'Matias Cáceres', rol: 'Admin', estado: 'Desactivado' },
  ]);

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState({ nombre: '', rol: 'Admin', estado: 'Activo' });
  const [deleteId, setDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleEmpresaChange = (e) => {
    setEmpresa({ ...empresa, [e.target.name]: e.target.value });
  };

  const handleSaveEmpresa = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast("Datos de empresa guardados", "success");
    setIsLoading(false);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentUser({ nombre: '', rol: 'Admin', estado: 'Activo' });
    setOpenForm(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setOpenForm(true);
  };

  const handleChange = (e) => {
    setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isEditing) {
      setUsuarios(usuarios.map((u) => (u.id === currentUser.id ? currentUser : u)));
      showToast("Administrador actualizado", "success");
    } else {
      setUsuarios([...usuarios, { ...currentUser, id: Date.now() }]);
      showToast("Administrador creado", "success");
    }
    
    setIsLoading(false);
    setOpenForm(false);
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsuarios(usuarios.filter((u) => u.id !== deleteId));
    showToast("Administrador eliminado", "info");
    setIsLoading(false);
    setOpenDelete(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Perfil de Empresa y Administradores</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel Datos de empresa */}
        <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Datos de empresa</h2>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">RUT</label>
                <TextField name="rut" value={empresa.rut} onChange={handleEmpresaChange} fullWidth size="small" className="bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre</label>
                <TextField name="nombre" value={empresa.nombre} onChange={handleEmpresaChange} fullWidth size="small" className="bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Sitio Web</label>
                <TextField name="sitioWeb" value={empresa.sitioWeb} onChange={handleEmpresaChange} fullWidth size="small" className="bg-white" />
              </div>
            </div>

            <div className="flex flex-col items-center pt-6">
              <span className="text-xs font-semibold text-gray-700 mb-2">Logo de Empresa</span>
              <div className="w-32 h-32 bg-gray-200 border-2 border-dashed border-gray-400 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                <CloudUpload className="text-gray-500 mb-2" fontSize="large" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="contained" 
              onClick={handleSaveEmpresa}
              disabled={isLoading}
              sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, fontWeight: 'bold' }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'GUARDAR'}
            </Button>
          </div>
        </div>

        {/* Panel Administradores */}
        <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Administradores</h2>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleOpenCreate}
              size="small"
              sx={{ bgcolor: '#6b7280', '&:hover': { bgcolor: '#4b5563' }, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              + AÑADIR ADMIN
            </Button>
          </div>

          <TableContainer component={Paper} elevation={0} variant="outlined" className="bg-white">
            <Table size="small">
              <TableHead className="bg-gray-200">
                <TableRow>
                  <TableCell className="font-bold">Nombre</TableCell>
                  <TableCell className="font-bold">Rol</TableCell>
                  <TableCell className="font-bold">Estado</TableCell>
                  <TableCell className="font-bold text-center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>{user.nombre.charAt(0)}</Avatar>
                        {user.nombre}
                      </div>
                    </TableCell>
                    <TableCell>{user.rol}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${user.estado === 'Activo' ? 'text-gray-800 font-semibold' : 'text-gray-500 italic'}`}>
                        {user.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <IconButton onClick={() => handleOpenEdit(user)} size="small">
                        <Edit fontSize="small" className="text-gray-600" />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDelete(user.id)} size="small">
                        <Delete fontSize="small" className="text-gray-600" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

      </div>

      {/* CREATE / UPDATE Modal */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold">{isEditing ? 'Editar Admin' : 'Nuevo Admin'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            <TextField label="Nombre" name="nombre" value={currentUser.nombre} onChange={handleChange} fullWidth required size="small" />
            
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={currentUser.estado} onChange={handleChange} label="Estado">
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Desactivado">Desactivado</MenuItem>
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenForm(false)} color="inherit" disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSubmitForm} variant="contained" sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE Modal */}
      <Dialog open={openDelete} onClose={() => !isLoading && setOpenDelete(false)}>
        <DialogTitle className="font-bold">Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <p className="text-gray-600">¿Estás seguro que deseas eliminar a este administrador?</p>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenDelete(false)} color="inherit" disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
