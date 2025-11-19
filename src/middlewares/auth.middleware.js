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

/**
 * Middleware para restringir el acceso basado en roles
 * Acepta un array de roles permitidos
 */
export const roleMiddleware = (allowedRoles) => {
    // Retorna la función middleware real que Express ejecutará
    return (req, res, next) => {
        // Verificar si req.user existe (depende de authMiddleware)
        if (!req.user || !req.user.rol) {
            // Si req.user no existe, es un error de configuración o el authMiddleware falló
            // Ya debería ser manejado por authMiddleware (errores 401/403), pero es una capa de seguridad
            return res.status(403).json({
                error: 'Acceso denegado. Información de rol no disponible'
            })
        }

        // Comprobar si el rol del usuario está incluido en los roles permitidos
        const userRole = req.user.rol

        // Convertimos a minúsculas para comparar
        // lo mejor es ser consistente, pero la verificación debe ser estricta con los roles definidos
        if (allowedRoles.includes(userRole)) {
            // Si el rol es permitido, continúa
            next()
        } else {
            // Si el rol no está permitido, denegar el acceso
            console.warn(`Intento de acceso denegado: Usuario con rol "${userRole}" intentó acceder a ruta protegida`)
            return res.status(403).json({
                error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
            })
        }
    }
}