import { pool } from '../config/db.mysql.js'

/**
 * Definir y crear la tabla 'cursos' en MySQL si no existe
 */
async function setupCourseModel() {
    const createCourseTableQuery = `
        CREATE TABLE IF NOT EXISTS cursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        clasificacion VARCHAR(50) NOT NULL,
        imagen_url VARCHAR(255) NULL,
        video_url VARCHAR(255) NULL,
        instructor_id INT NOT NULL,
      
        -- Definición de la Llave Foránea
        CONSTRAINT fk_instructor
            FOREIGN KEY (instructor_id) 
            REFERENCES usuarios(id)
            ON DELETE RESTRICT -- No permite eliminar al instructor si tiene cursos asociados
        );
    `

    try {
        // Ejecutamos la consulta SQL para crear la tabla
        await pool.execute(createCourseTableQuery)
        console.log('Modelo MySQL: Tabla "cursos" creada o ya existente')
        
    } catch (error) {
        console.error('Error al crear la tabla "cursos" en MySQL: ', error.message)
        process.exit(1)
    }
}

// Exportar la función de configuración del modelo
export { setupCourseModel }