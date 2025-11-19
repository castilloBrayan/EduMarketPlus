import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js'
import { createCourse, listCourses } from '../controllers/course.controller.js'

const router = Router()

// Ruta pública para listar todos los cursos (S1-COURSE-011)
router.get('/', listCourses) // NO lleva middlewares

// Ruta protegida para la creación de cursos (S1-COURSE-010)
router.post(
    '/',
    authMiddleware, // Debe estar logueado
    roleMiddleware(['Admin', 'Instructor']), // Debe ser Admin o Instructor
    createCourse // Ejecutar la lógica de creación
)

export default router