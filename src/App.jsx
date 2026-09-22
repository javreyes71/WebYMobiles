import React, { useState } from 'react';
import Navbar from './components/organisms/Navbar/Navbar';
import Login from './pages/Login/Login';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setIsLoginOpen(true)} />
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

export default App;
