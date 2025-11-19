import bcrypt from 'bcrypt'
import { pool } from '../config/db.mysql.js'
import jwt from 'jsonwebtoken' // Importar JWT

/**
 * En bcrypt de npm es el número de rondas de procesamiento computacional (factor de costo) 
 *  que se utiliza para generar el hash de una contraseña
 * Un valor más alto significa que el hash será más seguro
 * Establecemos un factor de 'sal' (saltRounds) para bcrypt. 10 es un buen valor por defecto.
 */
const saltRounds = 10 // Para la función 'registerUser'

// Obtener la clave secreta del entorno, para la función 'loginUser'
const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_EXPIRATION = '1h' // Expiración de 1 hora

// Lista de roles permitidos según los requerimientos del proyecto, para la función 'updateUserRole' 
const VALID_ROLES = ['Visitante', 'Instructor', 'Estudiante', 'Asistencia', 'Admin']

/**
 * Registrar un nuevo usuario en la base de datos
 * POST /api/auth/register
 */
export const registerUser = async (req, res) => {
    const { nombre, correo, contraseña, foto_url } = req.body

    // Validación de Campos No Nulos y Longitud (Requerimiento)
    if (!nombre || !correo || !contraseña) {
        return res.status(400).json({
            error: 'Todos los campos son obligatorios: nombre, correo y contraseña'
        })
    }

    // Agregar validaciones de longitud (Adicional)
    if (contraseña.length < 6) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 6 caracteres' 
        })
    }

    try {
        // Verificar si el correo ya existe (UNIQUE Requerimiento)
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        )

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'El correo electrónico ya está registrado. Por favor, inicie sesión'
            })
        }

        // Hashear la Contraseña (Requerimiento)
        const contraseña_hash = await bcrypt.hash(contraseña, saltRounds)

        // Inserción en MySQL
        // NOTE: El 'rol' por defecto se manejará a nivel de la tabla MySQL ('Visitante')
        const insertQuery = `
            INSERT INTO usuarios
            (nombre, correo, contraseña_hash, foto_url)
            VALUES (?, ?, ?, ?)
        `

        const [result] = await pool.execute(insertQuery, [
            nombre,
            correo,
            contraseña_hash,
            foto_url // foto_url puede ser NULL
        ])

        // Responde con éxito
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        })

    } catch (error) {
        console.error('Error en el registro de usuario: ', error)
        res.status(500).json({
            error: 'Error interno del servidor al registrar el usuario'
            
        })
    }
}

/**
 * Inicia sesión al usuario, genera un JWT y lo establece como cookie
 * POST /api/auth/login
 */
export const loginUser = async (req, res) => {
    const { correo, contraseña } = req.body
    
    // Validación de campos
    if (!correo || !contraseña) {
        return res.status(400).json({
            error: 'Correo y contraseña son obligatorios'
        })
    }

    try {
        // Buscar al usuario por correo
        const [users] = await pool.execute(
            'SELECT id, rol, contraseña_hash, nombre FROM usuarios WHERE correo = ?', 
            [correo]
        )

        const user = users[0]
        
        if (!user) {
            // Usar mensaje genérico para seguridad
            return res.status(401).json({
                error: 'Credenciales inválidas'
            })
        }

        // Comparar la contraseña hasheada (buenas prácticas)
        const passwordsMatch = await bcrypt.compare(contraseña, user.contraseña_hash)

        if (!passwordsMatch) {
            // Usar mensaje genérico para seguridad
            return res.status(401).json({
                error: 'Credenciales inválidas'
            })
        }

        // Generar el JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user.id, rol: user.rol, nombre: user.nombre }, // Payload
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        )

        // Enviar el JWT en una cookie HTTP-only (Requerimiento)
        res.cookie('token', token, {
            httpOnly: true, // No accesible vía JavaScript del navegador (seguridad)
            // Para entornos de producción es recomendable usar:
            // secure: process.env.NODE_ENV === 'production', // Solo enviar con HTTPS en producción
            //En este caso se usará:
            secure: false, // Permite que la cookie se envíe sobre HTTP (localhost)
            maxAge: 60 * 60 * 1000, // 1 hora en milisegundos
            sameSite: 'strict',
        })

        // Respuesta exitosa
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: { id: user.id, nombre: user.nombre, rol: user.rol }
        })

    } catch (error) {
        console.error('Error en el inicio de sesión: ', error)
        res.status(500).json({
            error: 'Error interno del servidor'
        })
    }
}

/**
 * Permite a un Admin cambiar el rol de otro usuario
 * PUT /api/users/:id/role (Protegida unicamente para Admin)
 */
export const updateUserRole = async (req, res) => {
    // El ID del usuario a modificar viene de los parámetros de la URL
    const userIdToUpdate = req.params.id
    // El nuevo rol viene del cuerpo de la petición
    const { rol } = req.body
    
    // El ID del Admin que realiza la acción (viene de req.user, inyectado por authMiddleware)
    const adminId = req.user.id 
    
    // Validación de campos y roles
    if (!rol || typeof rol !== 'string') {
        return res.status(400).json({
            error: 'El campo "rol" es obligatorio y debe ser un texto'
        })
    }

    // Verificar que el rol sea uno de los roles definidos en el proyecto
    if (!VALID_ROLES.includes(rol)) {
        return res.status(400).json({
            error: `Rol inválido. Los roles permitidos son: ${VALID_ROLES.join(', ')}`
        })
    }

    // Ejecutar la actualización en MySQL
    try {
        const [result] = await pool.execute(
            'UPDATE usuarios SET rol = ? WHERE id = ?',
            [rol, userIdToUpdate]
        )

        if (result.affectedRows === 0) {
            // Si affectedRows es 0, el usuario con ese ID no fue encontrado
            return res.status(404).json({
                error: `Usuario con ID ${userIdToUpdate} no encontrado`
            })
        }

        // Respuesta exitosa
        console.log(`Admin ID ${adminId} cambió el rol del usuario ID ${userIdToUpdate} a ${rol}`)
        res.status(200).json({
            message: 'Rol de usuario actualizado exitosamente',
            userId: userIdToUpdate,
            newRole: rol
        })

    } catch (error) {
        console.error('Error al gestionar el rol del usuario: ', error)
        res.status(500).json({
            error: 'Error interno del servidor al actualizar el rol'
        })
    }
}