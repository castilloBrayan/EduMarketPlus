import { Router } from 'express'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js'
import { createCourse, listCourses, getCourseDetails, getMyCourses } from '../controllers/course.controller.js'

const router = Router()

// Endpoint para obtener los cursos comprados por el usuario (S2-COURSE-029)
router.get('/my', authMiddleware, getMyCourses)

// Ruta pública para listar todos los cursos (S1-COURSE-011)
router.get('/', listCourses) // No lleva middlewares

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