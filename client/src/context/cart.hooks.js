import { createContext, useContext } from 'react'

// Crear y exportar el Contexto
export const CartContext = createContext()

// Crear y exportar el Hook de utilidad
export const useCart = () => useContext(CartContext)