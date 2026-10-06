import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu as MenuIcon } from 'lucide-react';
import CustomButton from '../../atoms/Button/CustomButton';
import ventoLogo from '../../../assets/vento-logo.png';
import { useCart } from '../../../context/CartContext';
import { Menu, MenuItem, IconButton, Avatar, Divider, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { getInitials } from '../../../utils/validators';
import { useAuth } from '../../../context/AuthContext';

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const { cartCount } = useCart();
  const { isLoggedIn, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleMiPerfilClick = () => {
    handleCloseMenu();
    navigate('/perfil');
  };

  const handleAdminClick = () => {
    handleCloseMenu();
    navigate('/admin/productos');
  };

  const handleAdminUsersClick = () => {
    handleCloseMenu();
    navigate('/admin/usuarios');
  };

  const handleLogoutClick = () => {
    handleCloseMenu();
    navigate('/');
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  const initials = currentUser ? getInitials(currentUser.nombre) : 'U';

  const drawerContent = (
    <div className="w-64 p-4 h-full flex flex-col bg-white">
      <div className="flex justify-center mb-6 mt-4">
        <img src={ventoLogo} alt="Vento Logo" className="h-10 w-auto" />
      </div>
      <Divider />
      <List className="flex-grow">
        <ListItem button onClick={() => { navigate('/'); toggleMobileMenu(); }}>
          <ListItemText primary="INICIO" primaryTypographyProps={{ className: "font-bold text-gray-800" }} />
        </ListItem>
        <ListItem button onClick={() => { navigate('/tienda'); toggleMobileMenu(); }}>
          <ListItemText primary="TIENDA" primaryTypographyProps={{ className: "font-bold text-gray-800" }} />
        </ListItem>
        <ListItem button onClick={() => { toggleMobileMenu(); }}>
          <ListItemText primary="CONTACTO" primaryTypographyProps={{ className: "font-bold text-gray-800" }} />
        </ListItem>
        {isLoggedIn && (
          <>
            <ListItem button onClick={() => { navigate('/admin/productos', { state: { initialView: 'form-producto' } }); toggleMobileMenu(); }}>
              <ListItemText primary="VENDER" primaryTypographyProps={{ className: "font-bold text-gray-800" }} />
            </ListItem>
            <ListItem button onClick={() => { navigate('/admin/productos', { state: { initialView: 'form-servicio' } }); toggleMobileMenu(); }}>
              <ListItemText primary="PUBLICAR SERVICIO" primaryTypographyProps={{ className: "font-bold text-gray-800" }} />
            </ListItem>
          </>
        )}
      </List>
      {!isLoggedIn && (
        <div className="flex flex-col space-y-3 mt-auto mb-4">
          <CustomButton variant="outline" onClick={() => { onLoginClick(); toggleMobileMenu(); }}>
            Iniciar Sesión
          </CustomButton>
          <CustomButton variant="solid" onClick={() => { onRegisterClick(); toggleMobileMenu(); }}>
            Regístrate
          </CustomButton>
        </div>
      )}
    </div>
  );

  return (
    <header className="w-full flex flex-col font-sans border-b border-gray-200">
      <div className="bg-black text-white text-center py-2 text-xs font-semibold tracking-wider">
        DESPACHO GRATIS POR COMPRAS SOBRE $50.000
      </div>

      <div className="w-full bg-white flex items-center justify-between px-4 sm:px-6 py-4">
        
        {/* Left Side: Hamburger (Mobile Only) & Logo */}
        <div className="flex items-center">
          <IconButton 
            onClick={toggleMobileMenu} 
            className="md:hidden mr-2" 
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            <MenuIcon className="w-6 h-6 text-gray-900" />
          </IconButton>
          <Link to="/" className="flex items-center">
            <img src={ventoLogo} alt="Vento Logo" className="h-8 sm:h-10 w-auto" />
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop Only) */}
        <nav className="hidden md:flex space-x-6 text-sm font-bold text-gray-800 tracking-wide items-center">
          <Link to="/" className="hover:text-gray-500 transition-colors uppercase">Inicio</Link>
          <Link to="/tienda" className="hover:text-gray-500 transition-colors uppercase">Tienda</Link>
          <Link to="#" className="hover:text-gray-500 transition-colors uppercase">Contacto</Link>
          {isLoggedIn && (
            <>
              <Link 
                to="/admin/productos" 
                state={{ initialView: 'form-producto' }} 
                className="hover:text-gray-500 transition-colors uppercase text-black"
              >
                Vender
              </Link>
              <Link 
                to="/admin/productos" 
                state={{ initialView: 'form-servicio' }} 
                className="hover:text-gray-500 transition-colors uppercase text-black"
              >
                Publicar Servicio
              </Link>
            </>
          )}
        </nav>

        {/* Right Side: Cart & Auth */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link to="/carrito" className="flex items-center text-gray-800 hover:text-gray-500 cursor-pointer transition-colors group">
            <ShoppingCart className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider">{cartCount} Producto{cartCount !== 1 ? 's' : ''}</span>
            {/* Mobile badge */}
            <span className="sm:hidden ml-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <IconButton onClick={handleProfileClick} size="small" sx={{ ml: { xs: 0, sm: 2 } }}>
                  <Avatar sx={{ width: {xs: 28, sm: 32}, height: {xs: 28, sm: 32}, bgcolor: '#000', fontSize: {xs: '0.75rem', sm: '0.875rem'} }}>
                    {initials}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={handleCloseMenu}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleMiPerfilClick}>Mi Perfil</MenuItem>
                  <MenuItem onClick={handleAdminClick}>Mis Publicaciones</MenuItem>
                  {currentUser?.rol === 'Admin' && (
                    <MenuItem onClick={handleAdminUsersClick}>Admin. Usuarios</MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogoutClick}>Cerrar sesión</MenuItem>
                </Menu>
              </>
            ) : (
              <div className="hidden md:flex space-x-3">
                <CustomButton variant="outline" onClick={onLoginClick}>
                  Iniciar Sesión
                </CustomButton>
                <CustomButton variant="solid" onClick={onRegisterClick}>
                  Regístrate
                </CustomButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer para Menú Móvil */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleMobileMenu}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {drawerContent}
      </Drawer>
    </header>
  );
};

export default Navbar;
