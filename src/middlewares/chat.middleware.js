import { pool } from '../config/db.mysql.js'

// Alias para identificar el chat de soporte
const SUPPORT_USER_ID = '2'
const SUPPORT_ROLE_NAME = 'Soporte' 

/**
 * Middleware para validar si el usuario logueado (remitente) tiene permiso
 * para iniciar una conversación con el usuario objetivo (targetUserId) según su rol (S3-CHAT-049)
 */
export const chatAccessMiddleware = async (req, res, next) => {
    // Información del usuario logueado (adjuntada por authMiddleware)
    const senderId = req.user.id
    const senderRole = req.user.rol
    
    // ID del destinatario de la ruta
    const targetUserIdParam = req.params.targetUserId
    
    // Manejo del Chat de Soporte
    if (targetUserIdParam === SUPPORT_USER_ID) {
        // NOTE: Visitante/Estudiante/Instructor pueden chatear con Soporte
        return next()
    }

    // Convertir el ID del destinatario a número para chats privados
    const targetUserId = parseInt(targetUserIdParam)
    
    // Validar que sea un ID numérico válido
    if (isNaN(targetUserId)) {
        return res.status(400).json({ error: 'ID de destinatario inválido' })
    }
    
    // Si el usuario desea iniciar un chat el mismo
    if (senderId === targetUserId) {
        return res.status(403).json({ error: 'No puedes iniciar un chat contigo mismo' })
    }

    try {
        // Obtener el Rol del Usuario Objetivo (targetUserId)
        const [rows] = await pool.execute(
            `SELECT rol FROM usuarios WHERE id = ?`, 
            [targetUserId]
        )
        
        const targetUserRole = rows.length > 0 ? rows[0].rol : null

        if (!targetUserRole) {
            return res.status(404).json({ error: 'El destinatario no fue encontrado' })
        }
        
        // Aplicar la Lógica de Conexión
        let isAccessAllowed = false
        
        if (senderRole === 'Estudiante') {
            // NOTE: Estudiante solo puede chatear con Instructores de sus cursos comprados
            if (targetUserRole === 'Instructor') {
                const query = `
                    SELECT COUNT(DISTINCT C.instructor_id) AS is_instructor
                    FROM detalles_orden AS DO
                    JOIN ordenes AS O ON DO.orden_id = O.id
                    JOIN cursos AS C ON DO.curso_id = C.id
                    WHERE O.usuario_id = ? 
                      AND C.instructor_id = ? 
                      AND O.estado <> 'PENDIENTE' -- 'PENDIENTE' es el carrito no completado
                `
                const [result] = await pool.execute(query, [senderId, targetUserId])
                isAccessAllowed = result[0].is_instructor > 0
            }
        
        } else if (senderRole === 'Instructor') {
            // NOTE: Instructor puede chatear con Admin y con Sus Estudiantes
            if (targetUserRole === 'Admin') {
                isAccessAllowed = true
            } else if (targetUserRole === 'Estudiante') {
                const query = `
                    SELECT COUNT(DISTINCT O.usuario_id) AS is_my_student
                    FROM detalles_orden AS DO
                    JOIN ordenes AS O ON DO.orden_id = O.id
                    JOIN cursos AS C ON DO.curso_id = C.id
                    WHERE C.instructor_id = ? 
                      AND O.usuario_id = ? 
                      AND O.estado <> 'PENDIENTE'
                `
                // Notar que el ID del remitente (senderId) es el ID del Instructor
                const [result] = await pool.execute(query, [senderId, targetUserId]) 
                isAccessAllowed = result[0].is_my_student > 0
            }

        } else if (senderRole === 'Admin') {
            // Regla: Admin puede chatear con Instructores.
            if (targetUserRole === 'Instructor') {
                isAccessAllowed = true
            }
        } 
        
        // Roles sin permiso de chat privado:
        else if (senderRole === 'Visitante' || senderRole === SUPPORT_ROLE_NAME) {
            // Visitante solo deben chatear con Soporte o con usuarios específicos
            isAccessAllowed = false
        }

        if (isAccessAllowed) {
            next()
        } else {
            const reason = `El usuario con rol '${senderRole}' no tiene permiso para iniciar chat privado con '${targetUserRole}'`
            console.warn(`[Chat Acceso Denegado] ${reason} (Remitente ID: ${senderId} a Destinatario ID: ${targetUserId})`)
            return res.status(403).json({ error: 'Acceso al chat denegado' })
        }

    } catch (error) {
        console.error('Error en el middleware de acceso al chat: ', error)
        res.status(500).json({ error: 'Error interno del servidor al verificar permisos de chat' })
    }
}