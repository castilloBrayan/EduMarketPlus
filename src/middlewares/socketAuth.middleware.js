import jwt from 'jsonwebtoken'
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Middleware de Autenticación para Socket.io
 * Verifica el JWT enviado en el handshake.auth.token
 * Si es exitoso, adjunta el payload del usuario (id, rol) a socket.user
 */
export const socketAuthMiddleware = (socket, next) => {
    // Obtener el token del objeto 'auth' en el handshake
    const token = socket.handshake.auth.token

    if (!token) {
        console.warn(`[Socket.io] Conexión rechazada: Token de autenticación ausente.`)
        // Pasar un error a next() para que Socket.io rechace la conexión
        return next(new Error("Authentication error: Token missing"))
    }
    
    try {
        // 2. Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET)
        
        // 3. Adjuntar la información del usuario al socket.
        socket.user = decoded // { id, rol, ... }
        console.log(`[Socket.io] Autenticación exitosa para Usuario ID: ${socket.user.id}`)
        
        next() // Continuar la conexión
    } catch (error) {
        console.warn('[Socket.io] Conexión rechazada: Token inválido o expirado.', error.message)
        return next(new Error("Authentication error: Invalid or expired token"))
    }
}