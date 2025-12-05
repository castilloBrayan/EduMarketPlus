import express from 'express'

import cookieParser from 'cookie-parser' // Importar el parser de cookies
import authRoutes from './src/routes/auth.routes.js' // Importar rutas de autenticación
import userRoutes from './src/routes/user.routes.js' // Importar las rutas de usuario
import courseRoutes from './src/routes/course.routes.js' // Importar las rutas de curso
import youtubeRoutes from './src/routes/youtube.routes.js' // Importar las rutas de YouTube
import cartRoutes from './src/routes/cart.routes.js' // Importar rutas de Carrito
import interactionRoutes from './src/routes/interaction.routes.js' // Importar rutas de interacción
import chatRoutes from './src/routes/chat.routes.js' // Importar rutas de chat

import bodyParser from 'body-parser'

import cors from 'cors'
import http from 'http' // Módulo HTTP de Node.js
import { Server } from 'socket.io' // Clase Server de Socket.io

import { testConnection } from './src/config/db.mysql.js'
import { connectMongoDB } from './src/config/db.mongo.js'
import { setupUserModel } from './src/models/user.model.js'
import { setupCourseModel } from './src/models/course.model.js'
import { setupOrderModel, setupOrderDetailModel } from './src/models/order.model.js'
import { socketAuthMiddleware } from './src/middlewares/socketAuth.middleware.js' 
import { SUPPORT_ROOM_ID } from './src/utils/chatUtils.js'
import { handleSendMessage } from './src/controllers/chat.controller.js' // Importar controlador de chat

const app = express()
const PORT = process.env.PORT || 3000
const CLIENT_PORT = process.env.CLIENT_PORT || 5173

// Crear un servidor HTTP a partir del app Express
const httpServer = http.createServer(app)

// Configuración de Socket.io
const io = new Server(httpServer, {
    cors: {
        // Permitir conexión desde frontend
        origin: process.env.VITE_FRONTEND_URL, 
        methods: ["GET", "POST"],
        credentials: true
    }
})

// Guardar la instancia de io en la aplicación para poder acceder a ella desde cualquier ruta
app.set('socketio', io)

// Middleware para permitir solicitudes desde el frontend
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Para que Express acepte la cookie
}))
// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(bodyParser.json())
// Middleware para parsear el cuerpo de las solicitudes con URL encoded
app.use(bodyParser.urlencoded({ extended: true }))
// Middleware esencial, Para que Express pueda leer el JSON enviado en el cuerpo de la petición POST
app.use(express.json())
// Middleware para leer las cookies de la petición (necesario para el Login/Auth)
app.use(cookieParser())
// Middleware para todas las conexiones de Socket.io
io.use(socketAuthMiddleware)

// Montar rutas
app.use('/api/auth', authRoutes) // Autenticación (login/register)
app.use('/api/users', userRoutes) // Gestión de usuarios (cambio de rol)

app.use('/api/courses', courseRoutes) // Gestión de cursos
app.use('/api/youtube', youtubeRoutes) // Gestión de metadatos de YouTube
app.use('/api/cart', cartRoutes) // Montar rutas de Carrito

app.use('/api/interactions', interactionRoutes) // Gestión de interacciones (ratings/comentarios)

app.use('/api/chat', chatRoutes) // Montar rutas de Chat

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

// Lógica de conexión y salas de Socket.io
io.on('connection', (socket) => {
    const { id: userId, rol: userRole } = socket.user

    console.log(`[Socket.io] Nuevo cliente conectado: ${socket.id}`)

    // Unir a la sala de soporte
    socket.join(SUPPORT_ROOM_ID)
    console.log(`[Socket.io] Usuario ${userId} unido a la sala: ${SUPPORT_ROOM_ID}`)

    // Listener para la solicitud de unirse a una sala privada
    socket.on('join_private_room', (data) => {
        const { chat_room_id } = data
        if (chat_room_id) {
            socket.join(chat_room_id)
            console.log(`[Socket.io] Usuario ${userId} se unió a la sala privada: ${chat_room_id}`)
            // Emitir un evento de confirmación de vuelta
            socket.emit('room_joined', { chat_room_id })
        }
    })

    // Listener principal para el envío de mensajes (S3-CHAT-045)
    socket.on('send_message', (data) => {
        handleSendMessage(socket, data)
    })

    // Escucha el evento de desconexión
    socket.on('disconnect', () => {
        console.log(`[Socket.io] Cliente desconectado. Usuario ID: ${userId}`)
    })
})

// Iniciar el servidor HTTP (no solo la app de Express)
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})