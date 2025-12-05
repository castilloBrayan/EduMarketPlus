import React, { useState } from 'react'
import { FaStar } from 'react-icons/fa'

import styles from './InteractionForm.module.css'

const MAX_COMMENT_LENGTH = 500 // Asignar una cantidad máxima de caracteres para el comentario

// Estado inicial del formulario
const INITIAL_STATE = {
    rating: 0,
    comentario: '',
    isSubmitted: false,
    error: null,
    loading: false
}

/**
 * Componente de formulario para publicar un rating y comentario
 * Necesita el ID del curso al que se aplica la review
 * Necesita una funcion onReviewSubmitted, Callback a ejecutar después de una publicación exitosa
 */
const ReviewForm = ({ cursoId, onReviewSubmitted }) => {
    const [state, setState] = useState(INITIAL_STATE)
    const { rating, comentario, isSubmitted, error, loading } = state

    // Maneja la selección de estrellas
    const handleRatingClick = (newRating) => {
        setState(prev => ({ ...prev, rating: newRating }))
    }

    // Maneja el cambio en el área de texto
    const handleCommentChange = (e) => {
        const value = e.target.value
        // Limitar longitud del comentario según el límite del modelo de DB (maxlength: 500)
        if (value.length <= MAX_COMMENT_LENGTH) {
            setState(prev => ({ ...prev, comentario: value }))
        }
    }

    // Maneja el envío del formulario al backend
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (rating === 0) {
            setState(prev => ({ ...prev, error: 'Por favor, selecciona una calificación (1 a 5 estrellas)' }))
            return
        }

        setState(prev => ({ ...prev, loading: true, error: null }))

        const reviewData = {
            cursoId: cursoId,
            rating: rating,
            comentario: comentario.trim()
        }

        try {
            // Llama al endpoint POST /api/interactions
            const response = await fetch('/api/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData),
            })

            const result = await response.json()

            if (!response.ok) {
                // El backend maneja el caso donde usuario no ha comprado o ya comentado
                throw new Error(result.error || 'Fallo al publicar el comentario')
            } else {
                setState(prev => ({ ...prev, isSubmitted: true }))
                
                // Notificar al componente padre que la revisión fue enviada 
                if (onReviewSubmitted) {
                    onReviewSubmitted(result.data)
                }
            }
        } catch (err) {
            console.error('Error al publicar la interacción: ', err)
            setState(prev => ({ ...prev, error: err.message }))
        } finally {
            setState(prev => ({ ...prev, loading: false }))
        }
    }

    if (isSubmitted) {
        return (
            <div className={styles.reviewFormContainer}>
                <p className={styles.successMessage}>
                    ¡Gracias por tu valoración! Tu comentario se ha publicado
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={styles.reviewFormContainer}>
            <h2>Tu Opinión Cuenta</h2>
            <p>Deja una calificación y comparte tu opinión sobre este curso</p>

            {/* Selector de Rating (Estrellas) */}
            <div className={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={styles.star}
                        color={star <= rating ? "#ffc107" : "#e4e5e9"}
                        onClick={() => handleRatingClick(star)}
                        title={`Calificar con ${star} estrellas`}
                    />
                ))}
            </div>

            {/* Área de Comentario */}
            <div className={styles.formGroup}>
                <textarea
                    id="comentario"
                    value={comentario}
                    onChange={handleCommentChange}
                    maxLength={MAX_COMMENT_LENGTH}
                    rows="4"
                    className={styles.textarea}
                    placeholder="Deja tu opinión sobre el curso..."
                />
                <small className={styles.charCount}>
                    {comentario.length} / {MAX_COMMENT_LENGTH} caracteres
                </small>
            </div>

            {/* Mensajes de Estado */}
            {error && <p className={styles.errorMessage}>{error}</p>}
            
            {/* Botón de Publicar */}
            <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading || rating === 0}
            >
                {loading ? 'Publicando...' : 'Publicar Comentario'}
            </button>
        </form>
    )
}

export default ReviewForm