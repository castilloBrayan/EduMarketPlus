import React from 'react'
import { FaCommentDots, FaWindowClose, FaRegCommentDots } from 'react-icons/fa'
import { useChatSocket } from '../context/chatSocket.hooks.js'
import ChatWindow from '../components/ChatWindow.jsx' // El componente de la ventana principal

import styles from './ChatBox.module.css'

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

    // Construir el className del botón flotante
    const triggerClassNames = [
        styles.chatTrigger,
        totalUnreadCount > 0 ? styles.hasUnread : '', 
    ].join(' ')

    return (
        <>
            {/* Botón Flotante */}
            <div 
                className={triggerClassNames}
                onClick={toggleChatWindow}
            >
                {/* Ícono dinámico */}
                {totalUnreadCount > 0 ? <FaRegCommentDots /> : <FaCommentDots />}
                
                {/* Notificaciones (S3-FE-052) */}
                {totalUnreadCount > 0 && (
                    <span className={styles.unreadBadge}>{totalUnreadCount}</span>
                )}
            </div>

            {/* Ventana del Chat (S3-FE-055) */}
            {isChatWindowOpen && (
                <div className={styles.chatPopupWindow}>
                    <div className={styles.chatPopupHeader}>
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