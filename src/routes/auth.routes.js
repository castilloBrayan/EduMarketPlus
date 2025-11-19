import { Router } from 'express'
import { registerUser, loginUser } from '../controllers/auth.controller.js'

const router = Router()

// Ruta POST para el registro (S1-AUTH-005)
router.post('/register', registerUser)

// Ruta POST para el login (S1-AUTH-006)
router.post('/login', loginUser)

export default router