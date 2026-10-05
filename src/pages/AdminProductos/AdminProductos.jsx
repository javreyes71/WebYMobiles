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
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import CustomButton from '../../components/atoms/Button/CustomButton';
import { useToast } from '../../context/ToastContext';

const AdminProductos = () => {
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Zapatilla Retro', precio: 50000, stock: 15, categoria: 'Zapatos' },
    { id: 2, nombre: 'Polera Básica Negra', precio: 15000, stock: 30, categoria: 'Ropa' },
    { id: 3, nombre: 'Gorro Invierno', precio: 12000, stock: 10, categoria: 'Accesorios' },
  ]);

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProd, setCurrentProd] = useState({ nombre: '', precio: '', stock: '', categoria: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentProd({ nombre: '', precio: '', stock: '', categoria: '' });
    setOpenForm(true);
  };

  const handleOpenEdit = (prod) => {
    setIsEditing(true);
    setCurrentProd(prod);
    setOpenForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProd({ ...currentProd, [name]: value });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isEditing) {
      console.log('Actualizando producto (Update):', currentProd);
      setProductos(productos.map((p) => (p.id === currentProd.id ? currentProd : p)));
      showToast("Producto actualizado correctamente", "success");
    } else {
      const nuevoProd = { ...currentProd, id: Date.now() };
      console.log('Creando producto (Create):', nuevoProd);
      setProductos([...productos, nuevoProd]);
      showToast("Producto creado correctamente", "success");
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

    console.log('Eliminando producto con ID (Delete):', deleteId);
    setProductos(productos.filter((p) => p.id !== deleteId));
    showToast("Producto eliminado", "info");
    
    setIsLoading(false);
    setOpenDelete(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wider">Gestión de Productos</h1>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />} 
          onClick={handleOpenCreate}
          sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
        >
          Nuevo Producto
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
                <TableCell className="font-bold">Categoría</TableCell>
                <TableCell className="font-bold text-right">Precio</TableCell>
                <TableCell className="font-bold text-right">Stock</TableCell>
                <TableCell className="font-bold text-center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((prod) => (
                <TableRow key={prod.id} hover>
                  <TableCell>{prod.id}</TableCell>
                  <TableCell>{prod.nombre}</TableCell>
                  <TableCell>{prod.categoria}</TableCell>
                  <TableCell className="text-right">${prod.precio}</TableCell>
                  <TableCell className="text-right">{prod.stock}</TableCell>
                  <TableCell className="text-center">
                    <IconButton color="secondary" onClick={() => handleOpenEdit(prod)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleOpenDelete(prod.id)}>
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
        {productos.map((prod) => (
          <div key={prod.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                <span className="text-xs font-semibold text-gray-500 uppercase">{prod.categoria}</span>
              </div>
              <span className="font-bold text-lg text-gray-900">${prod.precio}</span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600">Stock: <span className="font-bold">{prod.stock}</span></span>
              <div>
                <IconButton color="secondary" onClick={() => handleOpenEdit(prod)} size="small">
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={() => handleOpenDelete(prod.id)} size="small">
                  <Delete fontSize="small" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={openForm} onClose={() => !isLoading && setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold border-b border-gray-200">
          {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </DialogTitle>
        <form onSubmit={handleSubmitForm}>
          <DialogContent className="space-y-4 mt-2">
            <TextField
              label="Nombre del Producto"
              name="nombre"
              value={currentProd.nombre}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
            <TextField
              label="Categoría"
              name="categoria"
              value={currentProd.categoria}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
            <div className="flex gap-4">
              <TextField
                label="Precio ($)"
                name="precio"
                type="number"
                value={currentProd.precio}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
              />
              <TextField
                label="Stock"
                name="stock"
                type="number"
                value={currentProd.stock}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
              />
            </div>
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

      <Dialog open={openDelete} onClose={() => !isLoading && setOpenDelete(false)}>
        <DialogTitle className="font-bold">Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <p className="text-gray-600">¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
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

export default AdminProductos;
