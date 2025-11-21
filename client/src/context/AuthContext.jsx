import React, { useState } from 'react'

import { AuthContext } from './auth.hooks'

export const AuthProvider = ({ children }) => {
    // Estado para simular si el usuario está logueado y qué rol tiene
    const [user, setUser] = useState({
        isLoggedIn: false,
        rol: 'Visitante',
        nombre: null,
        id: null,
        foto_url: null
    })

    // Por ahora, simulo una función de login
    const login = (userData) => { 
        // Cuando el login es exitoso, guardar los datos que vienen del backend
        setUser({ 
            isLoggedIn: true, 
            rol: userData.rol,
            nombre: userData.nombre,
            id: userData.id,
            foto_url: userData.foto_url
        })
    }

    const logout = () => {
        setUser({ 
            isLoggedIn: false, 
            rol: 'Visitante',
            nombre: null, // Limpiar nombre
            id: null, // Limpiar ID
            foto_url: null // Limpiar foto
        })
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}