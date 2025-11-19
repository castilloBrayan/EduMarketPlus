import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js'
import { updateUserRole } from '../controllers/auth.controller.js'

const router = Router()

// Ruta protegida para la gestión de roles (S1-AUTH-009)
router.put(
    '/:id/role',
    authMiddleware, // Debe estar logueado
    roleMiddleware(['Admin']), // Debe ser Admin
    updateUserRole // Ejecutar la lógica de cambio de rol
)

export default router