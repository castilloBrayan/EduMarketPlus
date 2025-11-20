import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'

const LoginPage = () => {
    const [formData, setFormData] = useState({
        correo: '',
        contraseña: ''
    })

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth() // Función para actualizar el estado global
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Usar el proxy de 'Vite' para redirigir a http://localhost:3000/api/auth/login
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            
            const data = await response.json()

            if (!response.ok) {
                // Manejo de errores en backend (credenciales inválidas)
                throw new Error(data.error || 'Fallo en el inicio de sesión')
            }

            // Si es exitoso, el backend estableció la cookie HTTP-only
            // Actualizar estado global de la aplicación con la info del usuario
            login(data.user)
            
            // Redirigir a la página principal despues de hacer login
            navigate('/')

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
        
            <h2>Iniciar Sesión</h2>
            
            {error && <p className="error-message">{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="correo">Correo:</label>
                    <input
                        type="email"
                        id="correo"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="contraseña">Contraseña:</label>
                    <input
                        type="password"
                        id="contraseña"
                        name="contraseña"
                        value={formData.contraseña}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Cargando...' : 'Entrar'}
                </button>
            </form>
        </div>
    )
}

export default LoginPage