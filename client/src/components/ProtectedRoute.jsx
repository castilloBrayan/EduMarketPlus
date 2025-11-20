import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth() // Usar contexto de autenticación

    // Verificar Autenticación
    if (!user.isLoggedIn) {
        // Si no está logueado, redirigir a login
        console.log(`Acceso denegado: no logueado`)
        return <Navigate to="/login" replace />
    }

    // Verificar Rol (para rutas como /instructor/create, S1-COURSE-010)
    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.rol)) {
            // Si el rol no es permitido, redirigir a la raíz
            console.log(`Acceso denegado: Rol actual (${user.rol}) no autorizado`)
            return <Navigate to="/" replace />
        }
    }

    return children
}

export default ProtectedRoute