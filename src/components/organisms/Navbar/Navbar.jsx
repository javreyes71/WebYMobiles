import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Menu as MenuIcon, Briefcase, PackagePlus } from 'lucide-react';
import {
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import CustomButton from '@/components/atoms/Button/CustomButton';
import Logo from '@/components/atoms/Logo/Logo';
import NavLinkItem from '@/components/atoms/NavLinkItem/NavLinkItem';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { getInitials } from '@/utils/validators';

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const { cartCount } = useCart();
  const { isLoggedIn, currentUser, logout } = useAuth();
  const { wishlistIds } = useProducts();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);

  const goAndCloseMenu = (path, state) => {
    handleCloseMenu();
    navigate(path, state ? { state } : undefined);
  };

  const handleLogoutClick = () => {
    handleCloseMenu();
    logout();
    navigate('/');
  };

  const initials = currentUser ? getInitials(currentUser.nombre) : 'U';

  const drawerContent = (
    <div className="w-72 p-5 h-full flex flex-col bg-white" role="dialog" aria-label="Menú móvil">
      <div className="flex justify-between items-center mb-5 mt-1">
        <Logo className="h-9 w-auto" onClick={toggleMobileMenu} />
        <button
          onClick={toggleMobileMenu}
          aria-label="Cerrar menú móvil"
          className="text-gray-500 hover:text-black text-lg px-2 py-1"
        >
          ✕
        </button>
      </div>
      <Divider />
      <List className="flex-grow py-3">
        <ListItemButton onClick={() => { navigate('/'); toggleMobileMenu(); }}>
          <ListItemText
            primary="INICIO"
            primaryTypographyProps={{ className: 'font-bold text-gray-900 text-sm' }}
          />
        </ListItemButton>
        <ListItemButton onClick={() => { navigate('/tienda'); toggleMobileMenu(); }}>
          <ListItemText
            primary="TIENDA (PRODUCTOS)"
            primaryTypographyProps={{ className: 'font-bold text-gray-900 text-sm' }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => { navigate('/servicios'); toggleMobileMenu(); }}
          sx={{ bgcolor: '#f0f9ff', borderRadius: 2, my: 0.5 }}
        >
          <ListItemText
            primary="SERVICIOS"
            secondary="Profesionales y cotizaciones"
            primaryTypographyProps={{ className: 'font-extrabold text-sky-700 text-sm' }}
            secondaryTypographyProps={{ className: 'text-xs text-sky-600' }}
          />
        </ListItemButton>
        <ListItemButton onClick={() => { navigate('/contacto'); toggleMobileMenu(); }}>
          <ListItemText
            primary="CONTACTO"
            primaryTypographyProps={{ className: 'font-bold text-gray-900 text-sm' }}
          />
        </ListItemButton>

        {isLoggedIn && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <ListItemButton
              onClick={() => {
                navigate('/admin/productos', { state: { initialView: 'form-producto' } });
                toggleMobileMenu();
              }}
            >
              <ListItemText
                primary="VENDER PRODUCTO"
                primaryTypographyProps={{ className: 'font-bold text-gray-800 text-xs' }}
              />
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                navigate('/admin/servicios', { state: { initialView: 'form-servicio' } });
                toggleMobileMenu();
              }}
            >
              <ListItemText
                primary="OFRECER SERVICIO"
                primaryTypographyProps={{ className: 'font-bold text-sky-700 text-xs' }}
              />
            </ListItemButton>
          </>
        )}
      </List>

      {!isLoggedIn && (
        <div className="flex flex-col space-y-2.5 mt-auto pt-4 border-t border-gray-100">
          <CustomButton
            variant="outline"
            fullWidth
            onClick={() => {
              toggleMobileMenu();
              onLoginClick();
            }}
          >
            Iniciar Sesión
          </CustomButton>
          <CustomButton
            variant="primary"
            fullWidth
            onClick={() => {
              toggleMobileMenu();
              onRegisterClick();
            }}
          >
            Regístrate
          </CustomButton>
        </div>
      )}
    </div>
  );

  return (
    <header className="w-full flex flex-col font-sans border-b border-gray-200 sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="bg-gray-900 text-white text-center py-2 px-4 text-xs font-semibold tracking-wider">
        DESPACHO GRATIS EN PRODUCTOS POR COMPRAS SOBRE $50.000 · SERVICIOS PROFESIONALES VERIFICADOS
      </div>

      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Izquierda: Menú hamburguesa móvil y Logo */}
        <div className="flex items-center gap-2">
          <IconButton
            onClick={toggleMobileMenu}
            aria-label="Abrir menú de navegación"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon className="w-6 h-6 text-gray-900" />
          </IconButton>
          <Logo />
        </div>

        {/* Centro: Navegación Principal Pública con SERVICIOS separado de TIENDA */}
        <nav
          className="hidden md:flex items-center space-x-5 lg:space-x-7"
          aria-label="Navegación principal"
        >
          <NavLinkItem to="/">Inicio</NavLinkItem>
          <NavLinkItem to="/tienda">Tienda</NavLinkItem>
          <NavLinkItem to="/servicios" accent>
            Servicios
          </NavLinkItem>
          <NavLinkItem to="/contacto">Contacto</NavLinkItem>

          {isLoggedIn && (
            <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-gray-200">
              <Link
                to="/admin/productos"
                state={{ initialView: 'form-producto' }}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
              >
                <PackagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                Vender
              </Link>
              <Link
                to="/admin/servicios"
                state={{ initialView: 'form-servicio' }}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                Ofrecer Servicio
              </Link>
            </div>
          )}
        </nav>

        {/* Derecha: Favoritos, Carrito y Autenticación */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Lista de deseos */}
          <Link
            to="/perfil?tab=favoritos"
            aria-label={`Lista de deseos (${wishlistIds.length} guardados)`}
            className="relative p-2 text-gray-700 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <Heart className="w-5 h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          {/* Carrito de compras */}
          <Link
            to="/carrito"
            aria-label={`Carrito de compras con ${cartCount} artículos`}
            className="relative flex items-center text-gray-800 hover:text-black px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 sm:mr-2" />
            <span className="hidden lg:inline-block text-xs font-bold uppercase tracking-wider">
              {cartCount} {cartCount === 1 ? 'Ítem' : 'Ítems'}
            </span>
            <span className="lg:hidden ml-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          </Link>

          {/* Sesión de usuario */}
          {isLoggedIn ? (
            <>
              <IconButton
                onClick={handleProfileClick}
                size="small"
                aria-label="Abrir menú de cuenta de usuario"
                aria-controls={openMenu ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openMenu ? 'true' : undefined}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: '#111827',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
              </IconButton>

              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {currentUser?.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.rol || 'Cliente'} · {currentUser?.rut}
                  </p>
                </div>
                <MenuItem onClick={() => goAndCloseMenu('/perfil')}>Mi Perfil y Pedidos</MenuItem>
                <MenuItem onClick={() => goAndCloseMenu('/perfil?tab=cotizaciones')}>
                  Mis Cotizaciones
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => goAndCloseMenu('/admin/productos')}>
                  Gestión de Ventas (Productos)
                </MenuItem>
                <MenuItem onClick={() => goAndCloseMenu('/admin/servicios')}>
                  Gestión de Servicios
                </MenuItem>
                {currentUser?.rol === 'Admin' && (
                  <MenuItem onClick={() => goAndCloseMenu('/admin/usuarios')}>
                    Empresa y Administradores
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogoutClick} sx={{ color: '#dc2626', fontWeight: 600 }}>
                  Cerrar sesión
                </MenuItem>
              </Menu>
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-2.5">
              <CustomButton variant="outline" size="sm" onClick={onLoginClick}>
                Iniciar Sesión
              </CustomButton>
              <CustomButton variant="primary" size="sm" onClick={onRegisterClick}>
                Regístrate
              </CustomButton>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Móvil */}
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
