import { Router } from 'express'
import { registerUser, loginUser, logoutUser } from '../controllers/auth.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js' // Necesario para proteger el logout

const router = Router()

// Ruta POST para el registro (S1-AUTH-005)
router.post('/register', registerUser)

// Ruta POST para el login (S1-AUTH-006)
router.post('/login', loginUser)

// Ruta POST para el logout (S1-BE-017)
router.post('/logout', authMiddleware, logoutUser)

export default router