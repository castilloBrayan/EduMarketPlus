import React, { useState, useEffect } from 'react'
import CourseCard from '../components/CourseCard'

import styles from './HomePage.module.css'

const HomePage = () => {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Llamada al endpoint de lista de cursos (público)
                const response = await fetch('/api/courses')
                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'No se pudo cargar el catálogo de cursos')
                }

                // Si la respuesta es exitosa, guardar cursos

                setCourses(result.data)
            } catch (err) {
                console.error("Error al buscar cursos: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, []) // Se ejecuta solo al montar el componente (sin dependencias)

    if (loading) {
        return <div className={styles.loadingMessage}>Cargando catálogo...</div>
    }

    if (error) {
        return <div className={styles.errorMessage}>Error: {error}</div>
    }

    if (courses.length === 0) {
        return <div className="empty-state">No hay cursos disponibles en el catálogo</div>
    }

    return (
        <div className="home-page">
            <h1 className={styles.homePageTitle}>Catálogo de Cursos</h1>

            <p>Explora las opciones disponibles en EduMarket+</p>

            {/* Grid o Flexbox para mostrar las tarjetas */}

            {courses.length === 0 ? (
                <div className={styles.loadingMessage}>No hay cursos disponibles en este momento</div>
            ) : (
                <div className={styles.coursesGrid}>
                    {courses.map((course) => (
                        // Renderizar el componente CourseCard por cada curso
                        <CourseCard key={course.id} course={course} /> 
                    ))}
                </div>
            )}
        </div>
    )
}

export default HomePage