import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { sendMessage, joinPrivateChat } from '../controllers/chat.controller.js'

const router = Router()

// Ruta HTTP para Unirse a Chat Privado o Soporte
router.get('/:targetUserId', authMiddleware, joinPrivateChat)

export default router