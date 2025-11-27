import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { publishInteraction, getCourseInteractions } from '../controllers/interaction.controller.js'

const router = Router()

// Ruta para publicar un nuevo rating/comentario (Protegida) S2-INTERACT1-030
router.post('/', authMiddleware, publishInteraction)

// Ruta para obtener todos los ratings/comentarios de un curso (Pública)
router.get('/:cursoId', getCourseInteractions)

export default router