import { ChatMessage } from '../models/chatMessage.model.js' // Modelo de MongoDB (S3-DB-042)
import { getChatRoomId, SUPPORT_ROOM_ID } from '../utils/chatUtils.js' 
import { pool } from '../config/db.mysql.js' // Conexión al pool de  MySQL

// Límite de mensajes para la carga inicial del historial
const HISTORY_LIMIT = 30

/**
 * Busca el nombre y la foto de un conjunto de IDs de usuario en MySQL
 * Devuelve un mapa de información de usuarios
 */
const fetchUsersInfo = async (userIds) => {
    if (!userIds || userIds.length === 0) {
        return {}
    }

    const values = userIds.map(() => '?').join(',')

    const query = `
        SELECT id, nombre, foto_url
        FROM usuarios
        WHERE id IN (${values})
    `

    const [rows] = await pool.execute(query, userIds)
    
    // Mapea el resultado a un objeto para una búsqueda rápida: { userId: {nombre, foto_url} }
    const usersMap = {}

    rows.forEach(user => {
        usersMap[user.id] = {
            nombre: user.nombre,
            foto_url: user.foto_url
        }
    })

    return usersMap
}

/**
 * Genera el ID de sala canónico y devuelve el historial de mensajes (S3-CHAT-046)
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
        // Obtener los últimos 30 mensajes de MongoDB
        let messages = await ChatMessage.find({ chat_room_id: chatRoomId })
            .sort({ createdAt: -1 }) // Ordena por el más nuevo primero
            .limit(HISTORY_LIMIT)    // Limita a 30 mensajes
            .lean()                  // Convierte el objeto Mongoose a un objeto JS plano

        // Para que los mensajes más antiguos aparezcan primero (flujo comun de un chat)
        messages.reverse()

        // Extraer los IDs únicos de los remitentes
        const senderIds = [...new Set(messages.map(m => m.sender_id))]

        // Obtener la información de nombre y foto de MySQL
        const usersInfoMap = await fetchUsersInfo(senderIds)

        // Relacionar la información del usuario con cada mensaje
        const relatedHistory = messages.map(message => ({
            ...message,
            // Adjunta la info del remitente
            senderInfo: usersInfoMap[message.sender_id] || { nombre: 'Usuario Desconocido', foto_url: 'default-avatar.png' }
        }))

        // Devolver el historial relacionado
        res.status(200).json({
            message: 'Sala de chat generada e historial recuperado con éxito',
            chat_room_id: chatRoomId, // Devolver ID para unirse a la sala de Socket.io
            historial: relatedHistory
        })

    } catch (error) {
        console.error('Error al obtener sala e historial: ', error)
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

        // Obtener la información del remitente de MySQL para el mensaje en tiempo real
        const senderInfoMap = await fetchUsersInfo([senderId])
        const senderInfo = senderInfoMap[senderId] || { nombre: 'Usuario Desconocido', foto_url: 'default-avatar.png' }

        // Emitir el mensaje a todos en la sala (incluido el remitente)
        const messageToEmit = {
            _id: newMessage._id, // ID de MongoDB
            chat_room_id: newMessage.chat_room_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            senderInfo: senderInfo,
        }

        // Enviar el mensaje a todos los sockets unidos a esa sala con io.to()
        io.to(chat_room_id).emit('receive_message', messageToEmit)

        console.log(`[Chat] Mensaje enviado por ${senderId} a sala ${chat_room_id}`)

    } catch (error) {
        console.error('Error al guardar/emitir mensaje: ', error)
        socket.emit('chat_error', { message: 'Error interno del servidor al enviar el mensaje' })
    }
}