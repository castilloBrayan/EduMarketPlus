import { pool } from '../config/db.mysql.js'

// Roles y clasificaciones válidas para el contexto del proyecto
const VALID_CLASSIFICATIONS = ['Basico', 'Intermedio', 'Avanzado']

/**
 * Permite a Instructores/Admin crear un nuevo curso
 * POST /api/courses (Protegida)
 */
export const createCourse = async (req, res) => {
    // El ID del instructor/admin que crea el curso viene de req.user
    const instructor_id = req.user.id
    
    // Datos del curso vienen del cuerpo de la petición
    const {
        titulo,
        descripcion,
        precio,
        clasificacion,
        imagen_url
        // NOTE: Las categorías y la imagen secundaria no se incluyen en S1 según el ticket
    } = req.body

    // Validación de Campos No Nulos (Requerimiento)
    if (!titulo || !descripcion || precio === undefined || !clasificacion) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios: título, descripción, precio y clasificación'
        })
    }

    // Validación de Datos Específicos
    if (isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
        return res.status(400).json({
            error: 'El precio debe ser un número positivo'
        })
    }

    // Validación de Clasificación (Basico, Intermedio, Avanzado)
    if (!VALID_CLASSIFICATIONS.includes(clasificacion)) {
        return res.status(400).json({
            error: `Clasificación inválida, clasificaciones válidas: ${VALID_CLASSIFICATIONS.join(', ')}`
        })
    }

    // Inserción en MySQL
    try {
        const insertQuery = `
            INSERT INTO cursos
            (titulo, descripcion, precio, clasificacion, imagen_url, instructor_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `
        const [result] = await pool.execute(insertQuery, [
            titulo,
            descripcion,
            parseFloat(precio),
            clasificacion,
            imagen_url || null, // Permite NULL si no se proporciona imagen_url
            instructor_id
        ])

        // Respuesta exitosa
        res.status(201).json({
            message: 'Curso creado exitosamente',
            courseId: result.insertId
        })
        
    } catch (error) {
        console.error('Error al crear el curso: ', error)
        // Error 400 si la clave foránea (instructor_id) falla, aunque con authMiddleware no debería ocurrir
        res.status(500).json({
            error: 'Error interno del servidor al crear el curso'
        })
    }
}