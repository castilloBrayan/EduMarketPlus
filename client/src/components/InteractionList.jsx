import React, { useState, useEffect, useCallback } from 'react'
import { FaStar, FaUserCircle } from 'react-icons/fa'

import styles from './InteractionList.module.css'

/**
 * Componente para mostrar una lista de comentarios y el rating promedio
 * Necesita el ID del curso
 */
const ReviewList = ({ cursoId, onReviewsLoaded, triggerRefresh }) => {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [averageRating, setAverageRating] = useState(0.0)

    const fetchReviews = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Llamar al endpoint GET /api/interactions/:cursoId
            const response = await fetch(`/api/interactions/${cursoId}`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error al cargar los comentarios')
            }

            const fetchedReviews = result.data || []
            setReviews(fetchedReviews)

            // Calcular el promedio de rating
            const totalRatings = fetchedReviews.length
            let avg = 0.0

            if (totalRatings > 0) {
                const sum = fetchedReviews.reduce((acc, review) => acc + review.rating, 0)
                avg = sum / totalRatings
            }
            
            setAverageRating(avg)

            // Callback para notificar al padre el promedio
            if (onReviewsLoaded) {
                onReviewsLoaded({ average: avg.toFixed(1), count: totalRatings })
            }

        } catch (err) {
            console.error("Error fetching reviews: ", err)
            setError(err.message)
            setReviews([])
            setAverageRating(0.0)
        } finally {
            setLoading(false)
        }
    }, [cursoId, onReviewsLoaded])

    // Recarga las reviews al montar el componente o cuando se pide una actualización
    useEffect(() => {
        fetchReviews()
    }, [fetchReviews, triggerRefresh]) // Usar triggerRefresh para recargar después de un POST exitoso

    // Renderiza estrellas basado en el rating
    const renderStars = (rating) => {
        return Array(5).fill(0).map((_, i) => (
            <FaStar 
                key={i} 
                color={i < Math.round(rating) ? "#ffc107" : "#e4e5e9"} 
                className={styles.starDisplay}
            />
        ))
    }

    if (loading) {
        return <div className={styles.loadingMessage}>Cargando comentarios...</div>
    }

    if (error) {
        return <div className={styles.errorMessage}>Error al cargar los comentarios: {error}</div>
    }

    return (
        <div className={styles.reviewListContainer}>
            {/* Rating Promedio */}
            <div className={styles.averageRatingBox}>
                <div className={styles.ratingValue}>{averageRating.toFixed(1)}</div>
                <div className={styles.starsWrapper}>
                    {renderStars(averageRating)}
                </div>
                <div className={styles.ratingCount}>
                    ({reviews.length} valoraciones)
                </div>
            </div>

            {/* Lista de Reviews Individuales */}
            {reviews.length === 0 ? (
                <p className={styles.noReviews}>Sé el primero en calificar este curso.</p>
            ) : (
                <div className={styles.reviewsGrid}>
                    {reviews.map(review => (
                        <div key={review._id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                {/* Uso de FaUserCircle si no hay foto_url */}
                                {review.usuarioFotoUrl ? (
                                    <img 
                                        src={review.usuarioFotoUrl} 
                                        alt={review.usuarioNombre} 
                                        className={styles.userAvatar}
                                    />
                                ) : (
                                    <FaUserCircle className={styles.userAvatarDefault} />
                                )}
                                <div className={styles.userInfo}>
                                    <h4 className={styles.userName}>{review.usuarioNombre}</h4>
                                    <div className={styles.ratingStars}>
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                            </div>
                            
                            {review.comentario && (
                                <p className={styles.reviewComment}>{review.comentario}</p>
                            )}

                            <span className={styles.reviewDate}>
                                Publicado el {new Date(review.fechaPublicacion).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ReviewList