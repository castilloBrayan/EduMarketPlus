import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js'
import { createCourse, listCourses, getCourseDetails } from '../controllers/course.controller.js'

const router = Router()

// Ruta pública para listar todos los cursos (S1-COURSE-011)
router.get('/', listCourses) // NO lleva middlewares

// Ruta pública para el detalle del curso (S1-COURSE-012)
router.get('/:id', getCourseDetails) // Definición de ruta con parámetro :id

// Ruta protegida para la creación de cursos (S1-COURSE-010)
router.post(
    '/',
    authMiddleware, // Debe estar logueado
    roleMiddleware(['Admin', 'Instructor']), // Debe ser Admin o Instructor
    createCourse // Ejecutar la lógica de creación
)

export default router