import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/organisms/Navbar/Navbar';
import Footer from '@/components/organisms/Footer/Footer';
import ProtectedRoute from '@/components/atoms/ProtectedRoute/ProtectedRoute';
import Login from '@/pages/Login/Login';
import Register from '@/pages/Register/Register';
import Home from '@/pages/Home/Home';
import Tienda from '@/pages/Tienda/Tienda';
import Servicios from '@/pages/Servicios/Servicios';
import ProductDetail from '@/pages/ProductDetail/ProductDetail';
import Cart from '@/pages/Cart/Cart';
import Checkout from '@/pages/Checkout/Checkout';
import Contacto from '@/pages/Contacto/Contacto';
import AdminProductos from '@/pages/AdminProductos/AdminProductos';
import AdminUsuarios from '@/pages/AdminUsuarios/AdminUsuarios';
import Perfil from '@/pages/Perfil/Perfil';
import PerfilVendedor from '@/pages/PerfilVendedor/PerfilVendedor';
import PerfilProveedor from '@/pages/PerfilProveedor/PerfilProveedor';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { ROLES } from '@/utils/roles';

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
              <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
                <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />

                <main className="flex-1" aria-label="Contenido Principal">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    {/* Páginas estrictamente separadas para Ventas (Tienda) vs Oferta de Servicios */}
                    <Route path="/tienda" element={<Tienda />} />
                    <Route path="/tienda/vendedor/:id" element={<PerfilVendedor />} />
                    <Route
                      path="/servicios"
                      element={<Servicios onRequireLogin={openLogin} />}
                    />
                    <Route path="/servicios/proveedor/:id" element={<PerfilProveedor />} />
                    <Route path="/producto/:id" element={<ProductDetail />} />
                    <Route path="/servicio/:id" element={<ProductDetail />} />
                    <Route path="/carrito" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/contacto" element={<Contacto />} />

                    {/* Portales protegidos por Rol (RBAC) para Vendedor de Productos, Proveedor de Servicios y Admin */}
                    <Route
                      path="/admin/productos"
                      element={
                        <ProtectedRoute
                          allowedRoles={[ROLES.ADMIN, ROLES.VENDEDOR_PRODUCTO]}
                          onRequireLogin={openLogin}
                        >
                          <AdminProductos mode="productos" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/servicios"
                      element={
                        <ProtectedRoute
                          allowedRoles={[ROLES.ADMIN, ROLES.PROVEEDOR_SERVICIO]}
                          onRequireLogin={openLogin}
                        >
                          <AdminProductos mode="servicios" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/usuarios"
                      element={
                        <ProtectedRoute
                          allowedRoles={[ROLES.ADMIN]}
                          onRequireLogin={openLogin}
                        >
                          <AdminUsuarios />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/perfil"
                      element={
                        <ProtectedRoute onRequireLogin={openLogin}>
                          <Perfil />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>

                <Footer />

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
