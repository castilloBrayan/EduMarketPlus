import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext.jsx' // Importar AuthProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Envolver la aplicación con el proveedor de autenticación */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)