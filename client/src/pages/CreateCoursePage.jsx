import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'

const CreateCoursePage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Estado para los datos del formulario
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        imagen_url: '',
        video_url: '',
        precio: 0,
        categoria: '',
        clasificacion: 'Basico', // Valor inicial
    })

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        // Si el campo es precio, convertir a número flotante
        const value = e.target.name === 'precio' ? parseFloat(e.target.value) : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!user.isLoggedIn || (user.rol !== 'Admin' && user.rol !== 'Instructor')) {
            setError("Error de autenticación: No tienes permiso para crear cursos")
            setLoading(false)
            return
        }
        
        // Mandar instructor_id como ID del usuario logueado
        const courseData = {
            ...formData,
            instructor_id: user.id, // ID del instructor de la sesión
            categorias: [formData.categoria],
        }

        try {
            // Llamar al endpoint protegido de creación de cursos (S1-COURSE-010)
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseData),
            })

            const data = await response.json()

            if (response.ok) {
                // Éxito:
                const createdCourseId = data.courseId
                
                // Mostrar el mensaje de éxito
                setSuccess(`Curso "${formData.titulo}" creado exitosamente Redirigiendo...`)
                // Desactivar el loading, lo que evita un bloque finally
                setLoading(false) 

                // Timeout para permitir que el mensaje se muestre
                    // y para evitar 'race conditions' al navegar
                setTimeout(() => {
                    navigate(`/courses/${createdCourseId}`)
                }, 500) // Redirigir después de 0.5 segundos

            } else {
                // Error (como la validación 400 del backend)
                setError(data.error || 'Ocurrió un error al crear el curso')
                setLoading(false) // Desactivar loading en caso de error
            }
            
        } catch (err) {
            console.error('Error de red/petición: ', error)
            setError('Error de conexión con el servidor. Intenta de nuevo.')
            setLoading(false) // Desactivar loading en caso de error de red
        }
    }

    return (
        <div className="content-wrap">
            <h2>Crear Nuevo Curso</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <p>Rol actual: {user.rol}. Solo Instructor o Admin pueden usar este formulario</p>

            <form onSubmit={handleSubmit}>

                {/* Título */}        
                <div>
                    <label htmlFor="titulo">Título del Curso:</label>
                    <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
                </div>

                {/* Descripción */}
                <div>
                    <label htmlFor="descripcion">Descripción:</label>
                    <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} required rows="4"></textarea>
                </div>

                {/* Imagen URL */}
                <div>
                    <label htmlFor="imagen_url">URL de la Imagen:</label>
                    <input type="url" id="imagen_url" name="imagen_url" value={formData.imagen_url} onChange={handleChange} required />
                </div>

                {/* URL de Video */}
                <div>
                    <label htmlFor="video_url">URL de Video (YouTube):</label>
                    <input 
                        type="url" 
                        id="video_url" 
                        name="video_url" 
                        value={formData.video_url} 
                        onChange={handleChange} 
                        placeholder="Ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                        required
                    />
                </div>

                {/* Precio */}
                <div>
                    <label htmlFor="precio">Precio (USD):</label>
                    <input type="number" id="precio" name="precio" value={formData.precio} onChange={handleChange} min="0" step="0.01" required />
                </div>

                {/* Categoría */}
                {/* TODO: Debe ser una lista de categorias (tags) */}
                <div>
                    <label htmlFor="categoria">Categoría Principal:</label>
                    <input type="text" id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Ej: Programación, Diseño" required />
                </div>

                {/* Clasificación */}
                <div>
                    <label htmlFor="clasificacion">Clasificación:</label>
                    <select id="clasificacion" name="clasificacion" value={formData.clasificacion} onChange={handleChange}>
                        <option value="Basico">Básico</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Publicar Curso'}
                </button>
            </form>
        </div>
    )
}

export default CreateCoursePage