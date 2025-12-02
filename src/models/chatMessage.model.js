import mongoose from 'mongoose'

/**
 * Esquema Mongoose para guardar los mensajes de los chats
 */
const ChatMessageSchema = new mongoose.Schema({
    // Identificador único de la sala/conversación
    // Para agrupar mensajes por conversación (Instructor A con Estudiante B)
    chat_room_id: {
        type: String,
        required: true,
        // Indice para acelerar las búsquedas por sala de chat
        index: true 
    },
    // ID del usuario que envía el mensaje
    sender_id: {
        type: Number, 
        required: true,
    },
    // Contenido del mensaje de chat
    content: {
        type: String,
        required: true,
        trim: true
    },
    // Extra: Tipo de mensaje (texto, imagen o archivo)
    message_type: {
        type: String,
        default: 'text',
        enum: ['text', 'image', 'file'] 
    },
}, { 
    // Manejar automáticamente las marcas de tiempo con Mongoose (createdAt, updatedAt)
    timestamps: true 
})

// Creación del Modelo Mongoose
export const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema)