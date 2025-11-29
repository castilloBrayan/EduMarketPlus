import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'

import styles from './CreateCoursePage.module.css'

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

    // Estados de la UI/Mensajes
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    // Estados para Metadatos de YouTube (S2-DT-X01)
    const [videoMetadata, setVideoMetadata] = useState(null)
    const [videoValidationLoading, setVideoValidationLoading] = useState(false)
    const [videoValidationError, setVideoValidationError] = useState('')

    // Handlers del Formulario
    const handleChange = (e) => {
        const { name, value } = e.target

        // Si el campo es precio, convertir a número flotante
        const finalValue = name === 'precio' ? parseFloat(value) : value
        
        setFormData(prev => ({ ...prev, [name]: finalValue }))

        // Al cambiar la URL del video,
            // resetear el estado de la validación anterior
        if (name === 'video_url') {
            setVideoMetadata(null)
            setVideoValidationError('')
        }
    }

    // Función de Extracción de Metadatos (S2-DT-X01)
    const handleVideoUrlValidation = useCallback(async () => {
        const url = formData.video_url.trim()
        if (!url) {
            setVideoValidationError('Por favor, ingresa una URL de YouTube')
            setVideoMetadata(null)
            return
        }

        setVideoValidationLoading(true)
        setVideoValidationError('')
        setVideoMetadata(null)

        try {
            // Llamada al endpoint del backend de Metadatos de YouTube
            const response = await fetch(`/api/youtube/metadata?url=${encodeURIComponent(url)}`)
            const result = await response.json()

            if (response.ok) {
                // Éxito, guardar los metadatos
                setVideoMetadata(result.data)
                setVideoValidationError('') // Limpiar errores si había

                // Lógica para rellenar Título, Descripción e Imagen URL
                setFormData(prev => ({
                    ...prev,
                    // Si el dato de YouTube existe, lo usa
                        // sino mantiene el valor actual de formData
                    titulo: result.data.title || prev.titulo, 
                    descripcion: result.data.description || prev.descripcion,
                    imagen_url: result.data.thumbnail || prev.imagen_url, 
                }))

            } else {
                // Error mostrar error del backend (URL inválida, video no encontrado)
                setVideoValidationError(result.error || 'No se pudo obtener la información del video')
            }

        } catch (err) {
            console.error('Error de red al validar URL: ', err)
            setVideoValidationError('Error de conexión con el servidor de validación')
        } finally {
            setVideoValidationLoading(false)
        }
    }, [formData.video_url]) // Agregar 'video_url' como dependencia
    
    // Formatea la duración para mostrarla al usuario
    const formattedDuration = useMemo(() => {
        if (!videoMetadata || !videoMetadata.duration) return null
        
        const { hours, minutes, seconds } = videoMetadata.duration
        
        let parts = []
        if (hours > 0) parts.push(`${hours}h`)
        if (minutes > 0) parts.push(`${minutes}m`)
        // Mostrar segundos solo si no hay horas ni minutos o si es muy corto
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`) 
        
        return parts.join(' ')
    }, [videoMetadata])

    // Función de Creación de Curso
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
        
        // Pre-validación, forzar que si hay URL, esta haya sido validada (o no hay URL)
        if (formData.video_url.trim() && !videoMetadata) {
             setError('Por favor, valida la URL del video antes de publicar el curso')
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
                }, 1000) // Redirigir después de 1 segundo

            } else {
                // Error (como la validación 400 del backend)
                setError(data.error || 'Ocurrió un error al crear el curso')
                setLoading(false) // Desactivar loading en caso de error
            }
            
        } catch (err) {
            console.error('Error de red/petición: ', err)
            setError('Error de conexión con el servidor. Intenta de nuevo.')
            setLoading(false) // Desactivar loading en caso de error de red
        }
    }

    return (
        <div className={styles.heroBackground}> {/* Contenedor general */}
            <div className={`content-wrap ${styles.creationContainer}`}>
            
                {/* Columna Izquierda */}
                <div className={styles.leftColumn}>
                    <h2>Crear Nuevo Curso</h2>
                    
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}

                    <form onSubmit={handleSubmit}>

                        {/* URL de Video (S2-DT-038) + Validacion de metadatos (S2-DT-X01) */}
                        <div>
                            <label htmlFor="video_url">URL de Video (YouTube):</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="url" 
                                    id="video_url" 
                                    name="video_url" 
                                    value={formData.video_url} 
                                    onChange={handleChange} 
                                    placeholder="https://www.youtube.com/watch?v=..." 
                                    style={{ flexGrow: 1 }}
                                    required
                                />
                                <button
                                    type="button" 
                                    onClick={handleVideoUrlValidation} 
                                    disabled={!formData.video_url.trim() || videoValidationLoading}
                                    style={{ padding: '0.6em 1em', whiteSpace: 'nowrap' }}
                                >
                                    {videoValidationLoading ? 'Validando...' : 'Validar Video'}
                                </button>
                            </div>
                        
                            {/* Feedback de validación */}
                            {videoValidationError && 
                                <p className="error-message">
                                    {videoValidationError}
                                </p>
                            }
                            {videoMetadata && 
                                <p className="success-message">
                                    <span style={{ fontWeight: 'bold' }}>Validado</span> <hr /> 
                                    Duración: {formattedDuration} | 
                                    Publicado: {new Date(videoMetadata.publishedDate).toLocaleDateString()}
                                </p>
                            }
                        </div>


                        {/* Título */}        
                        <div>
                            <label htmlFor="titulo" className={styles.label}>Título del Curso:</label>
                            <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label htmlFor="descripcion">Descripción:</label>
                            <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} required rows="3"></textarea>
                        </div>

                        {/* Imagen URL */}
                        <div>
                            <label htmlFor="imagen_url">URL de la Imagen:</label>
                            <input type="url" id="imagen_url" name="imagen_url" value={formData.imagen_url} onChange={handleChange} required />
                        </div>

                        {/* Precio */}
                        <div>
                            <label htmlFor="precio">Precio (USD):</label>
                            <input type="number" id="precio" name="precio" value={formData.precio} onChange={handleChange} min="0" required />
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

                        <button 
                            type="submit" 
                            disabled={loading || videoValidationLoading} // Deshabilitar si se está validando el video
                        >
                            {loading ? 'Creando...' : 'Publicar Curso'}
                        </button>
                    </form>
                </div>
                
                {/* Columna Derecha */}
                <div className={styles.rightColumn}>
                    <h2>Vista previa</h2>

                </div>
            </div>
        </div>
    )
}

export default CreateCoursePage