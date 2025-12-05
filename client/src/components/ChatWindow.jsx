// src/components/Chat/ChatWindow.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useChatSocket } from '../context/chatSocket.hooks.js'
import { useAuth } from '../context/auth.hooks.js'

const ChatWindow = () => {
    // Obtener el estado y las funciones del contexto de Socket.io
    const { 
        messages, 
        isConnected, 
        chatError, 
        sendChatMessage,
        currentChatTarget,
        isLoadingHistory, // Para deshabilitar la carga mientras se carga
        hasMoreHistory, // Para no intentar cargar si ya no hay más
        loadMoreMessages // Función de carga de paginación
    } = useChatSocket()
    
    // Obtener el ID del usuario actual para diferenciar mensajes
    const { user } = useAuth()
    const currentUserId = user.id

    const [inputMessage, setInputMessage] = useState('')
    const messagesEndRef = useRef(null) // Referencia para poder hacer scroll automático
    const messagesContainerRef = useRef(null) // Referencia para el contenedor de scroll

    // Función para hacer scroll al último mensaje
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Lógica de Scroll Infinito
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current

        if (container && !isLoadingHistory && hasMoreHistory) {
            // ScrollTop es 0 cuando se llega al final
            if (container.scrollTop === 0) {
                console.log('Detectado final de scroll, cargando más mensajes...')
                loadMoreMessages()
            }
        }
    }, [isLoadingHistory, hasMoreHistory, loadMoreMessages])

    // Hook para adjuntar y limpiar el listener de scroll
    useEffect(() => {
        const container = messagesContainerRef.current
        if (container) {
            container.addEventListener('scroll', handleScroll)
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll)
            }
        }
    }, [handleScroll])

    // Efecto para mantener la posición de scroll después de cargar mensajes anteriores
    const previousScrollHeight = useRef(0)

    useEffect(() => {
        const container = messagesContainerRef.current
        
        // La carga inicial (messages.length <= 30) siempre va al final
        if (messages.length > 30 && container) {
            const newScrollHeight = container.scrollHeight
            const heightDifference = newScrollHeight - previousScrollHeight.current
            
            // Si la altura creció (se cargaron mensajes), ajustar la posición de scroll
            if (heightDifference > 0) {
                container.scrollTop = heightDifference 
            }
        } else if (messages.length <= 30 && messages.length > 0) {
            // Scroll al final para la carga inicial
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
        
        // Guardar la altura actual para la siguiente comparación de paginación
        previousScrollHeight.current = container ? container.scrollHeight : 0

    }, [messages]) // Depende de la lista de mensajes
    
    // Ejecutar scroll cada vez que la lista de mensajes se actualiza
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = (e) => {
        e.preventDefault()

        if (inputMessage.trim()) {
            sendChatMessage(inputMessage) // Llamar a la función del hook S3-FE-050
            setInputMessage('')
        }
    }

    // Si no hay chat activo o no está conectado
    if (!currentChatTarget) {
        return (
            <div className="chat-window-placeholder">
                <p>Selecciona una conversación para empezar a chatear</p>
                {chatError && <p className="error-message">Error: {chatError}</p>}
                {!isConnected && <p className="warning-message">Estado: Desconectado</p>}
            </div>
        )
    }

    return (
        <div className="chat-window-container">
            <header className="chat-header">
                <h2>Chat con: {currentChatTarget.nombre || 'Cargando...'}</h2>
                <span className={isConnected ? 'status-online' : 'status-offline'}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
            </header>

            {/* 'ref' y estilo para el scroll */}
            <div className="messages-container" ref={messagesContainerRef} style={{ overflowY: 'scroll', height: '400px' }}>
                <div className="messages-area">
                    {/* Indicador de carga para paginación */}
                    {isLoadingHistory && <div className="loading-indicator">Cargando mensajes anteriores...</div>}

                    {/* Mensaje si no hay más historial */}
                    {!hasMoreHistory && !isLoadingHistory && messages.length > 0 && (
                        <div className="end-of-history">Inicio de la conversación</div>
                    )}
                    
                    {messages.map((message, index) => {
                        // Determinar si el mensaje es del usuario logueado
                        const isMyMessage = message.sender_id === currentUserId
                        
                        return (
                            <div key={message._id || index} 
                                className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'}`}>
                                <div className="message-content">
                                    <p>{message.content}</p>
                                    <span className="timestamp">
                                        {new Date(message.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                {/* Mostrar foto de perfil */}
                                <img 
                                    src={message.senderInfo?.foto_url || 'default-avatar.png'} 
                                    alt={message.senderInfo?.nombre || 'User'} 
                                    className="message-avatar" 
                                />
                            </div>
                        )
                    })}
                    {/* Referencia para el hacer scroll */}
                    <div ref={messagesEndRef} /> 
                </div>

                <form className="input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        disabled={!isConnected || !currentChatTarget}
                    />
                    <button type="submit" disabled={!isConnected || !currentChatTarget || !inputMessage.trim()}>
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ChatWindow