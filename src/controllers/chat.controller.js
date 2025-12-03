import ChatMessage from '../models/chatMessage.model.js' // Modelo de MongoDB (S3-DB-042)
import { getChatRoomId, SUPPORT_ROOM_ID } from '../utils/chatUtils.js' 

/**
 * Genera el ID de sala canónico y devuelve el historial
 * GET /api/chat/:targetUserId (Protegida)
 */
export const joinPrivateChat = async (req, res) => {
    // ID del usuario logueado (remitente)
    const senderId = req.user.id 
    // ID del usuario con el que se desea chatear o 'support'
    const targetUserId = req.params.targetUserId 
    
    let chatRoomId

    if (targetUserId === 'support') {
        // Para chat de soporte (sala fija)
        chatRoomId = SUPPORT_ROOM_ID
    } else {
        // Para chat privado (Instructor/Estudiante/Admin)
        const recipientId = parseInt(targetUserId)

        if (isNaN(recipientId)) {
            return res.status(400).json({ error: 'ID de destinatario inválido ' })
        }
        
        // Generar el ID de sala canónico
        chatRoomId = getChatRoomId(senderId, recipientId)
    }

    try {
        // TODO: recuperación del historial  S3-CHAT-046
        
        res.status(200).json({
            message: 'Sala de chat generada con éxito.',
            chat_room_id: chatRoomId, // Devolver ID para unirse a la sala de Socket.io
        })

    } catch (error) {
        console.error('Error al generar sala de chat: ', error)
        res.status(500).json({ error: 'Error interno del servidor al procesar la sala de chat' })
    }
}

/**
 * Manejador interno con la lógica de envío y emisión
 * Escucha al evento 'send_message', guarda en la DB y emite a la sala
 */
export const handleSendMessage = async (socket, data) => {
    // Acceder a la instancia de Socket.io global
    const io = socket.server.get('socketio') 

    const { chat_room_id, content } = data
    const senderId = socket.user.id // Obteniendo de socketAuthMiddleware

    // Validaciones básicas
    if (!chat_room_id || !content || content.trim() === '') {
        console.warn(`[Chat] Mensaje inválido o incompleto de Usuario ID: ${senderId}`)
        // Emitir un error de vuelta al remitente
        socket.emit('chat_error', { message: 'Mensaje incompleto o vacío' })
        return
    }

    try {
        // Guardar mensaje en MongoDB
        const newMessage = new ChatMessage({
            chat_room_id,
            sender_id: senderId,
            content: content.trim(),
            // message_type por defecto 'text'
        })

        await newMessage.save()

        // Emitir el mensaje a todos en la sala (incluido el remitente)
        const messageToEmit = {
            chat_room_id: newMessage.chat_room_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            // TODO: añadir nombre y foto_url del remitente
        }

        // Enviar el mensaje a todos los sockets unidos a esa sala con io.to()
        io.to(chat_room_id).emit('receive_message', messageToEmit)

        console.log(`[Chat] Mensaje enviado por ${senderId} a sala ${chat_room_id}`)

    } catch (error) {
        console.error('Error al guardar/emitir mensaje: ', error)
        socket.emit('chat_error', { message: 'Error interno del servidor al enviar el mensaje' })
    }
}