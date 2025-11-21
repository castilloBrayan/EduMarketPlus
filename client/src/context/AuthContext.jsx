import React, { useState, useEffect } from 'react'

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

    const [isInitializing, setIsInitializing] = useState(true)

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

    // Verificar sesión al montar el componente
    useEffect(() => {
        const verifySession = async () => {
            try {
                // Llama al endpoint del backend /api/auth/verify (S1-BE-020)
                const response = await fetch('/api/auth/verify')
                const data = await response.json()

                if (response.ok) {
                    // Si la cookie es válida, loguear al usuario
                    login(data.user) 
                } 
                // Si la respuesta no es 200 (401 Unauthorized), mantener estado no logueado
                
            } catch (error) {
                console.error('Error al verificar sesión: ', error)
            } finally {
                // Establecer verificacion inicial como terminada, no importa el resultado
                setIsInitializing(false)
            }
        }

        verifySession()
    }, []) // Se ejecuta una sola vez al cargar la aplicación, sin dependencias
    
    //Condición para bloquear la renderización de la app hasta Verificar la sesión
    if (isInitializing) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2em'
            }}>
                Cargando sesión...
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}