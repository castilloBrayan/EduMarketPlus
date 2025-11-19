import { Router } from 'express'
import { registerUser } from '../controllers/auth.controller.js'

const router = Router()

// Ruta POST para el registro (S1-AUTH-005)
router.post('/register', registerUser)

export default router