import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks' // Se usara para el boton de compra

import styles from './CourseDetailPage.module.css'
import { FaShoppingCart, FaCheckCircle, FaCalendarAlt, FaClock, FaStar, FaCommentDots  } from 'react-icons/fa'

import InteractionForm from '../components/InteractionForm.jsx' 
import InteractionList from '../components/InteractionList.jsx'

import { useCart } from '../context/cart.hooks'
import { useChatSocket } from '../context/chatSocket.hooks.js'

const CourseDetailPage = () => {
    // Obtener el ID del curso de la URL
    const { id } = useParams()
    const { user } = useAuth() // Obtener el estado del usuario
    const { fetchCart, toggleSidebar } = useCart() // Obtener contexto del carrito
    
    const [course, setCourse] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Estado para la recarga de reviews
    const [refreshReviews, setRefreshReviews] = useState(0)
    
    // Estado para el rating promedio
    const [courseRating, setCourseRating] = useState({ average: 'N/A', count: 0 })

    const [videoMetadata, setVideoMetadata] = useState({
        publishedDate: 'Dic 2025',
        duration: 'O h',
        
    })
    
    const [cartActionStatus, setCartActionStatus] = useState({
        loading: false, 
        error: null, 
        success: null
    })

    const { joinChatRoom, setChatWindowOpen } = useChatSocket()

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

            fetchCart() // Recargar los datos del carrito
            toggleSidebar() // Abrir sidebar

            // TODO: Actualizar icono del carrito al agregar
            
        } catch (err) {
            console.error('Error al agregar al carrito: ', err)
            setCartActionStatus({ loading: false, error: err.message, success: null })
        }
    }

    // Función para manejar la publicación exitosa de un comentario
    const handleReviewSubmitted = () => {
        // Incrementar el estado para forzar la recarga de la lista de reviews
        setRefreshReviews(prev => prev + 1)
    }

    // Funcion para obtener el promedio del componente hijo
    const handleReviewsLoaded = useCallback(({ average, count }) => {
        setCourseRating({ average, count })
    }, [setCourseRating]) // setCourseRating nunca cambia, pero se incluye por convención

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

                // Obtener metadata del video
                try {
                    if (result.data.video_url) {
                        const youtubeResponse = await fetch(`/api/youtube/metadata?url=${encodeURIComponent(result.data.video_url)}`)
                        const youtubeResult = await youtubeResponse.json()

                        if (youtubeResponse.ok) {
                            // Éxito, guardar los metadatos
                            setVideoMetadata(youtubeResult.data)
                        } else {
                            console.error('Error al obtener metadatos de YouTube:', youtubeResult.error)
                        }                    }
                } catch (err) {
                    console.error('Error de red al validar URL: ', err)
                }

            } catch (err) {
                console.error(`Error al obtener el ID ${id} del curso: `, err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCourseDetails()

    }, [id]) // Dependencia del ID para recargar si el parámetro cambia

    // Iniciar el chat con el instructor
    const handleChatWithInstructor = () => {
        // Validar que estemos login
        if (!user.isLoggedIn) {
            alert('Debes iniciar sesión para chatear con el instructor')
            return
        }
        
        // Validar que el curso y el instructor existan
        if (!course || !course.instructor_id) {
            alert('No se pudo encontrar la información del instructor')
            return
        }

        // No chatear consigo mismo (si el usuario es el instructor)
        if (course.instructor_id === user.id) {
            alert('¡No puedes chatear contigo mismo! Usa la vista de soporte para gestionar tus chats')
            return
        }

        // Iniciar la conversación
        // joinChatRoom inicia la sala, y setChatWindowOpen abre el chatbox flotante (S3-FE-055)
        joinChatRoom(course.instructor_id)

        setChatWindowOpen(true) 
    }

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

    // Usar course.rating_promedio si viene del backend (MySQL), si no, usar el de MongoDB
    const displayRating = course?.rating_promedio ? course.rating_promedio : courseRating.average

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
                            <span>O h</span> <hr />
                            <span className={styles.classificationTag}>{clasificacion}</span> <hr />
                            <span className={styles.instructorBadge}>{instructor_nombre}</span>

                            {/* BOTÓN DE CHAT (S3-FE-054) */}
                            {/* Solo mostrar si no es el instructor y está logueado */}
                            {user.isLoggedIn && course.instructor_id !== user.id && (
                                <button 
                                    onClick={handleChatWithInstructor} 
                                    className={styles.chatButton}
                                    title="Chatear con el instructor"
                                >
                                    <FaCommentDots /> Chatear
                                </button>
                            )}

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

                    {/* Botón de Compra Condicional */}
                    {( user.rol === 'Estudiante' ) && (
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
                    )}

                    {( user.rol === 'Admin' || user.rol === 'Instructor' ) && (
                        <div className={styles.purchaseCard}>
                            <button 
                                className={styles.buyButton} 
                            >
                                <span>
                                    Editar información del curso
                                </span>
                            </button>
                            <small className={styles.purchaseNote}>Obten acceso de por vida solo a este curso</small>
                        </div>
                    )}
                    {( user.rol === 'Visitante' || user.rol === null ) && (
                        <div className={styles.purchaseCard}>
                            <button 
                                className={styles.buyButton} 
                                disabled={true}
                            >
                                <FaShoppingCart className={styles.buyButtonIcon} />
                                <span>
                                    Registrate y podrás comprar cursos
                                </span>
                            </button>
                            <small className={styles.purchaseNote}>Obten acceso de por vida solo a este curso</small>
                        </div>
                    )}
                </div>
            </div>

            <br />
            <hr className={styles.sectionDivider} />
            <br />

            <h2 className={styles.sectionTitle}>Comentarios y Valoraciones</h2>

            <div className={styles.detailContainer}>                
                {/* Columna Izquierda */}
                <div className={styles.leftColumn}>

                    {/* Lista de comentarios (Implementación detallada en S2-FE-036) */}
                    <div className={styles.section}>
                        {/* Aquí irá el componente para mostrar la lista de interacciones (S2-FE-036) */}

                        <div>
                            <InteractionList 
                                cursoId={course.id} // ID del curso para fetch
                                onReviewsLoaded={handleReviewsLoaded} // Callback para actualizar el rating en el padre
                                triggerRefresh={refreshReviews} // Para forzar la recarga
                            />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha */}
                <div className={styles.rightColumn}>

                    {/* Sección de comentarios y rating (S2-FE-035) */}
                    {user.isLoggedIn && (
                        <div className={styles.reviewSection}>
                            <InteractionForm 
                                cursoId={id} // Le pasamos el ID del curso
                                onReviewSubmitted={handleReviewSubmitted} // Le pasamos el callback
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* TODO: Implementar lógica de promedio de rating del Proyecto Final */}
            {/* TODO: Implementar secciones de Temas (comprado), Comentarios y Rating */}
        </div>
    );

}

export default CourseDetailPage