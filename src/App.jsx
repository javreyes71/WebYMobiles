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
import { CartProvider } from './context/CartContext';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulación de sesión

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
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar 
            onLoginClick={openLogin} 
            onRegisterClick={openRegister}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
          
          <main className="flex-1 bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tienda" element={<Tienda />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/admin/productos" element={<AdminProductos />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
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
          />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
