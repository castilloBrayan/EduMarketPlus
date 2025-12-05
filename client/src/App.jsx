import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import './App.css'  

import ProtectedRoute from './components/ProtectedRoute'

// Importar componentes de página
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CourseDetailPage from './pages/CourseDetailPage'
import CreateCoursePage from './pages/CreateCoursePage'
import NotFoundPage from './pages/NotFoundPage'
import Navbar from './components/Navbar'
import CheckoutPage from './pages/CheckoutPage'
import CartSidebar from './components/CartSidebar'
import CartPage from './pages/CartPage'
import MyCoursesPage from './pages/MyCoursesPage'
import SupportPage from './pages/SupportPage'
import ChatBox from './components/ChatBox.jsx'

function App() {

  return (
    <Router>
      
      {/* <Navbar /> */}
      <Navbar />

      <div className="content-wrap">
        <Routes>
          {/* Rutas Públicas (S1-FE-013) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />

          <Route 
             path="/cart" 
             element={
               <ProtectedRoute allowedRoles={['Estudiante']}>
                   <CartPage />
               </ProtectedRoute>
             } 
          />

          <Route 
             path="/checkout" 
             element={
               <ProtectedRoute allowedRoles={['Estudiante']}>
                   <CheckoutPage />
               </ProtectedRoute>
             } 
          />

          {/* RUTA PARA MIS CURSOS (S2-FE-034) */}
          <Route 
             path="/my-courses" 
             element={
               <ProtectedRoute allowedRoles={['Estudiante']}>
                   <MyCoursesPage />
               </ProtectedRoute>
             } 
          />

          {/* Ruta Protegida (S1-FE-013) */}
          <Route 
            path="/instructor/create" 
            element={
              // Proteger ruta solo para Admin e Instructor (pueden crear cursos)
              <ProtectedRoute allowedRoles={['Admin', 'Instructor']}>
                <CreateCoursePage />
              </ProtectedRoute>
            } 
          />

          {/* Vista de Soporte y Gestión de Conversaciones (S3-FE-053) */}
          <Route 
             path="/support" 
             element={
               <ProtectedRoute allowedRoles={['Admin', 'Soporte']}>
                   <SupportPage />
               </ProtectedRoute>
             } 
          />
          
          {/* Ruta 'Catch-all' (404) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <CartSidebar />

      {/* ChatBox flotante (S3-FE-055) */}
      <ChatBox />

    </Router>
  )
}

export default App