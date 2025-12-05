import React, { useState, useEffect } from 'react'
import { useChatSocket } from '../context/chatSocket.hooks.js'
import { useAuth } from '../context/auth.hooks.js'


const ConversationsList = () => {
    const { 
        joinChatRoom, 
        chatRoomId: activeRoomId, 
        unreadConversations 
    } = useChatSocket()
    
    const { token } = useAuth()
    
    const [conversations, setConversations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Cargar la lista de conversaciones al inicio
    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/chat/conversations`)
                
                if (!response.ok) {
                    throw new Error('No se pudo cargar la lista de conversaciones')
                }
                
                const data = await response.json()
                setConversations(data)

            } catch (err) {
                console.error(err)
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        if (token) {
            fetchConversations()
        }
    }, [token])


    // Función para manejar la selección de una conversación
    const handleSelectConversation = (targetUserId) => {
        joinChatRoom(targetUserId)
    }

    if (isLoading) {
        return <div className="conversations-list-loading">Cargando conversaciones...</div>
    }

    if (error) {
        return <div className="conversations-list-error">Error: {error}</div>
    }

    return (
        <div className="conversations-list-container">
            <h3>Conversaciones Activas</h3>
            <ul className="conversation-list">
                {conversations.map(conv => {
                    // Obtener la cuenta de no leídos del estado global (S3-FE-052)
                    const unreadCount = unreadConversations[conv.chat_room_id] || 0
                    const isActive = conv.chat_room_id === activeRoomId

                    return (
                        <li 
                            key={conv.chat_room_id} 
                            className={`conversation-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleSelectConversation(conv.target_user_id)}
                        >
                            <img 
                                src={conv.target_user_avatar || 'default-avatar.png'} 
                                alt={conv.target_user_name} 
                                className="avatar"
                            />
                            <div className="info">
                                <p className="name">
                                    {conv.target_user_name}
                                </p>
                                <p className="last-message">
                                    {conv.last_message ? conv.last_message.substring(0, 30) + '...' : 'Inicia la conversación'}
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <span className="unread-badge">
                                    {unreadCount}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default ConversationsList