import { ChatMessage } from '../models/chatMessage.model.js' // Modelo de MongoDB (S3-DB-042)
import { getChatRoomId, SUPPORT_ROOM_ID } from '../utils/chatUtils.js' 
import { pool } from '../config/db.mysql.js' // Conexión al pool de  MySQL

// Límite de mensajes para la carga inicial del historial
const HISTORY_LIMIT = 30

// ID para el usuario de Soporte Técnico
const SUPPORT_USER_ID = 2

/**
 * Buscar el nombre y la foto de un conjunto de IDs de usuario en MySQL
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
            foto_url: user.foto_url || 'default-avatar.png' // Valor por defecto si no hay foto
        }
    })

    return usersMap
}

/**
 * Identificar al otro usuario en una sala de chat privada
 */
const getOtherUserId = (chatRoomId, currentUserId) => {
    // Si es la sala de soporte se maneja aparte con el ID fijo
    if (chatRoomId === SUPPORT_ROOM_ID) {
        return SUPPORT_USER_ID
    }
    
    // El formato del ID de sala es "chat_IDMENOR_IDMAYOR"
    // Eliminar 'chat' de parts con slice(1)
    const parts = chatRoomId.split('_').slice(1).map(id => parseInt(id))


    // Si la sala no tiene el formato correcto, o solo un ID, retornar null
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null
    }

    // Busca el ID que NO es el del usuario actual
    const otherUserId = parts.find(id => id !== currentUserId)

    // Devuelve un número válido
    return (otherUserId && !isNaN(otherUserId)) ? otherUserId : null
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

    // Parámetro de paginación, fecha del mensaje más antiguo que ya tiene el cliente
    const beforeDate = req.query.before
    
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
        // Construir el Filtro de MongoDB
        const filter = { 
            chat_room_id: chatRoomId 
        }

        // Lógica de paginación, si 'beforeDate' está presente, filtrar mensajes anteriores
        if (beforeDate) {
            try {
                // Asegurar que la fecha sea válida antes de usarla
                const date = new Date(beforeDate)
                if (isNaN(date)) throw new Error('Fecha inválida')
                
                // Usar $lt (Less Than) para encontrar mensajes más antiguos que la fecha proporcionada
                filter.createdAt = { $lt: date } 
            } catch (e) {
                // Si la fecha es inválida, ignorar el filtro de paginación y devolver la carga inicial
                console.warn(`[Paginación] Fecha inválida ('${beforeDate}'). Ignorando filtro`)
            }
        }

        // Ordena por el más nuevo primero (descendente)
        let messages = await ChatMessage.find(filter)
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

        // Enviar la respuesta
        const responseMessage = beforeDate 
            ? `Carga de ${relatedHistory.length} mensajes adicionales exitosa`
            : 'Sala de chat generada e historial inicial recuperado con éxito'

        // Devolver el historial relacionado, si lo hay
        res.status(200).json({
            message: responseMessage,
            chat_room_id: chatRoomId, // Devolver ID para unirse a la sala de Socket.io
            historial: relatedHistory
        })

    } catch (error) {
        console.error('Error al obtener historial de chat: ', error)
        res.status(500).json({ error: 'Error interno del servidor al obtener historial de chat' })
    }
}

/**
 * Obtiene la lista de conversaciones del usuario logueado (S3-CHAT-048)
 * GET /api/chat/conversations (Protegida)
 */
export const getConversationsList = async (req, res) => {
    const userId = req.user.id;
    // Usamr el ID del usuario en formato string para la búsqueda regex
    const userIdString = userId.toString()

    try {
        // Encontrar el último mensaje de cada sala
        const conversations = await ChatMessage.aggregate([
            {
                $match: {
                    $or: [
                        // Sala de soporte
                        { chat_room_id: SUPPORT_ROOM_ID }, 
                        // Salas privadas, donde el ID del usuario aparece en el chat_room_id
                        { chat_room_id: { $regex: new RegExp(`^chat_(${userIdString})_(\\d+)$|^chat_(\\d+)_(${userIdString})$`) } }
                    ]
                }
            },
            
            // Ordenar por fecha de creación descendente
            {
                $sort: { createdAt: -1 }
            },

            // Agrupar por chat_room_id y tomar el documento completo del mensaje más reciente
            {
                $group: {
                    _id: '$chat_room_id', // El ID de la sala
                    lastMessage: { $first: '$$ROOT' } 
                }
            },

            // Proyectar los campos que necesitamos
            {
                $project: {
                    _id: 0, 
                    chat_room_id: '$_id',
                    lastMessageContent: '$lastMessage.content',
                    lastMessageCreatedAt: '$lastMessage.createdAt',
                    lastMessageSenderId: '$lastMessage.sender_id', 
                }
            }
        ])

        if (conversations.length === 0) {
            return res.status(200).json({ 
                message: 'No se encontraron conversaciones activas',
                conversations: [] 
            })
        }

        // Procesar y preparar las IDs para la consulta a MySQL
        const otherUserIds = []

        const processedConversations = conversations.map(conversation => {
            const isSupport = conversation.chat_room_id === SUPPORT_ROOM_ID
            let otherUserId = null

            if (isSupport) {
                otherUserId = SUPPORT_USER_ID
            } else {
                // Obtener el ID del otro usuario de la sala
                otherUserId = getOtherUserId(conversation.chat_room_id, userId)
            }

            // Recolectar la ID solo si es un chat de usuario (no soporte)
            if (otherUserId && otherUserId !== SUPPORT_USER_ID) {
                otherUserIds.push(otherUserId);
            }

            return {
                ...conversation,
                other_user_id: otherUserId, // Añadir el ID del otro usuario
                is_support_chat: isSupport
            }
        }).filter(conversation => conversation.other_user_id !== null) // Eliminar posibles conversaciones con IDs inválidas

        
        // Obtener la información de los usuarios de MySQL
        const uniqueOtherUserIds = [...new Set(otherUserIds)]
        const usersInfoMap = await fetchUsersInfo(uniqueOtherUserIds)
        
        // Añadir el info del usuario de soporte al mapa para la fusión
        usersInfoMap[SUPPORT_USER_ID] = { nombre: 'Soporte Técnico', foto_url: '/support-avatar.png' }; 

        
        // Fusionar la información y construir la respuesta final
        const relatedConversations = processedConversations.map(conversation => {
            const userInfo = usersInfoMap[conversation.other_user_id] || { nombre: 'Usuario Eliminado', foto_url: 'default-avatar.png' }
            
            return {
                chat_room_id: conversation.chat_room_id,
                is_support_chat: conversation.is_support_chat,
                other_user: {
                    id: conversation.other_user_id,
                    nombre: userInfo.nombre,
                    foto_url: userInfo.foto_url,
                },
                last_message: {
                    content: conversation.lastMessageContent,
                    createdAt: conversation.lastMessageCreatedAt,
                    // Saber si el último mensaje fue enviado por el usuario actual
                    is_sent_by_me: conversation.lastMessageSenderId === userId 
                }
            }
        })
        
        // Ordenar el resultado final por fecha del último mensaje (más reciente primero)
        relatedConversations.sort((a, b) => b.last_message.createdAt.getTime() - a.last_message.createdAt.getTime())

        // Enviar respuesta
        res.status(200).json({
            message: 'Lista de conversaciones recuperada con éxito',
            conversations: relatedConversations
        })

    } catch (error) {
        console.error('Error al obtener la lista de conversaciones: ', error)
        res.status(500).json({ error: 'Error interno del servidor al obtener la lista de conversaciones' })
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