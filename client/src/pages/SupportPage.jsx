import React from 'react'
import ChatWindow from '../components/ChatWindow.jsx'
import ConversationsList from '../components/ConversationsList.jsx'


const SupportPage = () => {
    return (
        <div className="support-page-container">
            <h1>Centro de Soporte y Conversaciones</h1>
            
            <div className="chat-layout">
                {/* Lado izquierdo: Lista de conversaciones (S3-FE-053) */}
                <div className="conversations-sidebar">
                    <ConversationsList />
                </div>
                
                {/* Lado derecho: Ventana de Chat (S3-FE-051) */}
                <div className="chat-main-window">
                    <ChatWindow />
                </div>
            </div>
        </div>
    )
}

export default SupportPage