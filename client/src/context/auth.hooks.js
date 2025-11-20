import { createContext, useContext } from 'react'

// Crear y exportar el Contexto
export const AuthContext = createContext()

// Crear y exportar el Hook de utilidad
export const useAuth = () => useContext(AuthContext)