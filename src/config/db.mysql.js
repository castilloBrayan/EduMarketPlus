import mysql from 'mysql2/promise' // Importación de la versión de mysql con promesas

import dotenv from 'dotenv'

dotenv.config()

// Obtener las variables del entorno
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} = process.env

// Crear el Pool de Conexiones
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true, // Esperar si no hay conexiones disponibles
    connectionLimit: 10, // Máximo de 10 conexiones simultáneas
    queueLimit: 0, // Sin límite en la cola de peticiones
})

// Función para probar la conexión
async function testConnection() {
  try {
    // Intentar obtener una conexión del pool
    const connection = await pool.getConnection()
    console.log('Conexión a MySQL establecida con éxito al pool')
    connection.release() // Libera la conexión de vuelta al pool
  } catch (error) {
    console.error('Error al conectar con MySQL:', error.message)
    process.exit(1)
  }
}

// Exportar pool y función de prueba
export { pool, testConnection }