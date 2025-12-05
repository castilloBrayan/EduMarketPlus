import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { chatAccessMiddleware } from '../middlewares/chat.middleware.js'
import { joinPrivateChat, getConversationsList, getChatHistory } from '../controllers/chat.controller.js'

const router = Router()

// Ruta para obtener la Lista de Conversaciones (S3-CHAT-048)
router.get('/conversations', authMiddleware, getConversationsList)

// Ruta para obtener el historial de Chat con Paginación (S3-CHAT-046/047)
router.get('/history/:room_id', authMiddleware, getChatHistory)

// Ruta HTTP para Unirse a Chat Privado o Soporte
router.get(
    '/:targetUserId', 
    authMiddleware, 
    chatAccessMiddleware, // Se requiere Auth, y verificación de permisos de negocio
    joinPrivateChat
)

export default router