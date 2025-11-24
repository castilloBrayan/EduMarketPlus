import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import styles from './Auth.module.css'

const DEFAULT_PHOTO_URL = '/default-avatar.png'

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        contraseña: '',
        foto_url: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ 
            ...formData,
            [e.target.name]: e.target.value 
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        let finalFotoUrl = formData.foto_url.trim()

        if (finalFotoUrl === '') {
            finalFotoUrl = DEFAULT_PHOTO_URL
        }

        try {
            // Validaciones básicas en el frontend (complemento a las del back)
            if (formData.contraseña.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres')
            }

            // El backend verifica correo no duplicado y hashea

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    foto_url: finalFotoUrl,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                // Manejo de errores en backend (correo duplicado)
                throw new Error(data.error || 'Fallo en el registro')
            }

            // Registro exitoso
            setSuccess(data.message + ' Serás redirigido al login')

            // Redirigir a la página de login para iniciar sesión (3 segundos despues)
            setTimeout(() => {
                navigate('/login')
            }, 3000)

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.authContainer}>

            <div className={styles.authCard}>

                <h2>Registro de Usuario</h2>

                {error && <p className="error-message">{error}</p>}

                {success && <p className="success-message">{success}</p>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="nombre"></label>
                        <input type="text" id="nombre" name="nombre" placeholder='Elije un nombre' value={formData.nombre} onChange={handleChange} required />
                    </div>

                    <div>
                        <label htmlFor="correo"></label>
                        <input type="email" id="correo" name="correo" placeholder='Ingresa tu correo preferido ' value={formData.correo} onChange={handleChange} required />
                    </div>

                    <div>
                        <label htmlFor="contraseña"></label>
                        <input type="password" id="contraseña" name="contraseña" placeholder='Crea una contraseña' value={formData.contraseña} onChange={handleChange} required />
                    </div>

                    <div>
                        <label htmlFor="foto_url"></label>
                        <input type="url" id="foto_url" name="foto_url" placeholder='Elije una foto para tu perfil' value={formData.foto_url} onChange={handleChange} />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarme'}
                    </button>
                </form>
                
                <Link to="/login">¿Ya tienes cuenta? <span style={{ color: '#ffffffff' }}>Inicia Sesión</span></Link>
            </div>
        </div>
    )
}

export default RegisterPage