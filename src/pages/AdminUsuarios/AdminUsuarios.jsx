import React, { useState, useRef } from 'react';
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
  Button,
  CircularProgress,
  MenuItem,
  Avatar,
} from '@mui/material';
import { Edit, Delete, Add, CloudUpload } from '@mui/icons-material';
import CustomTextField from '@/components/atoms/TextField/CustomTextField';
import CustomButton from '@/components/atoms/Button/CustomButton';
import { useToast } from '@/context/ToastContext';
import { storageApi } from '@/services/api';
import { validateRUT, formatRUT, validateEmail } from '@/utils/validators';

const AdminUsuarios = () => {
  const logoInputRef = useRef(null);
  const [empresa, setEmpresa] = useState(() => storageApi.getCompany());
  const [usuarios, setUsuarios] = useState(() => storageApi.getAdmins());

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState({
    nombre: '',
    correo: '',
    rol: 'Admin',
    estado: 'Activo',
  });
  const [deleteId, setDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleEmpresaChange = (e) => {
    const { name, value } = e.target;
    setEmpresa((prev) => ({
      ...prev,
      [name]: name === 'rut' ? formatRUT(value) : value,
    }));
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

  const handleSaveEmpresa = async (e) => {
    e.preventDefault();
    if (!validateRUT(empresa.rut)) {
      showToast('El RUT de la empresa no es válido.', 'error');
      return;
    }
    if (!empresa.nombre.trim()) {
      showToast('El nombre de la empresa es obligatorio.', 'error');
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    storageApi.saveCompany(empresa);
    showToast('Datos de empresa guardados correctamente.', 'success');
    setIsLoading(false);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentAdmin({ nombre: '', correo: '', rol: 'Admin', estado: 'Activo' });
    setOpenForm(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setCurrentAdmin(user);
    setOpenForm(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!currentAdmin.nombre.trim()) {
      showToast('Ingresa el nombre del administrador.', 'warning');
      return;
    }
    if (currentAdmin.correo && !validateEmail(currentAdmin.correo)) {
      showToast('Ingresa un correo electrónico válido.', 'warning');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    let nextList;
    if (isEditing) {
      nextList = usuarios.map((u) => (u.id === currentAdmin.id ? currentAdmin : u));
      showToast('Administrador actualizado.', 'success');
    } else {
      nextList = [...usuarios, { ...currentAdmin, id: Date.now() }];
      showToast('Administrador creado.', 'success');
    }

    setUsuarios(nextList);
    storageApi.saveAdmins(nextList);
    setIsLoading(false);
    setOpenForm(false);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const nextList = usuarios.filter((u) => u.id !== deleteId);
    setUsuarios(nextList);
    storageApi.saveAdmins(nextList);
    showToast('Administrador eliminado.', 'info');
    setIsLoading(false);
    setOpenDelete(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 my-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Perfil de Empresa y Administradores
        </h1>
        <p className="text-sm text-gray-500">
          Configura la identidad comercial y los accesos administrativos
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel Datos de Empresa */}
        <section
          className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-sm"
          aria-label="Datos corporativos"
        >
          <h2 className="text-lg font-extrabold text-gray-900 mb-6">Datos de Empresa</h2>

          <form onSubmit={handleSaveEmpresa}>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <CustomTextField
                  name="rut"
                  label="RUT Empresa"
                  value={empresa.rut}
                  onChange={handleEmpresaChange}
                  required
                />
                <CustomTextField
                  name="nombre"
                  label="Razón Social / Nombre"
                  value={empresa.nombre}
                  onChange={handleEmpresaChange}
                  required
                />
                <CustomTextField
                  name="sitioWeb"
                  label="Sitio Web"
                  value={empresa.sitioWeb}
                  onChange={handleEmpresaChange}
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
                  aria-label="Subir logo de empresa"
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
                      <CloudUpload className="text-gray-400 mb-1" fontSize="large" />
                      <span className="text-[11px] text-gray-500">Subir logo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <CustomButton type="submit" variant="success" isLoading={isLoading}>
                Guardar Datos
              </CustomButton>
            </div>
          </form>
        </section>

        {/* Panel Administradores */}
        <section
          className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-sm"
          aria-label="Listado de administradores"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-extrabold text-gray-900">Administradores</h2>
            <CustomButton
              variant="primary"
              size="sm"
              startIcon={<Add fontSize="small" />}
              onClick={handleOpenCreate}
            >
              Añadir Admin
            </CustomButton>
          </div>

          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: '#111827' }}>
                          {user.nombre.charAt(0)}
                        </Avatar>
                        <div>
                          <span className="font-semibold text-gray-900 block text-sm">
                            {user.nombre}
                          </span>
                          {user.correo && (
                            <span className="text-xs text-gray-400">{user.correo}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.rol}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          user.estado === 'Activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.estado}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleOpenEdit(user)}
                        size="small"
                        aria-label={`Editar administrador ${user.nombre}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setDeleteId(user.id);
                          setOpenDelete(true);
                        }}
                        size="small"
                        color="error"
                        aria-label={`Eliminar administrador ${user.nombre}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </section>
      </div>

      {/* Modal Crear / Editar Admin */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isEditing ? 'Editar Administrador' : 'Nuevo Administrador'}
        </DialogTitle>
        <form onSubmit={handleSubmitForm}>
          <DialogContent dividers className="space-y-4">
            <CustomTextField
              label="Nombre completo"
              name="nombre"
              value={currentAdmin.nombre}
              onChange={(e) => setCurrentAdmin({ ...currentAdmin, nombre: e.target.value })}
              required
            />
            <CustomTextField
              label="Correo electrónico"
              name="correo"
              type="email"
              value={currentAdmin.correo || ''}
              onChange={(e) => setCurrentAdmin({ ...currentAdmin, correo: e.target.value })}
            />
            <CustomTextField
              select
              label="Estado"
              name="estado"
              value={currentAdmin.estado}
              onChange={(e) => setCurrentAdmin({ ...currentAdmin, estado: e.target.value })}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Desactivado">Desactivado</MenuItem>
            </CustomTextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenForm(false)} color="inherit" disabled={isLoading}>
              Cancelar
            </Button>
            <CustomButton type="submit" variant="primary" size="sm" isLoading={isLoading}>
              {isEditing ? 'Actualizar' : 'Crear'}
            </CustomButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Eliminar Admin */}
      <Dialog open={openDelete} onClose={() => !isLoading && setOpenDelete(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de eliminar a este administrador de la empresa?
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDelete(false)} color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
