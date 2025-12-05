import React, { useState, useEffect, useRef, useCallback } from 'react'
import io from 'socket.io-client' // Importar el cliente de Socket.io
import { useAuth } from '../context/auth.hooks.js'
import { ChatSocketContext } from './chatSocket.hooks' // Importar el contexto chatSocket

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const API_BASE_URL = `/api/chat` // Base URL para llamadas HTTP

export const ChatSocketProvider = ({ children }) => {
    // Referencia mutable para mantener la instancia del socket a través de re-renders
    const socketRef = useRef(null) 
    const { token, user } = useAuth() // Obtener token de autenticación del contexto auth
    const currentUserId = user?.id
    
    // Estado principal de la conversación
    const [messages, setMessages] = useState([]) // Historial de mensajes de la sala activa
    const [chatRoomId, setChatRoomId] = useState(null) // ID de la sala activa
    const [isConnected, setIsConnected] = useState(false) // Estado de conexión del socket
    const [chatError, setChatError] = useState(null) // Para errores de socket/chat
    const [currentChatTarget, setCurrentChatTarget] = useState(null) // Info del otro usuario
    const [isChatWindowOpen, setIsChatWindowOpen] = useState(false) // Controla si la ventana flotante está visible (S3-FE-055)

    // Estados de paginación
    const [isLoadingHistory, setIsLoadingHistory] = useState(false) 
    const [hasMoreHistory, setHasMoreHistory] = useState(true) // Hay más mensajes al inicio
    
    // Estados de notificación
    const [unreadConversations, setUnreadConversations] = useState({})
    const notificationSoundRef = useRef(new Audio('/assets/notification.mp3'))

    // Función para reproducir el sonido de notificación
    const playNotificationSound = () => {
        try {
            notificationSoundRef.current.play()
        } catch (error) {
            console.warn("No se pudo reproducir el sonido de notificación: ", error)
        }
    }

    // Lógica de Notificación Global (S3-FE-052)
    const handleGlobalNotification = useCallback((message) => {
        playNotificationSound()

        // Actualizar el estado de conversaciones no leídas
        setUnreadConversations(prev => {
            const roomId = message.chat_room_id

            // Si el mensaje viene del usuario actual no contar como no leído global
            if (message.sender_id === currentUserId) return prev 

            const newCount = (prev[roomId] || 0) + 1
            return { ...prev, [roomId]: newCount }
        })
    }, [currentUserId]) // Depende de currentUserId

    // Función para marcar una sala como leída (al cambiar o abrir un chat)
    const markRoomAsRead = useCallback((roomId) => {
        setUnreadConversations(prev => {
            const newState = { ...prev }
            delete newState[roomId]  // Eliminar el contador de esa sala
            return newState
        })
        // TODO: Enviar una petición al backend para marcar como leídos en la DB (extra)
    }, [])

    // Cargar historial de mensajes inicial o más mensajes (S3-CHAT-047)
    const loadHistory = async (roomId, beforeTimestamp = null) => {
        
        if (isLoadingHistory || (!hasMoreHistory && beforeTimestamp)) {
            return []
        }
        
        setIsLoadingHistory(true)

        const token = localStorage.getItem('token') // Usar el token para Auth HTTP
        
        const beforeQuery = beforeTimestamp ? `&before=${beforeTimestamp}` : ''

        try {
            const response = await fetch(`/api/chat/history/${roomId}?${beforeQuery}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error desconocido al cargar historial')
            }

            const newMessages = await response.json() 
            
            // Si se cargan menos de 30 mensajes, es el inicio
            if (newMessages.length < 30) { 
                setHasMoreHistory(false)
            }
            
            if (beforeTimestamp) {
                // Es una carga de más mensajes, insertar al inicio
                setMessages(prevMessages => [...newMessages, ...prevMessages])
            } else {
                // Es la carga inicial, reemplazar
                setMessages(newMessages)
            }
            
            return newMessages

        } catch (error) {
            console.error('Error al cargar el historial de chat: ', error)
            setChatError(`Error al cargar el historial: ${error.message}`)
            return [] 
        } finally {
            setIsLoadingHistory(false)
        }
    }

    // Conexión del Socket
    useEffect(() => {
        // La forma más segura de obtener la cookie JWT es de un contexto de autenticación
        // TODO: Usar el contexto de autenticación para obtener la cookie JWT

        const newSocket = io(SOCKET_SERVER_URL, {
            // El token se pasa por cookie
            auth: {}, 
            withCredentials: true, // Para que la cookie `token` se envíe
        })
        
        socketRef.current = newSocket

        const handleReceiveMessage = (message) => {

            // Si el usuario está en la sala activa, añadir mensaje
            if (message.chat_room_id !== chatRoomId) {
                // S3-FE-052: Mostrar notificación si NO es la sala activa
                handleGlobalNotification(message) 
                return
            }
            
            // Añadir si es de la sala activa
            setMessages(prevMessages => [...prevMessages, message])
        }
        
        // Eventos del Socket

        socketRef.current.on('receive_message', handleReceiveMessage)

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
    }, [token, chatRoomId, handleGlobalNotification])
    
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

            // Cargar el historial inicial
            setHasMoreHistory(true)
            await loadHistory(chat_room_id) 
            
            // Marcar sala como leída al unirse
            markRoomAsRead(chat_room_id)

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

    // Toggle para abrir/cerrar la ventana de chat (S3-FE-055)
    const toggleChatWindow = useCallback(() => {
        setIsChatWindowOpen(prev => !prev)
    }, [])
    
    // Función para abrir la ventana directamente
    const setChatWindowOpen = useCallback((isOpen) => {
        setIsChatWindowOpen(isOpen)
    }, [])
    
    // Función para el scroll
    const loadMoreMessages = async () => {
        if (messages.length === 0 || !chatRoomId) return 
        
        // El cursor es el 'createdAt' del mensaje más antiguo
        const oldestMessageTimestamp = messages[0].createdAt 
        await loadHistory(chatRoomId, oldestMessageTimestamp)
    }


    // Valor del Contexto
    const contextValue = {
        messages,
        chatRoomId,
        isConnected,
        chatError,
        currentChatTarget,
        isLoadingHistory, 
        hasMoreHistory, 
        unreadConversations,
        isChatWindowOpen,
        joinChatRoom,
        sendChatMessage,
        loadMoreMessages,
        markRoomAsRead,
        toggleChatWindow,
        setChatWindowOpen,
    }

    return (
        <ChatSocketContext.Provider value={contextValue}>
            {children}
        </ChatSocketContext.Provider>
    )
}