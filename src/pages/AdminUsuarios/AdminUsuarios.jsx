import React, { useState } from 'react';
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
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombre: 'Javier Reyes', rut: '12.345.678-9', email: 'javier@vento.cl', rol: 'Admin' },
    { id: 2, nombre: 'María Silva', rut: '19.876.543-2', email: 'maria@vento.cl', rol: 'Cliente' },
    { id: 3, margin: 'Pedro Pascal', rut: '15.555.444-3', email: 'pedro@vento.cl', rol: 'Cliente' },
  ]);

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState({ nombre: '', rut: '', email: '', rol: 'Cliente' });
  const [deleteId, setDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentUser({ nombre: '', rut: '', email: '', rol: 'Cliente' });
    setOpenForm(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setOpenForm(true);
  };

  // Manejar cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser({ ...currentUser, [name]: value });
  };

  // Enviar formulario (Simula asincronía Fase 3)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula latencia

    if (isEditing) {
      console.log('Actualizando usuario (Update):', currentUser);
      setUsuarios(usuarios.map((u) => (u.id === currentUser.id ? currentUser : u)));
      showToast("Usuario actualizado con éxito", "success");
    } else {
      const nuevoUser = { ...currentUser, id: Date.now() };
      console.log('Creando nuevo usuario (Create):', nuevoUser);
      setUsuarios([...usuarios, nuevoUser]);
      showToast("Usuario creado con éxito", "success");
    }
    
    setIsLoading(false);
    setOpenForm(false);
  };

  // Manejo de eliminación
  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula latencia

    console.log('Eliminando usuario con ID (Delete):', deleteId);
    setUsuarios(usuarios.filter((u) => u.id !== deleteId));
    showToast("Usuario eliminado correctamente", "info");
    
    setIsLoading(false);
    setOpenDelete(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wider">Gestión de Usuarios</h1>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleOpenCreate}
          sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block">
        <TableContainer component={Paper} elevation={0} variant="outlined" className="mb-8">
          <Table sx={{ minWidth: 650 }}>
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell className="font-bold">ID</TableCell>
                <TableCell className="font-bold">Nombre</TableCell>
                <TableCell className="font-bold">RUT</TableCell>
                <TableCell className="font-bold">Email</TableCell>
                <TableCell className="font-bold">Rol</TableCell>
                <TableCell className="font-bold text-center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.nombre || user.margin}</TableCell>
                  <TableCell>{user.rut}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.rol === 'Admin' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {user.rol}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <IconButton color="secondary" onClick={() => handleOpenEdit(user)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleOpenDelete(user.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Vista Mobile: Tarjetas */}
      <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
        {usuarios.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-800">{user.nombre || user.margin}</h3>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${user.rol === 'Admin' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>
                {user.rol}
              </span>
            </div>
            <div className="text-sm text-gray-700 mt-2">
              <p><strong>RUT:</strong> {user.rut}</p>
            </div>
            <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-100">
              <div>
                <IconButton color="secondary" onClick={() => handleOpenEdit(user)} size="small">
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={() => handleOpenDelete(user.id)} size="small">
                  <Delete fontSize="small" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / UPDATE Modal */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold border-b border-gray-200">
          {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <form onSubmit={handleSubmitForm}>
          <DialogContent className="space-y-4 mt-2">
            <TextField
              label="Nombre Completo"
              name="nombre"
              value={currentUser.nombre}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
            <TextField
              label="RUT"
              name="rut"
              value={currentUser.rut}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
            <TextField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={currentUser.email}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Rol</InputLabel>
              <Select
                name="rol"
                value={currentUser.rol}
                label="Rol"
                onChange={handleChange}
              >
                <MenuItem value="Cliente">Cliente</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions className="p-4 border-t border-gray-200">
            <Button onClick={() => setOpenForm(false)} color="inherit" disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading} sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}>
              {isLoading ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Guardar Cambios' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE Modal */}
      <Dialog open={openDelete} onClose={() => !isLoading && setOpenDelete(false)}>
        <DialogTitle className="font-bold">Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <p className="text-gray-600">¿Estás seguro que deseas eliminar este usuario? No podrá volver a iniciar sesión.</p>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenDelete(false)} color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
