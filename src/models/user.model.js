import { pool } from '../config/db.mysql.js' // Importar el pool de conexiones

/**
 * Definir y crear la tabla 'usuarios' en MySQL si no existe
 */
async function setupUserModel() {

    const createUserTableQuery = `
        CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(100) UNIQUE NOT NULL,
        contraseña_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'Visitante',
        foto_url VARCHAR(255) NULL
        );
    `
    
    try {
        // Crear tabla ejecutando la consulta SQL
        await pool.execute(createUserTableQuery)
        console.log('Modelo MySQL: Tabla "usuarios" creada o ya existente')
        
    } catch (error) {
        console.error('Error al crear la tabla "usuarios" en MySQL: ', error.message)
        process.exit(1)
    }
    }

// Exportar la función de configuración del modelo
export { setupUserModel }