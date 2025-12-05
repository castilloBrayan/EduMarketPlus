import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client' // Importar el cliente de Socket.io

import ChatSocketContext from './chatSocket.hooks' // Importar el contexto chatSocket

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const ChatSocketProvider = ({ children }) => {
    // Referencia mutable para mantener la instancia del socket a través de re-renders
    const socketRef = useRef(null) 
    
    // Estado principal de la conversación
    const [messages, setMessages] = useState([]) // Historial de mensajes de la sala activa
    const [chatRoomId, setChatRoomId] = useState(null) // ID de la sala activa
    const [isConnected, setIsConnected] = useState(false) // Estado de conexión del socket
    const [chatError, setChatError] = useState(null) // Para errores de socket/chat
    const [currentChatTarget, setCurrentChatTarget] = useState(null) // Info del otro usuario


    // Conexión del Socket
    useEffect(() => {
        // La forma más segura de obtener la cookie JWT es de un contexto de autenticación
        // TODO: Usar el contexto de autenticación para obtener la cookie JWT
        const token = localStorage.getItem('token')
        
        if (!token) {
            console.error("Token de autenticación no encontrado, no se puede conectar Socket.io")
            return
        }

        console.log(`Creando la conexión, token: ${token} con la url: ${SOCKET_SERVER_URL}`)

        // Crear la conexión con el token para la autenticación en el middleware de backend
        const newSocket = io(SOCKET_SERVER_URL, {
            auth: {
                token: token,
            },
            transports: ['websocket']
        })

        socketRef.current = newSocket
        
        // Eventos del Socket

        // Conexión exitosa
        newSocket.on('connect', () => {
            setIsConnected(true)
            console.log("Socket.io conectado, ID:", newSocket.id)
            setChatError(null)
        })

        // Desconexión
        newSocket.on('disconnect', () => {
            setIsConnected(false)
            setChatRoomId(null)
            setMessages([])
            setCurrentChatTarget(null)
            console.log("Socket.io desconectado")
        })

        // Recepción de mensaje (emitido por el backend)
        newSocket.on('receive_message', (message) => {
            // Solo actualizamos si estamos en la sala correcta
            if (message.chat_room_id === chatRoomId) {
                setMessages(prev => [...prev, message])
            }
            // TODO: Lógica de notificación (S3-FE-052)
        })
        
        // Error de chat desde el servidor
        newSocket.on('chat_error', (data) => {
            console.error("[Chat Error]: ", data.message)
            setChatError(data.message)
        })
        
        // Error de conexión
        newSocket.on('connect_error', (err) => {
            console.error("Error de conexión de Socket.io: ", err.message)
            setIsConnected(false)
            setChatError(err.message)
        })

        // Limpieza: Cerrar la conexión cuando el componente se desmonte
        return () => {
            newSocket.disconnect()
        }
    }, [chatRoomId])

    
    // Funciones Principales de Interacción con el Chat

    // Inicia o se une a una sala de chat específica (soporte o privada)
    // Necesita el ID del otro usuario (targetUserId) o soporte
    const joinChatRoom = async (targetUserId) => {
        if (!isConnected || !socketRef.current) {
            setChatError("Socket no está conectado")
            return
        }

        // Obtener el token de autenticación para la petición REST
        const token = localStorage.getItem('token')

        if (!token) {
            setChatError("Token de autenticación no encontrado")
            return
        }

        // Llamar al endpoint REST para obtener el historial y el ID de sala canónico
        try {
            const response = await fetch(`/api/chat/${targetUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
                throw new Error(errorData.error || `Error en la petición HTTP, status: ${response.status}`)
            }
            
            const { chat_room_id, historial } = await response.json()
            
            // Si la sala cambia, limpiar el historial anterior
            if (chat_room_id !== chatRoomId) {
                setMessages(historial)
                setChatRoomId(chat_room_id)
                setCurrentChatTarget({ 
                    id: targetUserId, 
                    // TODO: buscar info del usuario objetivo si no es soporte
                    nombre: targetUserId === '2' ? 'Soporte Técnico' : `Usuario ${targetUserId}`
                })
            }

            // Emitir evento al backend para unirse a la sala
            socketRef.current.emit('join_room', { chat_room_id })
            
            setChatError(null)

        } catch (error) {
            console.error("Error al unirse a la sala de chat: ", error.message)
            setChatError(error.message.includes('Error desconocido') ? 'Error al cargar el chat' : error.message)
        }
    }


    // Envía un mensaje a la sala activa, necesita el contenido del mensaje
    const sendChatMessage = (content) => {
        if (!isConnected || !chatRoomId || content.trim() === '') {
            setChatError("No hay sala activa o el mensaje está vacío")
            return
        }

        // Emitir el evento 'send_message' al backend
        socketRef.current.emit('send_message', {
            chat_room_id: chatRoomId,
            content: content.trim(),
        })

    }


    // Valor del Contexto
    const contextValue = {
        messages,
        chatRoomId,
        isConnected,
        chatError,
        currentChatTarget,
        joinChatRoom,
        sendChatMessage,
        // TODO: Función paginación para cargar más mensajes (S3-CHAT-047)
    }

    return (
        <ChatSocketContext.Provider value={contextValue}>
            {children}
        </ChatSocketContext.Provider>
    )
}