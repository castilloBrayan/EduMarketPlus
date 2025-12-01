import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/auth.hooks'

import styles from './MyCoursesPage.module.css' 

import CourseCard from '../components/CourseCard'

const MyCoursesPage = () => {
    const { user } = useAuth()
    const [myCourses, setMyCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Función para obtener los cursos comprados
    const fetchMyCourses = async () => {
        if (!user.isLoggedIn) return

        setLoading(true)
        setError(null)
        try {
            // Llama al endpoint GET /api/courses/my
            const response = await fetch('/api/courses/my')
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Error al cargar tus cursos')
            }

            // El controlador devuelve los cursos en `result.data`
            setMyCourses(result.data || [])
            
        } catch (err) {
            console.error("Error fetching my courses:", err)
            setError(err.message)
            setMyCourses([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMyCourses()
    }, [user.isLoggedIn])

    if (loading) {
        return <div className={styles.loadingContainer}>Cargando tus cursos...</div>
    }

    if (error) {
        return <div className={styles.errorContainer}>Error: {error}</div>
    }

    return (
        <div className={styles.myCoursesContainer}>
            <h1>Mis Cursos ({myCourses.length})</h1>
            <p>Aquí tienes acceso a todos los cursos que has comprado.</p>

            <div className={styles.coursesGrid}>
                {myCourses.length > 0 ? (
                    myCourses.map(course => (
                        <div key={course.id} className={styles.courseItem}>
                            <img src={course.imagen_url} alt={course.titulo} className={styles.courseImage} />
                            <div className={styles.courseInfo}>
                                <h2>{course.titulo}</h2>
                                <p className={styles.instructor}>Instructor: {course.instructor_nombre}</p>
                                <p className={styles.date}>Comprado el: {new Date(course.fecha_compra).toLocaleDateString()}</p>
                                <button onClick={() => alert(`Iniciando curso: ${course.titulo}`)} className={styles.startButton}>
                                    Iniciar Curso
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyMessage}>
                        No has comprado ningún curso aún. ¡Explora nuestro <a href="/">catálogo</a>!
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyCoursesPage