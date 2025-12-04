import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { sendMessage, joinPrivateChat, getConversationsList } from '../controllers/chat.controller.js'

const router = Router()

// Ruta para obtener la Lista de Conversaciones (S3-CHAT-048)
router.get('/conversations', authMiddleware, getConversationsList)

// Ruta HTTP para Unirse a Chat Privado o Soporte
router.get('/:targetUserId', authMiddleware, joinPrivateChat)

export default router