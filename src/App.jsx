import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/organisms/Navbar/Navbar';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Tienda from './pages/Tienda/Tienda';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import AdminProductos from './pages/AdminProductos/AdminProductos';
import AdminUsuarios from './pages/AdminUsuarios/AdminUsuarios';
import Perfil from './pages/Perfil/Perfil';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulación de sesión
  const [currentUser, setCurrentUser] = useState(null);

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginOpen(false);
    if (!currentUser) setCurrentUser({ nombre: 'Usuario Vento' });
  };

  const handleRegisterSuccess = (userData) => {
    setIsLoggedIn(true);
    setIsRegisterOpen(false);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <ToastProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col font-sans">
            <Navbar 
              onLoginClick={openLogin} 
              onRegisterClick={openRegister}
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              currentUser={currentUser}
            />
            
            <main className="flex-1 bg-gray-50" aria-label="Contenido Principal">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tienda" element={<Tienda />} />
                <Route path="/producto/:id" element={<ProductDetail />} />
                <Route path="/carrito" element={<Cart />} />
                <Route path="/admin/productos" element={<AdminProductos />} />
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/perfil" element={<Perfil currentUser={currentUser} />} />
              </Routes>
            </main>
            
            <Login 
              isOpen={isLoginOpen} 
              onClose={() => setIsLoginOpen(false)} 
              onSwitchToRegister={openRegister}
              onLoginSuccess={handleLoginSuccess}
            />
            
            <Register 
              isOpen={isRegisterOpen} 
              onClose={() => setIsRegisterOpen(false)} 
              onSwitchToLogin={openLogin}
              onRegisterSuccess={handleRegisterSuccess}
            />
          </div>
        </Router>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
