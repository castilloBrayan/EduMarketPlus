import React, { useState } from 'react'

import { AuthContext } from './auth.hooks'

export const AuthProvider = ({ children }) => {
    // Estado para simular si el usuario está logueado y qué rol tiene
    const [user, setUser] = useState({
        isLoggedIn: false,
        rol: 'Visitante'
    })

    // Por ahora, simulo una función de login
    const login = (role = 'Instructor') => {
        setUser({ isLoggedIn: true, rol: role })
    }
    
    const logout = () => {
        setUser({ isLoggedIn: false, rol: 'Visitante' })
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}