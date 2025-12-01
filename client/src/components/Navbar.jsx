import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'
import { useCart } from '../context/cart.hooks'
import { FaShoppingCart } from 'react-icons/fa'

import styles from './Navbar.module.css'
const DEFAULT_AVATAR = '/default-avatar.png' 

const Navbar = () => {
    // Obtener el estado del usuario logueado y la función para desloguear
    const { user, logout } = useAuth()
    const { cartItems, toggleSidebar, loading } = useCart() // Usar estado del carrito
    
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
        <nav className={styles.navbar}>
            <Link to="/" className={styles.navbarBrand}>
                EduMarket+
            </Link>

            <div className={styles.navbarLinks}>
                <Link to="/" className={styles.navItem}>Catálogo</Link>

                {/* Enlace condicional, crear curso (solo para admin e instructor) */}
                {(user.rol === 'Admin' || user.rol === 'Instructor') && (
                    <Link to="/instructor/create" className={styles.createCourseBtn}>Crear Curso</Link>
                )}

                {/* Sección de Autenticación Condicional */}
                {user.isLoggedIn ? (
                    <>
                    {/* Vista Logueada: Carrito (si lo hay), Nombre, Foto y Logout */}

                    {/* Botón del Carrito (Visible solo si hay items y el usuario está logueado como estudiante) */}
                    {(user.rol === 'Estudiante' && !loading && cartItems.length > 0) && (
                        <button className={styles.cartButton} onClick={toggleSidebar} title="Ver Carrito">
                            <FaShoppingCart />
                            {/* Conteo de items */}
                            <span className={styles.cartBadge}>{cartItems.length}</span> 
                        </button>
                    )}

                    {/* Botón de Mis Cursos (Visible solo si el usuario está logueado como estudiante) */}
                    {(user.rol === 'Estudiante' && !loading) && (
                        <Link to="/my-courses" className={styles.navItem}>Mis Cursos</Link>
                    )}
                    
                    <div className={styles.userInfo}>
                        <img 
                            src={user.foto_url || DEFAULT_AVATAR}
                            alt={user.nombre || 'Usuario'}
                            className={styles.userAvatar}
                        />
                        
                        <span className={styles.userName}>Hola {user.nombre}, ({user.rol})</span>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            Cerrar Sesión
                        </button>
                    </div>
                    </>

                ) : (
                    // Vista No Logueada: Login y Registro
                    <>
                    <Link to="/login" className={styles.navItem}>Iniciar Sesión</Link>
                    <Link to="/register" className={styles.navItemSignUp}>Registrarse</Link>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Navbar