import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

import './App.css'  

import ProtectedRoute from './components/ProtectedRoute'

// Importar componentes de página
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CourseDetailPage from './pages/CourseDetailPage'
import CreateCoursePage from './pages/CreateCoursePage'
import NotFoundPage from './pages/NotFoundPage'
// TODO: import Navbar from './components/Navbar'


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
          
          {/* Ruta 'Catch-all' (404) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App