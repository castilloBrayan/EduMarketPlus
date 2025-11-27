import { Interaction } from '../models/interaction.model.js'
import { pool } from '../config/db.mysql.js'
import mongoose from 'mongoose'

// Constante para el estado de compra 'COMPLETADA'
const COMPLETED_STATUS = 'COMPLETADA'

/**
 * Publicar un nuevo rating/comentario de un curso
 * POST /api/interactions
 */
export const publishInteraction = async (req, res) => {
    const usuarioId = req.user.id // ID del usuario logueado
    const { cursoId, rating, comentario } = req.body

    // Validaciones Básicas
    if (!cursoId || !rating) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: cursoId y rating' })
    }
    
    const parsedRating = parseInt(rating)
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'El rating debe ser un número entero entre 1 y 5' })
    }

    // Verificar que el usuario haya comprado el curso (requisito)
    try {
        const [purchaseCheck] = await pool.execute(
            `
            SELECT COUNT(do.id) AS count
            FROM detalles_orden do
            JOIN ordenes o ON do.orden_id = o.id
            WHERE o.usuario_id = ? AND do.curso_id = ? AND o.estado = ?
            `,
            [usuarioId, cursoId, COMPLETED_STATUS]
        )

        // Si el conteo es 0, no ha comprado el curso
        if (purchaseCheck[0].count === 0) {
            return res.status(403).json({ 
                error: 'Acceso denegado. Solo puedes calificar cursos que has COMPRADO' 
            })
        }
    } catch (error) {
        console.error('Error al verificar compra del curso: ', error.message)
        return res.status(500).json({ error: 'Error interno al verificar la compra' })
    }

    // Crear la interacción en MongoDB (o actualizar si ya existe, aunque la restricción 'única' lo evita)
    try {
        const nuevaInteraccion = new Interaction({
            cursoId,
            usuarioId,
            rating: parsedRating,
            comentario: comentario || null,
            fechaPublicacion: new Date(),
        })

        await nuevaInteraccion.save()

        // Ejecutar la lógica de cálculo y actualización de rating promedio (S2-INTERACT2-030)
        await updateCourseAverageRating(cursoId)

        res.status(201).json({ 
            message: 'Comentario y Rating publicados exitosamente',
            data: nuevaInteraccion
        })

    } catch (error) {
        // Manejar el error de clave duplicada (usuario ya comentó este curso)
        if (error.code === 11000) {
             return res.status(409).json({ 
                error: 'Ya has calificado este curso' 
            })
        }
        console.error('Error al publicar interacción: ', error.message)
        res.status(500).json({ error: 'Error interno del servidor al publicar la interacción' })
    }
}

/**
 * Lógica: Obtener todos los ratings/comentarios de un curso específico
 * GET /api/interactions/:cursoId
 */
export const getCourseInteractions = async (req, res) => {
    const { cursoId } = req.params

    if (!cursoId) {
        return res.status(400).json({ error: 'Se requiere el ID del curso' })
    }

    // Convertir a número
    const parsedCourseId = parseInt(cursoId)
    if (isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'ID de curso inválido' })
    }

    try {
        // Obtener todas las interacciones para el curso
        const interactions = await Interaction.find({ cursoId: parsedCourseId })
            .sort({ fechaPublicacion: -1 }) // Mostrar los más recientes primero
            .exec()

        // Si no hay interacciones, devolver lista vacía (200 OK)
        if (interactions.length === 0) {
            return res.status(200).json({ 
                message: 'Aún no hay calificaciones para este curso',
                data: [],
                count: 0
            })
        }

        // Obtener los nombres y fotos de los usuarios de MySQL
        // Extraer los IDs únicos de los usuarios que comentaron
        const userIds = [...new Set(interactions.map(i => i.usuarioId))]
        
        // Consultar la base de datos de MySQL para obtener los nombres y fotos
        const [users] = await pool.execute(
            `SELECT id, nombre, foto_url FROM usuarios WHERE id IN (?)`, 
            [userIds]
        )

        // Buscar los datos del usuario
        const userMap = users.reduce((map, user) => {
            map[user.id] = { 
                nombre: user.nombre, 
                foto_url: user.foto_url 
            }
            return map
        }, {})

        // Combinar data de interacciones con datos de usuario
        const combinedData = interactions.map(interaction => {
            const userData = userMap[interaction.usuarioId] || { nombre: 'Usuario Desconocido', foto_url: 'default-avatar.png' }
            
            return {
                _id: interaction._id,
                rating: interaction.rating,
                comentario: interaction.comentario,
                fechaPublicacion: interaction.fechaPublicacion,
                usuarioNombre: userData.nombre,
                usuarioFotoUrl: userData.foto_url,
                // Incluir el ID de usuario para que el FE sepa si puede editar
                usuarioId: interaction.usuarioId 
            }
        })

        res.status(200).json({
            message: 'Interacciones recuperadas exitosamente',
            data: combinedData,
            count: combinedData.length
        })

    } catch (error) {
        console.error('Error al obtener interacciones del curso: ', error.message)
        res.status(500).json({ error: 'Error interno del servidor al obtener las interacciones' })
    }
}