import express from 'express'
import cookieParser from 'cookie-parser' // Importar el parser de cookies
import authRoutes from './src/routes/auth.routes.js' // Importar rutas de autenticación
import userRoutes from './src/routes/user.routes.js' // Importar las rutas de usuario
import courseRoutes from './src/routes/course.routes.js' // Importar las rutas de curso
import youtubeRoutes from './src/routes/youtube.routes.js' // Importar las rutas de YouTube
import cartRoutes from './src/routes/cart.routes.js' // Importar rutas de Carrito
import interactionRoutes from './src/routes/interaction.routes.js' // Importar rutas de interacción
import bodyParser from 'body-parser'

import cors from 'cors'
import http  from 'http' // Módulo HTTP de Node.js
import { Server } from 'socket.io' // Clase Server de Socket.io

import { testConnection } from './src/config/db.mysql.js'
import { connectMongoDB } from './src/config/db.mongo.js'
import { setupUserModel } from './src/models/user.model.js'
import { setupCourseModel } from './src/models/course.model.js'
import { setupOrderModel, setupOrderDetailModel } from './src/models/order.model.js'

const app = express()
const PORT = process.env.PORT || 3000
const CLIENT_PORT = process.env.CLIENT_PORT || 5173

// Crear un servidor HTTP a partir del app Express
const server = http.createServer(app)

// Configuración de Socket.io
const io = new Server(server, {
    cors: {
        // Permitir conexión desde frontend
        origin: `http://localhost:${CLIENT_PORT}`, 
        methods: ["GET", "POST"]
    }
})

// Guardar la instancia de io en la aplicación para poder acceder a ella desde cualquier ruta
app.set('socketio', io)

// Middleware para permitir solicitudes desde el frontend
app.use(cors())
// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(bodyParser.json())
// Middleware para parsear el cuerpo de las solicitudes con URL encoded
app.use(bodyParser.urlencoded({ extended: true }))
// Middleware esencial, Para que Express pueda leer el JSON enviado en el cuerpo de la petición POST
app.use(express.json())
// Middleware para leer las cookies de la petición (necesario para el Login/Auth)
app.use(cookieParser())

// Montar rutas de autenticación
app.use('/api/auth', authRoutes) // Autenticación (login/register)
app.use('/api/users', userRoutes) // Gestión de usuarios (cambio de rol)
app.use('/api/courses', courseRoutes) // Gestión de cursos
app.use('/api/youtube', youtubeRoutes) // Gestión de metadatos de YouTube
app.use('/api/cart', cartRoutes) // Montar rutas de Carrito
app.use('/api/interactions', interactionRoutes) // Gestión de interacciones (ratings/comentarios)

// Probar la conexión al pool
testConnection()

// Ejecutar la creación de la tabla de usuarios
// Es buena práctica esperar a que la ejecución se complete
await setupUserModel()

// Ejecutar la creación de la tabla de cursos
// Es buena práctica esperar a que esta ejecución se complete
await setupCourseModel()

// Ejecutar la creación de las tablas de órdenes y detalles (S2-DB-022)
await setupOrderModel()
await setupOrderDetailModel()

// Establecer la conexión a MongoDB
connectMongoDB()

// Lógica básica de conexión de Socket.io
io.on('connection', (socket) => {
    console.log(`[Socket.io] Nuevo cliente conectado: ${socket.id}`)

    // Escucha el evento de desconexión
    socket.on('disconnect', () => {
        console.log(`[Socket.io] Cliente desconectado: ${socket.id}`)
    })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})