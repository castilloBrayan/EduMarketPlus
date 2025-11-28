import { pool } from '../config/db.mysql.js'

/**
 * Definir y crear la tabla 'ordenes' en MySQL si no existe
 * Esta tabla registra la transacción principal
 */
async function setupOrderModel() {
    const createOrderTableQuery = `
        CREATE TABLE IF NOT EXISTS ordenes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            fecha_compra DATETIME DEFAULT NULL, -- La fecha de compra es NULL para órdenes PENDIENTES
            total DECIMAL(10, 2) NOT NULL,
            estado VARCHAR(50) DEFAULT 'PENDIENTE', -- El carrito activo debe ser 'PENDIENTE' por defecto

            -- Llave Foránea al usuario que realiza la compra
            CONSTRAINT fk_orden_usuario
                FOREIGN KEY (usuario_id) 
                REFERENCES usuarios(id)
                ON DELETE RESTRICT 
        );
    `

    try {
        await pool.execute(createOrderTableQuery)
        console.log('Modelo MySQL: Tabla "ordenes" creada o ya existente')
        
    } catch (error) {
        console.error('Error al crear la tabla "ordenes" en MySQL: ', error.message)
        throw error
    }
}

/**
 * Definir y crear la tabla 'detalles_orden' en MySQL si no existe
 * Esta tabla registra cada curso comprado dentro de una orden
 */
async function setupOrderDetailModel() {
    const createOrderDetailTableQuery = `
        CREATE TABLE IF NOT EXISTS detalles_orden (
            id INT AUTO_INCREMENT PRIMARY KEY,
            orden_id INT NOT NULL,
            curso_id INT NOT NULL,
            precio_al_comprar DECIMAL(10, 2) NOT NULL, -- Precio fijo al momento de la compra

            -- Llave Foránea a la orden
            CONSTRAINT fk_detalle_orden
                FOREIGN KEY (orden_id) 
                REFERENCES ordenes(id)
                ON DELETE CASCADE, -- Eliminar detalles de la orden si esta se elimina

            -- Llave Foránea al curso
            CONSTRAINT fk_detalle_curso
                FOREIGN KEY (curso_id) 
                REFERENCES cursos(id)
                ON DELETE RESTRICT -- El curso no puede eliminarse si es parte de una orden
        );
    `

    try {
        await pool.execute(createOrderDetailTableQuery)
        console.log('Modelo MySQL: Tabla "detalles_orden" creada o ya existente')
        
    } catch (error) {
        console.error('Error al crear la tabla "detalles_orden" en MySQL: ', error.message)
        throw error
    }
}

export { setupOrderModel, setupOrderDetailModel }