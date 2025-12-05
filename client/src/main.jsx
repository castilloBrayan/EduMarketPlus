import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext'
import { ChatSocketProvider } from './context/ChatSocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Envolver la aplicación con el proveedor de autenticación */}
    <AuthProvider>
      <ChatSocketProvider> {/* Envolver la aplicación para usar el ChatSocketContext */}
        <CartProvider> {/* Envolver la aplicación para usar el CartContext */}
          <App />
        </CartProvider>
      </ChatSocketProvider>
    </AuthProvider>
  </StrictMode>,
)