import React from 'react'
import { FaCommentDots, FaWindowClose, FaRegCommentDots } from 'react-icons/fa'
import { useChatSocket } from '../context/chatSocket.hooks.js'
import ChatWindow from '../components/ChatWindow.jsx' // El componente de la ventana principal

const ChatBox = () => {
    const { 
        isChatWindowOpen, 
        toggleChatWindow, 
        unreadConversations,
        markRoomAsRead,
        chatRoomId 
    } = useChatSocket()
    
    // Contar el número total de conversaciones con mensajes no leídos
    const totalUnreadCount = Object.keys(unreadConversations).length

    // Función para cerrar, que también marca la sala activa como leída si tiene mensajes
    const handleClose = () => {
        if (chatRoomId && unreadConversations[chatRoomId]) {
             // Si se cierra el chat, marcar como leídos los mensajes de la sala activa
            markRoomAsRead(chatRoomId)
        }
        toggleChatWindow()
    }

    return (
        <>
            {/* Botón Flotante */}
            <div 
                className={`chat-trigger ${isChatWindowOpen ? 'open' : ''} ${totalUnreadCount > 0 ? 'has-unread' : ''}`}
                onClick={toggleChatWindow}
            >
                {/* Ícono dinámico */}
                {totalUnreadCount > 0 ? <FaRegCommentDots /> : <FaCommentDots />}
                
                {/* Notificaciones (S3-FE-052) */}
                {totalUnreadCount > 0 && (
                    <span className="unread-badge">{totalUnreadCount}</span>
                )}
            </div>

            {/* Ventana del Chat (S3-FE-055) */}
            {isChatWindowOpen && (
                <div className="chat-popup-window">
                    <div className="chat-popup-header">
                        <span>Chat en Vivo</span>
                        <button onClick={handleClose}>
                            <FaWindowClose />
                        </button>
                    </div>
                    {/* Renderizar el ChatWindow dentro del popup */}
                    <ChatWindow />
                </div>
            )}
        </>
    )
}

export default ChatBox