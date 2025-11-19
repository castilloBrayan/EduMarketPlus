import bcrypt from 'bcrypt'
import { pool } from '../config/db.mysql.js'

/**
 * En bcrypt de npm es el número de rondas de procesamiento computacional (factor de costo) 
 *  que se utiliza para generar el hash de una contraseña
 * Un valor más alto significa que el hash será más seguro
 * Establecemos un factor de 'sal' (saltRounds) para bcrypt. 10 es un buen valor por defecto.
 */
const saltRounds = 10

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