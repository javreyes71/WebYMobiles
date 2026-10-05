import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress,
  Menu, MenuItem, Select, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio, Box
} from '@mui/material';
import { Edit, Delete, Add, KeyboardArrowDown, CloudUpload } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';
import { useProducts } from '../../context/ProductContext';

const AdminProductos = () => {
  const location = useLocation();
  const { productos, addProducto, updateProducto, deleteProducto } = useProducts();

  const [view, setView] = useState('list'); // 'list' | 'form-producto' | 'form-servicio'
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (location.state?.initialView) {
      setView(location.state.initialView);
      setIsEditing(false);
      if (location.state.initialView === 'form-servicio') {
        setCurrentItem({ tipo: 'Servicio', nombre: '', sku: '', tiempoEstimado: '', categoria: '', descripcion: '', restriccionEdad: 'no', permiteCotizacion: 'no', precio: '' });
      } else {
        setCurrentItem({ tipo: 'Producto', nombre: '', sku: '', marca: '', categoria: '', descripcion: '', restriccionEdad: 'no', precio: '' });
      }
    }
  }, [location.state]);

  // Menu "Añadir"
  const [anchorEl, setAnchorEl] = useState(null);
  const openAddMenu = Boolean(anchorEl);

  const handleOpenAddMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseAddMenu = () => setAnchorEl(null);

  const handleCreateProduct = () => {
    handleCloseAddMenu();
    setIsEditing(false);
    setCurrentItem({ tipo: 'Producto', nombre: '', sku: '', marca: '', categoria: '', descripcion: '', restriccionEdad: 'no', precio: '' });
    setView('form-producto');
  };

  const handleCreateService = () => {
    handleCloseAddMenu();
    setIsEditing(false);
    setCurrentItem({ tipo: 'Servicio', nombre: '', sku: '', tiempoEstimado: '', categoria: '', descripcion: '', restriccionEdad: 'no', permiteCotizacion: 'no', precio: '' });
    setView('form-servicio');
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setView(item.tipo === 'Servicio' ? 'form-servicio' : 'form-producto');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isEditing) {
      console.log(`Actualizando ${currentItem.tipo}:`, currentItem);
      updateProducto(currentItem);
      showToast(`${currentItem.tipo} actualizado correctamente`, "success");
    } else {
      console.log(`Creando ${currentItem.tipo}:`, currentItem);
      addProducto(currentItem);
      showToast(`${currentItem.tipo} creado correctamente`, "success");
    }
    
    setIsLoading(false);
    setView('list');
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    deleteProducto(deleteId);
    showToast("Ítem eliminado", "info");
    setIsLoading(false);
    setOpenDelete(false);
  };

  // --- RENDERIZADO CONDICIONAL DE VISTAS ---

  if (view === 'form-producto' || view === 'form-servicio') {
    const isService = view === 'form-servicio';
    return (
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? `Editar ${isService ? 'Servicio' : 'Producto'}` : `Agregar ${isService ? 'Servicio' : 'Producto'}`}
          </h1>
          <Button variant="outlined" onClick={() => setView('list')} disabled={isLoading}>Volver</Button>
        </div>

        <form onSubmit={handleSubmitForm} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">1. Información básica</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna Izquierda (Campos) */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextField label={`Nombre de ${isService ? 'Servicio' : 'Producto'}`} name="nombre" value={currentItem.nombre} onChange={handleChange} fullWidth required size="small" />
                <TextField label="SKU" name="sku" value={currentItem.sku || ''} onChange={handleChange} fullWidth size="small" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isService ? (
                  <TextField label="Tiempo estimado" name="tiempoEstimado" value={currentItem.tiempoEstimado || ''} onChange={handleChange} fullWidth size="small" placeholder="Ej: 120-180 minutos" />
                ) : (
                  <TextField label="Marca" name="marca" value={currentItem.marca || ''} onChange={handleChange} fullWidth size="small" />
                )}
                <FormControl size="small" fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select name="categoria" value={currentItem.categoria || ''} onChange={handleChange} label="Categoría">
                    <MenuItem value="Zapatos">Zapatos</MenuItem>
                    <MenuItem value="Ropa">Ropa</MenuItem>
                    <MenuItem value="Accesorios">Accesorios</MenuItem>
                    <MenuItem value="Instrumentos musicales">Instrumentos musicales</MenuItem>
                    <MenuItem value="Servicios musicales">Servicios musicales</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <TextField label="Descripción" name="descripcion" value={currentItem.descripcion || ''} onChange={handleChange} fullWidth multiline rows={3} size="small" />

              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Restricción de edad:</span>
                  <RadioGroup row name="restriccionEdad" value={currentItem.restriccionEdad} onChange={handleChange}>
                    <FormControlLabel value="sí" control={<Radio size="small" />} label={<span className="text-sm">sí</span>} />
                    <FormControlLabel value="no" control={<Radio size="small" />} label={<span className="text-sm">no</span>} />
                  </RadioGroup>
                </div>
                
                {isService && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">Permite cotización:</span>
                    <RadioGroup row name="permiteCotizacion" value={currentItem.permiteCotizacion} onChange={handleChange}>
                      <FormControlLabel value="sí" control={<Radio size="small" />} label={<span className="text-sm">sí</span>} />
                      <FormControlLabel value="no" control={<Radio size="small" />} label={<span className="text-sm">no</span>} />
                    </RadioGroup>
                  </div>
                )}
                
                <TextField label="Precio ($)" name="precio" type="number" value={currentItem.precio} onChange={handleChange} required size="small" sx={{ width: 150 }} />
              </div>
            </div>

            {/* Columna Derecha (Imágenes y Botón) */}
            <div className="flex flex-col items-center justify-between border-l border-gray-100 pl-8">
              <div className="w-full">
                <span className="text-sm font-medium text-gray-700 mb-2 block">Imágenes</span>
                <div className="w-full aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                  <CloudUpload className="text-gray-400 mb-2" fontSize="large" />
                  <span className="text-xs text-gray-500">Subir imagen</span>
                </div>
              </div>

              <Button type="submit" variant="contained" disabled={isLoading} fullWidth sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, mt: 4, height: 48, fontWeight: 'bold' }}>
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Guardar y publicar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // --- RENDERIZADO DE LISTA (POR DEFECTO) ---

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wider">Gestión de Catálogo</h1>
        
        <div>
          <Button 
            variant="contained" 
            color="primary" 
            endIcon={<KeyboardArrowDown />}
            onClick={handleOpenAddMenu}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
          >
            Añadir
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={openAddMenu}
            onClose={handleCloseAddMenu}
          >
            <MenuItem onClick={handleCreateProduct}>Agregar Producto</MenuItem>
            <MenuItem onClick={handleCreateService}>Agregar Servicio</MenuItem>
          </Menu>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <TableContainer component={Paper} elevation={0} variant="outlined" className="mb-8">
          <Table sx={{ minWidth: 650 }}>
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell className="font-bold">ID</TableCell>
                <TableCell className="font-bold">Tipo</TableCell>
                <TableCell className="font-bold">Nombre</TableCell>
                <TableCell className="font-bold">Categoría</TableCell>
                <TableCell className="font-bold text-right">Precio</TableCell>
                <TableCell className="font-bold text-center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.tipo === 'Servicio' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                      {item.tipo}
                    </span>
                  </TableCell>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell className="text-right">${item.precio}</TableCell>
                  <TableCell className="text-center">
                    <IconButton color="secondary" onClick={() => handleEdit(item)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleOpenDelete(item.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
        {productos.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-800">{item.nombre}</h3>
                <span className="text-xs font-semibold text-gray-500 uppercase">{item.categoria}</span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${item.tipo === 'Servicio' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                {item.tipo}
              </span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="font-bold text-lg text-gray-900">${item.precio}</span>
              <div>
                <IconButton color="secondary" onClick={() => handleEdit(item)} size="small">
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={() => handleOpenDelete(item.id)} size="small">
                  <Delete fontSize="small" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={openDelete} onClose={() => !isLoading && setOpenDelete(false)}>
        <DialogTitle className="font-bold">Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <p className="text-gray-600">¿Estás seguro que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
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

export default AdminProductos;
