import express from 'express'
import authRoutes from './src/routes/auth.routes.js' // Importar rutas de autenticación

import { testConnection } from './src/config/db.mysql.js'
import { connectMongoDB } from './src/config/db.mongo.js'
import { setupUserModel } from './src/models/user.model.js'
import { setupCourseModel } from './src/models/course.model.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware esencial, Para que Express pueda leer el JSON enviado en el cuerpo de la petición POST
app.use(express.json())

// Montar rutas de autenticación
app.use('/api/auth', authRoutes)

// Probar la conexión al pool
testConnection()

// Ejecutar la creación de la tabla de usuarios
// Es buena práctica esperar a que la ejecución se complete
await setupUserModel()

// Ejecutar la creación de la tabla de cursos
// Es buena práctica esperar a que esta ejecución se complete
await setupCourseModel()

// Establecer la conexión a MongoDB
connectMongoDB()

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})