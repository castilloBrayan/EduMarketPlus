import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'

const Navbar = () => {
    // Obtener el estado del usuario logueado y la función para desloguear
    const { user, logout } = useAuth()
    
    const handleLogout = async () => {
        try {
            // Llamar al endpoint de Logout del backend (limpia la cookie HTTP-only)
            await fetch('/api/auth/logout', {
                method: 'POST'
            })

            // Limpiar el estado local de la sesión

            logout()
            
            // La redirección a la raíz sucede automáticamente si el estado de isLoggedIn cambia

        } catch (error) {
            console.error('Error al cerrar sesión: ', error)
            alert('Error al cerrar sesión. Intente nuevamente')
        }
    }

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                EduMarket+
            </Link>

            <div className="navbar-links">
                <Link to="/" className="nav-item">Catálogo</Link>

                {/* Enlace condicional, crear curso (solo para admin e instructor) */}
                {(user.rol === 'Admin' || user.rol === 'Instructor') && (
                    <Link to="/instructor/create" className="nav-item create-course-btn">Crear Curso</Link>
                )}

                {/* Sección de Autenticación Condicional */}
                {user.isLoggedIn ? (
                    // Vista Logueada: Nombre, Foto y Logout
                    <div className="user-info">
                        <img 
                            src={user.foto_url}
                            alt={user.nombre}
                            className="user-avatar"
                        />
                        
                        <span className="user-name">Hola {user.nombre}, ({user.rol})</span>
                        <button onClick={handleLogout} className="logout-button">
                            Cerrar Sesión
                        </button>
                    </div>
                ) : (
                    // Vista No Logueada: Login y Registro

                    <>
                    <Link to="/login" className="nav-item">Iniciar Sesión</Link>
                    <Link to="/register" className="nav-item register-btn">Registrarse</Link>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Navbar