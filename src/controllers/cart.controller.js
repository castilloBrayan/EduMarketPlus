import { pool } from '../config/db.mysql.js'

// Constante para el estado del carrito activo 'PENDIENTE'
const PENDING_STATUS = 'PENDIENTE'

/**
 * Endpoint para agregar un curso al carrito de compras del usuario
 * POST /api/cart/add (Protegida)
 */
export const addCourseToCart = async (req, res) => {
    // El ID del usuario se obtiene del token de sesión (authMiddleware)
    const userId = req.user.id
    
    // El ID del curso a agregar viene del cuerpo de la petición
    const { curso_id } = req.body

    if (!curso_id) {
        return res.status(400).json({ error: 'El campo curso_id es obligatorio' })
    }

    // Convertir a número entero
    const courseId = parseInt(curso_id)
    if (isNaN(courseId) || courseId <= 0) {
        return res.status(400).json({ error: 'ID de curso inválido' })
    }

    let connection
    try {
        connection = await pool.getConnection()
        await connection.beginTransaction() // Iniciar Transacción

        // Verificar si el curso existe y obtener su precio
        const [courseRows] = await connection.execute(
            'SELECT precio FROM cursos WHERE id = ?',
            [courseId]
        )

        if (courseRows.length === 0) {
            await connection.rollback()
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        const coursePrice = parseFloat(courseRows[0].precio)

        // Verificar si el usuario ya compró el curso
        const [ownershipRows] = await connection.execute(
            `
            SELECT COUNT(do.id) AS count
            FROM ordenes o
            JOIN detalles_orden do ON o.id = do.orden_id
            WHERE o.usuario_id = ? AND do.curso_id = ? AND o.estado = 'Completada'
            `,
            [userId, courseId]
        )

        if (ownershipRows[0].count > 0) {
            await connection.rollback()
            return res.status(400).json({ error: 'Ya posees este curso. No se puede agregar al carrito' })
        }

        // Buscar o Crear la Orden de Carrito (PENDIENTE)
        let cartId 
        
        // Buscar carrito existente (orden en estado 'PENDIENTE')
        const [cartRows] = await connection.execute(
            'SELECT id FROM ordenes WHERE usuario_id = ? AND estado = ?',
            [userId, PENDING_STATUS]
        )

        if (cartRows.length > 0) {
            // Carrito encontrado
            cartId = cartRows[0].id
        } else {
            // No existe carrito: Crear una nueva orden con estado 'PENDIENTE'
            const [result] = await connection.execute(
                'INSERT INTO ordenes (usuario_id, total, estado) VALUES (?, 0.00, ?)',
                [userId, PENDING_STATUS]
            )
            cartId = result.insertId
        }

        // Verificar si el curso ya está en el carrito PENDIENTE
        const [detailRows] = await connection.execute(
            'SELECT COUNT(id) AS count FROM detalles_orden WHERE orden_id = ? AND curso_id = ?',
            [cartId, courseId]
        )
        
        if (detailRows[0].count > 0) {
            await connection.rollback()
            return res.status(400).json({ error: 'Este curso ya está en tu carrito' })
        }
        
        // Agregar el curso a detalles_orden
        await connection.execute(
            'INSERT INTO detalles_orden (orden_id, curso_id, precio_al_comprar) VALUES (?, ?, ?)',
            [cartId, courseId, coursePrice] // Congelar el precio actual
        )

        // Actualizar el total de la orden (Carrito)
        const [totalRows] = await connection.execute(
            `
            SELECT SUM(precio_al_comprar) AS nuevo_total
            FROM detalles_orden
            WHERE orden_id = ?
            `,
            [cartId]
        )
        const nuevoTotal = totalRows[0].nuevo_total || 0.00

        await connection.execute(
            'UPDATE ordenes SET total = ? WHERE id = ?',
            [nuevoTotal, cartId]
        )

        await connection.commit() // Confirmar Transacción

        res.status(200).json({
            message: 'Curso agregado al carrito exitosamente',
            cartId: cartId,
            nuevoTotal: nuevoTotal,
        })

    } catch (error) {
        if (connection) {
            await connection.rollback() // Deshacer si algo falla
        }
        console.error('Error al agregar curso al carrito: ', error.message)
        res.status(500).json({ error: 'Error interno del servidor al procesar el carrito' })
    } finally {
        if (connection) {
            connection.release()
        }
    }
}