import { Router } from 'express'
import { registerUser, loginUser, logoutUser, verifySession } from '../controllers/auth.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js' // Necesario para proteger el logout y verificación de sesión

const router = Router()

// Ruta POST para el registro (S1-AUTH-005)
router.post('/register', registerUser)

// Ruta POST para el login (S1-AUTH-006)
router.post('/login', loginUser)

// Ruta POST para el logout (S1-BE-017)
router.post('/logout', authMiddleware, logoutUser)

// Ruta GET para verificar la sesión (S1-BE-029)
router.get('/verify', authMiddleware, verifySession)

export default router