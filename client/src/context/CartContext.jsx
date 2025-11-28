import React, { useState, useEffect, useCallback } from 'react'
import { CartContext } from './cart.hooks'
import { useAuth } from './auth.hooks' // Para obtener el ID del usuario

export const CartProvider = ({ children }) => {
    const { user } = useAuth()
    
    // Estado del carrito: array de cursos y el total
    const [cartItems, setCartItems] = useState([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    // Función para obtener el carrito activo del backend
    const fetchCart = useCallback(async () => {
        if (!user.isLoggedIn) {
            setCartItems([]) // Vaciar si no está logueado
            setLoading(false)
            return
        }

        try {
            // Implementar endpoint GET /api/cart/
            const response = await fetch('/api/cart/') 
            const result = await response.json()

            if (response.ok) {
                // Asumimos que el backend devuelve un array de 'items' (detalles_orden con info del curso)
                setCartItems(result.data.items || []) 
            } else {
                setCartItems([])
            }
        } catch (error) {
            console.error('Error al cargar el carrito: ', error)
            setCartItems([])
        } finally {
            setLoading(false)
        }
    }, [user.isLoggedIn]) // Depende del estado de login

    // Función de utilidad para abrir/cerrar el sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev)
    }

    // Calcular el total
    const cartTotal = cartItems.reduce((acc, item) => acc + item.precio_al_comprar, 0)

    // Cargar el carrito al iniciar sesión
    useEffect(() => {
        fetchCart()
    }, [user.isLoggedIn, fetchCart]) // Depende del estado de login

    // Valores que el contexto devolverá
    const contextValue = {
        cartItems,
        cartTotal,
        isSidebarOpen,
        loading,
        fetchCart, // Para recargar el carrito después de agregar/eliminar
        toggleSidebar
    }

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    )
}