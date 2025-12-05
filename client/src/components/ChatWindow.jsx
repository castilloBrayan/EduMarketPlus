// src/components/Chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useChatSocket } from '../context/chatSocket.hooks.js'
import { useAuth } from '../context/auth.hooks.js'

const ChatWindow = () => {
    // Obtener el estado y las funciones del contexto de Socket.io
    const { 
        messages, 
        isConnected, 
        chatError, 
        sendChatMessage,
        currentChatTarget
    } = useChatSocket()
    
    // Obtener el ID del usuario actual para diferenciar mensajes
    const { user } = useAuth()
    const currentUserId = user.id

    const [inputMessage, setInputMessage] = useState('')
    const messagesEndRef = useRef(null) // Referencia para poder hacer scroll automático

    // Función para hacer scroll al último mensaje
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

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
                <p>Selecciona una conversación o inicia un chat para empezar</p>
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

            <div className="messages-area">
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
    )
}

export default ChatWindow