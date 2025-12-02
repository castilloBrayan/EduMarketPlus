import { pool } from '../config/db.mysql.js'

// Constante para el estado del carrito activo 'PENDIENTE'
const PENDING_STATUS = 'PENDIENTE'

// Constante para el estado de orden completada
const COMPLETED_STATUS = 'COMPLETADA'

/**
 * Endpoint para obtener el carrito de compras (orden PENDIENTE) del usuario
 * GET /api/cart (Protegida)
 */
export const getCart = async (req, res) => {
    const userId = req.user.id
    
    try {
        // Encontrar la orden 'PENDIENTE' del usuario
        const [orderRows] = await pool.execute(
            'SELECT id, total FROM ordenes WHERE usuario_id = ? AND estado = ?',
            [userId, PENDING_STATUS]
        )

        const cart = orderRows[0]
        
        if (!cart) {
            // Si no hay carrito, retorna un objeto vacío/null
            return res.status(200).json({
                message: 'El carrito está vacío',
                data: {
                    id: null,
                    total: 0.00,
                    items: []
                }
            })
        }

        // Obtener los detalles (items/cursos) de esa orden
            // JOIN para obtener los datos del curso (titulo, imagen_url)
            // junto con el precio_al_comprar y el detalle_id
        const [itemRows] = await pool.execute(
            `
            SELECT 
                do.id AS detalle_id,
                do.curso_id,
                do.precio_al_comprar,
                c.titulo,
                c.imagen_url,
                c.clasificacion
            FROM detalles_orden do
            JOIN cursos c ON do.curso_id = c.id
            WHERE do.orden_id = ?
            `,
            [cart.id]
        )

        // Calcular el impuesto 13% (Requerimiento)
        const subtotal = parseFloat(cart.total)
        const taxRate = 0.13
        const tax = subtotal * taxRate
        const finalTotal = subtotal + tax
        
        // Respuesta exitosa
        res.status(200).json({
            message: 'Contenido del carrito recuperado exitosamente',
            data: {
                id: cart.id,
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                total: finalTotal.toFixed(2), // Total con impuesto
                items: itemRows
            }
        })

    } catch (error) {
        console.error('Error al obtener el carrito de compras: ', error.message)
        res.status(500).json({ error: 'Error interno del servidor al obtener el carrito' })
    }
}

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

/**
 * Endpoint para eliminar un curso de un carrito de compras
 * Requiere el ID del curso (course_id) y el ID del usuario (de req.user)
 * DELETE /api/cart/:course_id (Protegida)
 */
export const removeCourseFromCart = async (req, res) => {
    // Obtener IDs
    const userId = req.user.id
    const courseId = parseInt(req.params.id) // ID del courso a eliminar de la orden 
    
    if (isNaN(courseId) || courseId <= 0) {
        return res.status(400).json({ error: 'ID de curso inválido' })
    }

    let connection
    try {
        connection = await pool.getConnection()
        await connection.beginTransaction() // Iniciar Transacción

        // Verificar que el curso pertenezca a un detalle con orden PENDIENTE del usuario
        const [detailRows] = await connection.execute(
            `
            SELECT
                o.id AS orden_id,
                do.id AS detalle_orden_id
            FROM
                ordenes o
            INNER JOIN
                detalles_orden do ON o.id = do.orden_id
            WHERE
                o.usuario_id = ? AND  -- ID del usuario
                o.estado = ? AND -- Estado a verificar
                do.curso_id = ?; -- ID del curso 
            `,
            [userId, PENDING_STATUS, courseId]
        )
        
        if (detailRows.length === 0) {
            // Si el array está vacío, el curso no está en la orden PENDIENTE del usuario
            await connection.rollback();
            return res.status(404).json({ error: 'Curso no encontrado en el carrito activo del usuario' });
        }

        const detalleOrdenId = detailRows[0].detalle_orden_id
        const cartId = detailRows[0].orden_id // Para actualizar el total del carrito

        // Eliminar el detalle de la orden (curso)
        const [deleteResult] = await connection.execute(
            'DELETE FROM detalles_orden WHERE id = ?',
            [detalleOrdenId]
        )
        
        if (deleteResult.affectedRows === 0) {
            await connection.rollback()
            return res.status(500).json({ error: 'Error al eliminar el detalle del carrito' })
        }

        // Recalcular el nuevo total de la orden
        // Buscar el total de los detalles restantes
        const [totalRows] = await connection.execute(
            `
            SELECT SUM(precio_al_comprar) AS nuevo_subtotal
            FROM detalles_orden
            WHERE orden_id = ?
            `,
            [cartId]
        )

        // Si no quedan detalles, el total es 0.00
        const nuevoSubtotal = totalRows[0].nuevo_subtotal || 0.00
        
        // Actualizar el total de la orden (Carrito)

        // TODO: debo aliminar el carrito si se elimina el ultimo item de el?

        // // Manejar el caso de Carrito Vacío
        // if (parseFloat(nuevoSubtotal) === 0.00) {
        //     // Eliminar la orden PENDIENTE porque está vacía
        //     await connection.execute(
        //         'DELETE FROM ordenes WHERE id = ?',
        //         [cartId]
        //     )
            
        //     await connection.commit() // Confirmar Transacción (Eliminación de detalle y orden)
            
        //     // Respuesta específica para carrito vacío
        //     return res.status(200).json({
        //         message: 'Curso eliminado. El carrito ahora está vacío',
        //         cartId: null,
        //         nuevoTotal: '0.00',
        //     })
        // }

        // Si el carrito no está vacío, solo actualizar el total
        await connection.execute(
            'UPDATE ordenes SET total = ? WHERE id = ?',
            [nuevoSubtotal, cartId]
        )

        await connection.commit() // Confirmar Transacción (Eliminación de detalle y actualización de total)
        
        res.status(200).json({
            message: 'Curso eliminado del carrito y total actualizado exitosamente',
            cartId: cartId,
            nuevoTotal: parseFloat(nuevoSubtotal).toFixed(2),
        })

    } catch (error) {
        if (connection) {
            await connection.rollback() // Deshacer si algo falla
        }
        console.error('Error al eliminar curso del carrito: ', error.message)
        res.status(500).json({ error: 'Error interno del servidor al eliminar el curso del carrito' })
    } finally {
        if (connection) {
            connection.release() // Liberar conexión
        }
    }
}

/**
 * Endpoint para procesar el checkout (comprar) de la orden PENDIENTE del usuario
 * POST /api/cart/checkout (Protegida)
 */
export const checkout = async (req, res) => {
    const userId = req.user.id
    
    let connection
    try {
        connection = await pool.getConnection()
        await connection.beginTransaction() // Iniciar Transacción

        // Encontrar la orden PENDIENTE (el carrito) del usuario
        const [cartRows] = await connection.execute(
            'SELECT * FROM ordenes WHERE usuario_id = ? AND estado = ?',
            [userId, PENDING_STATUS]
        )

        const cart = cartRows[0]

        if (!cart) {
            await connection.rollback()
            return res.status(404).json({ error: 'No tienes una orden de compra pendiente (carrito vacío)' })
        }
        
        const cartId = cart.id
        const cartSubTotal = parseFloat(cart.total)

        // Validación de Carrito Vacío (total en cero)
        const [detailRows] = await connection.execute(
            'SELECT COUNT(*) as count FROM detalles_orden WHERE orden_id = ?',
            [cartId]
        )

        const courseCount = detailRows[0].count

        if (courseCount === 0 || cartSubTotal <= 0.00) {
            // Si el carrito está vacío, eliminarlo para limpiar la DB
            await connection.execute('DELETE FROM ordenes WHERE id = ?', [cartId])
            await connection.commit()
            return res.status(400).json({ error: 'El carrito está vacío o el total es cero. No se puede procesar la compra' })
        }

        // Simulación de Pasarela de Pago
        console.log(`Pago de $${cartSubTotal.toFixed(2)} para Orden #${cartId} procesado con éxito`)

        // Actualizar el estado de la orden a 'COMPLETADA' y registrar la fecha de compra
        const [updateResult] = await connection.execute(
            'UPDATE ordenes SET estado = ?, fecha_compra = NOW() WHERE id = ? AND estado = ?',
            [COMPLETED_STATUS, cartId, PENDING_STATUS] // Solo actualiza si aún está PENDIENTE
        )

        if (updateResult.affectedRows === 0) {
             await connection.rollback()
            return res.status(500).json({ error: 'Fallo al actualizar el estado de la orden. La compra no se ha completado' })
        }

        const taxRate = 0.13
        const tax = cartSubTotal * taxRate
        const cartTotal = cartSubTotal + tax

        // Finalizar la transacción
        await connection.commit() 

        res.status(200).json({
            message: '¡Compra procesada y completada exitosamente! Tus cursos están listos',
            orderId: cartId,
            subTotal: cartSubTotal.toFixed(2),
            tax: tax.toFixed(2),
            total: cartTotal.toFixed(2),
            newStatus: COMPLETED_STATUS
        })

    } catch (error) {
        if (connection) {
            await connection.rollback() // Deshacer si algo falla
        }
        console.error('Error durante el proceso de checkout: ', error.message)
        res.status(500).json({ error: 'Error interno del servidor al procesar la compra' })
    } finally {
        if (connection) {
            connection.release() // Liberar la conexión
        }
    }
}