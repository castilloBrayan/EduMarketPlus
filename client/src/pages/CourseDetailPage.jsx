import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks' // Se usara para el boton de compra

import styles from './CourseDetailPage.module.css'
import { FaShoppingCart, FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa'

const CourseDetailPage = () => {
    // Obtener el ID del curso de la URL
    const { id } = useParams()
    const { user } = useAuth() // Obtener el estado del usuario
    
    const [course, setCourse] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [cartActionStatus, setCartActionStatus] = useState({
        loading: false, 
        error: null, 
        success: null
    })

    // Lógica para agregar al carrito (S2-CART-025)
    const handleAddToCart = async () => {
        // Verificar si el usuario está logueado
        if (!user.isLoggedIn) {
            alert("Debes iniciar sesión para agregar cursos al carrito")
            return
        }

        setCartActionStatus({ loading: true, error: null, success: null })

        try {
            // Llamada al endpoint para agregar al carrito
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ curso_id: id }), // Enviar ID del curso
            })
            
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Fallo al agregar el curso al carrito')
            }

            setCartActionStatus({ 
                loading: false, 
                error: null, 
                success: result.message || 'Curso agregado con éxito!' 
            })

            // TODO: Actualizar icono del carrito al agregar
            
        } catch (err) {
            console.error('Error al agregar al carrito: ', err)
            setCartActionStatus({ loading: false, error: err.message, success: null })
        }
    }

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

    if (loading) {
        return <div className="loadingMessage">Cargando detalles del curso...</div>
    }

    if (error) {
        return <div className="errorMessage">Error: {error}</div>
    }

    if (!course) {
        return <div className="errorMessage">Error: {"Lo sentimos, el curso solicitado no está disponible"}</div>
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

    // Formato para el precio
    const formattedPrice = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(precio)

    return (
        <div className={styles.heroBackground}> {/* Contenedor general */}
            <h1 className={styles.title}>{titulo}</h1>

            <div className={`content-wrap ${styles.detailContainer}`}>
                
                {/* Columna Izquierda */}
                <div className={styles.leftColumn}>
                    <p className={styles.shortDescription}>{descripcion}</p> 

                    {/* TODO: Tags de Categoría */}
                    {/* <div>
                            {categories.map((cat, index) => (
                                <span key={index} className={styles.categoryTag}>{cat}</span>
                            ))}
                        </div> 
                    */}

                </div>

                {/* Columna Derecha */}
                <div className={styles.rightColumn}>

                    <img
                        src={imagen_url}
                        alt={titulo}
                        className={styles.courseMainImage}
                    />
                    
                    {/* TODO: Recopilar metadata del video */}
                    <div className={styles.imageMeta}>
                        <div className={styles.metaRow}>
                            <FaCalendarAlt className={styles.metaIcon} />
                            <span>Dic 2025</span> <hr />
                            <FaClock className={styles.metaIcon} />
                            <span>0 h</span> <hr />
                            <span className={styles.classificationTag}>{clasificacion}</span> <hr />
                            <span className={styles.instructorBadge}>{instructor_nombre}</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className={`content-wrap ${styles.detailContainer}`}>
                
                {/* Columna Izquierda */}
                <div className={styles.leftColumn}>
                    
                </div>

                {/* Columna Derecha */}
                <div className={styles.rightColumn}>

                    {/* Botón de Compra */}
                    <div className={styles.purchaseCard}>
                        {cartActionStatus.success && (
                            <div className={styles.successMessage}>{cartActionStatus.success}</div>
                        )}
                        {cartActionStatus.error && (
                            <div className={styles.errorMessage}>{cartActionStatus.error}</div>
                        )}
                        <button 
                            className={styles.buyButton} 
                            onClick={handleAddToCart}
                            disabled={cartActionStatus.loading} // Desactivar si está cargando
                        >
                            <FaShoppingCart className={styles.buyButtonIcon} />
                            <span>
                                {cartActionStatus.loading 
                                    ? 'Añadiendo...' 
                                    : `Cómpralo por ${formattedPrice}`
                                }
                            </span>
                        </button>
                        <small className={styles.purchaseNote}>Obten acceso de por vida solo a este curso</small>
                    </div>
                </div>
            </div>

            {/* TODO: Implementar lógica de promedio de rating del Proyecto Final */}
            {/* TODO: Implementar secciones de Temas (comprado), Comentarios y Rating */}
        </div>
    );

}

export default CourseDetailPage