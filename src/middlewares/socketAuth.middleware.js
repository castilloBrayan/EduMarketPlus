import jwt from 'jsonwebtoken'
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Función auxiliar para obtener el valor de una cookie específica de la cadena de cookies
 */
const parseCookie = (cookieString, cookieName) => {
    if (!cookieString) return null
    // Dividir por ';' para obtener pares clave=valor y buscar el nombre de la cookie
    const parts = cookieString.split('; ').find(part => part.startsWith(cookieName + '='))
    if (parts) {
        // Obtener solo el valor después del '='
        return parts.substring(cookieName.length + 1)
    }
    return null
}

/**
 * Middleware de Autenticación para Socket.io
 * Verifica el JWT enviado en el handshake.auth.token
 * Si es exitoso, adjunta el payload del usuario (id, rol) a socket.user
 */
export const socketAuthMiddleware = (socket, next) => {
    // Obtener el token del objeto 'auth' en el handshake
    let token = socket.handshake.auth.token

    // Si no hay token en 'auth', intentar obtenerlo de las cookies
    if (!token && socket.request.headers.cookie) {
        token = parseCookie(socket.request.headers.cookie, 'token')
    }

    if (!token) {
        console.warn(`[Socket.io] Conexión rechazada: Token de autenticación ausente.`)
        // Pasar un error a next() para que Socket.io rechace la conexión
        return next(new Error("Error de autenticación: Token ausente"))
    }
    
    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET)
        
        // Adjuntar la información del usuario al socket
        socket.user = decoded // { id, rol, ... }
        console.log(`[Socket.io] Autenticación exitosa para Usuario ID: ${socket.user.id}`)
        
        next() // Continuar la conexión
    } catch (error) {
        console.warn('[Socket.io] Conexión rechazada: Token inválido o expirado.', error.message)
        return next(new Error("Authentication error: Invalid or expired token"))
    }
}