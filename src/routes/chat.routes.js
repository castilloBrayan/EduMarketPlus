import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { chatAccessMiddleware } from '../middlewares/chat.middleware.js'
import { joinPrivateChat, getConversationsList } from '../controllers/chat.controller.js'

const router = Router()

// Ruta para obtener la Lista de Conversaciones (S3-CHAT-048)
router.get('/conversations', authMiddleware, getConversationsList)

// Ruta HTTP para Unirse a Chat Privado o Soporte
router.get(
    '/:targetUserId', 
    authMiddleware, 
    chatAccessMiddleware, // Se requiere Auth, y verificación de permisos de negocio
    joinPrivateChat
)

export default router