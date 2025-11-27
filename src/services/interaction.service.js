import { pool } from '../config/db.mysql.js'
import Interaction from '../models/interaction.model.js'

/**
 * Lógica para Calcular y Actualizar el Rating Promedio de un Curso (S2-INTERACT2-030)
 * Esta función consulta MongoDB, calcula el promedio y actualiza el campo
 * 'rating_promedio' en la tabla 'cursos' de MySQL
 * Necesita el ID del curso a actualizar
 */
export async function updateCourseAverageRating(courseId) {
    try {

        // Asegurar que el cursoId sea un número para la consulta de MongoDB
        const courseIdNum = parseInt(cursoId)
        if (isNaN(courseIdNum)) {
            console.error('ID de curso inválido en updateCourseAverageRating')
            return // Salir si el ID no es válido
        }

        // Calcular el rating promedio usando Aggregate en MongoDB (Interaction Model)
        // Busca todas las interacciones (ratings) para el curso y calcula el promedio
        const aggregationResult = await Interaction.aggregate([
            { $match: { curso_id: courseIdNum } }, 
            {
                $group: {
                    _id: '$curso_id',
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ])

        // Extraer los resultados. Si no hay interacciones, el promedio es 0.
        const averageRating = aggregationResult.length > 0 ? aggregationResult[0].averageRating.toFixed(1) : 0.0
        const totalRatings = aggregationResult.length > 0 ? aggregationResult[0].totalRatings : 0

        // 2. Actualizar la tabla de cursos en MySQL
        const updateQuery = `
            UPDATE cursos
            SET rating_promedio = ?, total_ratings = ?
            WHERE id = ?;
        `
        await pool.execute(updateQuery, [averageRating, totalRatings, courseId])

        console.log(`Rating para el curso ${courseId} actualizado: ${averageRating} con ${totalRatings} votos`)

        return { rating_promedio: averageRating, total_ratings: totalRatings }

    } catch (error) {
        console.error(`Error al actualizar el rating promedio del curso ${courseId}: `, error.message)
        throw new Error('Error interno al calcular y actualizar el rating promedio del curso')
    }
}