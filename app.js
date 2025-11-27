import express from 'express'
import cookieParser from 'cookie-parser' // Importar el parser de cookies
import authRoutes from './src/routes/auth.routes.js' // Importar rutas de autenticación
import userRoutes from './src/routes/user.routes.js' // Importar las rutas de usuario
import courseRoutes from './src/routes/course.routes.js' // Importar las rutas de curso
import youtubeRoutes from './src/routes/youtube.routes.js' // Importar las rutas de YouTube

import { testConnection } from './src/config/db.mysql.js'
import { connectMongoDB } from './src/config/db.mongo.js'
import { setupUserModel } from './src/models/user.model.js'
import { setupCourseModel } from './src/models/course.model.js'
import { setupOrderAndDetailModels } from './src/models/order.model.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware esencial, Para que Express pueda leer el JSON enviado en el cuerpo de la petición POST
app.use(express.json())
// Middleware para leer las cookies de la petición (necesario para el Login/Auth)
app.use(cookieParser())

// Montar rutas de autenticación
app.use('/api/auth', authRoutes) // Autenticación (login/register)
app.use('/api/users', userRoutes) // Gestión de usuarios (cambio de rol)
app.use('/api/courses', courseRoutes) // Gestión de cursos
app.use('/api/youtube', youtubeRoutes) // Gestión de metadatos de YouTube

// Probar la conexión al pool
testConnection()

// Ejecutar la creación de la tabla de usuarios
// Es buena práctica esperar a que la ejecución se complete
await setupUserModel()

// Ejecutar la creación de la tabla de cursos
// Es buena práctica esperar a que esta ejecución se complete
await setupCourseModel()

// Ejecutar la creación de las tablas de órdenes y detalles (S2-DB-022)
await setupOrderAndDetailModels()

// Establecer la conexión a MongoDB
connectMongoDB()

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})