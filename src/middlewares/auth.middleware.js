import jwt from 'jsonwebtoken'
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Middleware para verificar la existencia y validez del JWT en la cookie
 * Si es válido, adjunta el payload del usuario (id, rol) a req.user
 */
export const authMiddleware = (req, res, next) => {
    // Obtener el token de la cookie (Nombre: 'token' - definido en S1-AUTH-006)
    const token = req.cookies.token

    // Verificar la existencia del token
    if (!token) {
        // Si no hay token, el usuario no está autenticado
        return res.status(401).json({
            error: 'Acceso denegado. Se requiere un token de autenticación'
        })
    }

    try {
        // Verificar y decodificar el token
        // jwt.verify lanzará un error si el token es inválido o ha expirado
        const decoded = jwt.verify(token, JWT_SECRET)
        
        // Adjuntar la información del usuario al objeto de solicitud (req.user)
        // Esto hace que req.user esté disponible en las rutas siguientes
        req.user = decoded 

        // Continuar con la ejecución de la siguiente función (el controlador de la ruta)
        next()

    } catch (error) {
        // Manejar errores de verificación (como token expirado, firma inválida)
        console.warn('Error de verificación de token: ', error.message)

        // Limpiar la cookie si es inválida
        res.clearCookie('token')
        
        return res.status(403).json({
            error: 'Token inválido o expirado. Vuelva a iniciar sesión'  
        })

    }
}