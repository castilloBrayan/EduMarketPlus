import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { addCourseToCart, getCart, removeCourseFromCart, checkout } from '../controllers/cart.controller.js'

const router = Router()

// Ruta protegida para agregar un curso al carrito (S2-CART-025)
router.post('/add', authMiddleware, addCourseToCart)

// Ruta para obtener carrito (S2-CART-026)
router.get('/', authMiddleware, getCart)

// Ruta para eliminar curso del carrito (S2-CART-027)
router.delete('/:id', authMiddleware, removeCourseFromCart) // El :id sería el ID del detalle_orden

// Ruta para procesar el checkout (S2-CART-028)
router.post('/checkout', authMiddleware, checkout)

export default router