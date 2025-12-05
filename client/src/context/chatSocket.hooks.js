import { createContext, useContext } from 'react'

// Crear el Contexto
export const ChatSocketContext = createContext(null)

// Hook personalizado para acceder fácilmente al contexto del chat
export const useChatSocket = () => useContext(ChatSocketContext)