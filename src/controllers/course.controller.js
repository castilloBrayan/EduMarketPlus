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
        imagen_url,
        video_url
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
            (titulo, descripcion, precio, clasificacion, imagen_url, video_url, instructor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        const [result] = await pool.execute(insertQuery, [
            titulo,
            descripcion,
            parseFloat(precio),
            clasificacion,
            imagen_url || null, // Permite NULL si no se proporciona imagen_url
            video_url || null, // Permite NULL si no se proporciona video_url
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

/**
 * Obtiene y lista todos los cursos del catálogo
 * GET /api/courses (Pública)
 */
export const listCourses = async (req, res) => {
    try {
        // Consulta SQL para obtener todos los cursos
        // Incluimos el nombre del instructor (JOIN) para enriquecer el catálogo
        const coursesQuery = `
            SELECT
                c.id, 
                c.titulo, 
                c.descripcion, 
                c.precio, 
                c.clasificacion, 
                c.imagen_url,
                c.video_url,
                c.instructor_id,
                u.nombre AS instructor_nombre,
                u.foto_url AS instructor_foto_url
            FROM cursos c
            JOIN usuarios u ON c.instructor_id = u.id
            ORDER BY c.id DESC;
        `

        // Ejecutamos la consulta, [rows] contiene el array de cursos
        const [courses] = await pool.execute(coursesQuery)

        // Respuesta exitosa
        // Devolver un array vacío si no hay cursos
        res.status(200).json({
            message: 'Lista de cursos recuperada exitosamente',
            count: courses.length,
            data: courses
        })
    
    } catch (error) {
        console.error('Error al listar los cursos: ', error)
        res.status(500).json({
            error: 'Error interno del servidor al obtener el catálogo'
        })
    }
}

/**
 * Obtiene la información detallada de un curso específico por ID
 * GET /api/courses/:id (Pública), lectura de Parámetros
 */
export const getCourseDetails = async (req, res) => {
    // Capturamos el ID del curso de los parámetros de la URL
    const courseId = req.params.id
    
    try {
        // Consulta SQL para obtener un curso específico y sus detalles de instructor
        const courseQuery = `
            SELECT
                c.id,
                c.titulo,
                c.descripcion,
                c.precio,
                c.clasificacion,
                c.imagen_url,
                c.video_url,
                c.instructor_id,
                u.nombre AS instructor_nombre,
                u.foto_url AS instructor_foto_url
            FROM cursos c
            JOIN usuarios u ON c.instructor_id = u.id
            WHERE c.id = ?;
        `

        // Ejecutar consulta, usando el courseId en la cláusula WHERE
        const [courses] = await pool.execute(courseQuery, [courseId])

        const course = courses[0]

        // Manejar caso de curso no encontrado (404)
        if (!course) {
            return res.status(404).json({
                error: `Curso con ID ${courseId} no encontrado`
            })
        }

        // Respuesta exitosa
        res.status(200).json({
            message: 'Detalles del curso recuperados exitosamente',
            data: course
        })

    } catch (error) {
        console.error(`Error al obtener el detalle del curso ID ${courseId}: `, error)
        res.status(500).json({
            error: 'Error interno del servidor al obtener el detalle del curso'
        })
    }
}