import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/organisms/Navbar/Navbar';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Tienda from './pages/Tienda/Tienda';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import { CartProvider } from './context/CartContext';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar onLoginClick={() => setIsLoginOpen(true)} />
          
          <main className="flex-1 bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tienda" element={<Tienda />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
            </Routes>
          </main>
          
          <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
