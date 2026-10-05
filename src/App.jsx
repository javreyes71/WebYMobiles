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
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <Router>
              <div className="min-h-screen flex flex-col font-sans">
                <Navbar 
                  onLoginClick={openLogin} 
                  onRegisterClick={openRegister}
                />
                
                <main className="flex-1 bg-gray-50" aria-label="Contenido Principal">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tienda" element={<Tienda />} />
                    <Route path="/producto/:id" element={<ProductDetail />} />
                    <Route path="/carrito" element={<Cart />} />
                    <Route path="/admin/productos" element={<AdminProductos />} />
                    <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                    <Route path="/perfil" element={<Perfil />} />
                  </Routes>
                </main>
                
                <Login 
                  isOpen={isLoginOpen} 
                  onClose={() => setIsLoginOpen(false)} 
                  onSwitchToRegister={openRegister}
                />
                
                <Register 
                  isOpen={isRegisterOpen} 
                  onClose={() => setIsRegisterOpen(false)} 
                  onSwitchToLogin={openLogin}
                />
              </div>
            </Router>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
