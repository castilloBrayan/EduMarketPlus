import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
// import { useAuth } from '../context/auth.hooks' // Se usara para el boton de compra

const CourseDetailPage = () => {
    // Obtener el ID del curso de la URL
    const { id } = useParams()
    
    const [course, setCourse] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchCourseDetails = async () => {
            if (!id) {
                setLoading(false)
                setError('ID de curso no proporcionado')
                
                return
            }

            try {
                // Llamada al endpoint de detalle de curso
                const response = await fetch(`/api/courses/${id}`)
                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'No se pudo cargar el detalle del curso')
                }

                setCourse(result.data)

            } catch (err) {
                console.error(`Error al obtener el ID ${id} del curso: `, err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCourseDetails()

    }, [id]) // Dependencia del ID para recargar si el parámetro cambia

    // Formato del precio (se repite la lógica por componente)
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(price)
    }

    if (loading) {
        return <div className="loading-state">Cargando detalles del curso...</div>
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>
    }

    if (!course) {
        return <div className="empty-state">Curso no encontrado</div>
    }

    // Desestructuración de los datos del curso
    const {
        titulo,
        descripcion,
        precio,
        clasificacion,
        imagen_url,
        instructor_nombre
    } = course

    return (
        <div className="course-detail-container">
            <div className="course-header">
                <img 
                    src={imagen_url || 'placeholder_detail_url'}
                    alt={`Imagen principal de ${titulo}`}
                    className="course-detail-image"
                />

                <div className="header-info">
                    <h1>{titulo}</h1>
                    <p className="classification-tag">{clasificacion}</p>
                    <p className="instructor-info">Impartido por: <strong>{instructor_nombre}</strong></p>
                    
                    {/* TODO: Implementar lógica de promedio de rating del Proyecto Final */}

                    <div className="purchase-box">
                        <span className="course-price">{formatPrice(precio)}</span>
                        
                        {/* TODO: El botón de compra se implementará en otro sprint (Carrito) */}
                        
                        <button className="buy-button">Añadir al Carrito</button>
                    </div>
                </div>
            </div>

            <div className="course-content">
                <h2>Descripción del Curso</h2>
                <p>{descripcion}</p>

                {/* TODO: Implementar secciones de Temas (comprado), Comentarios y Rating */}

                <Link to="/" className="back-link">Volver al Catálogo</Link>
            </div>
        </div>
    )
}

export default CourseDetailPage