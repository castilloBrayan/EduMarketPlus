import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { addCourseToCart } from '../controllers/cart.controller.js'

const router = Router()

// Ruta protegida para agregar un curso al carrito (S2-CART-025)
router.post('/add', authMiddleware, addCourseToCart)

export default router