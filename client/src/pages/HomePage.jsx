import React, { useState, useEffect } from 'react'
import CourseCard from '../components/CourseCard'

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
                console.error("Error fetching courses: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, []) // Se ejecuta solo al montar el componente (sin dependencias)

    if (loading) {
        return <div className="loading-state">Cargando catálogo...</div>
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>
    }

    if (courses.length === 0) {
        return <div className="empty-state">No hay cursos disponibles en el catálogo</div>
    }

    return (
        <div className="catalog-container">
            <h1>Catálogo de Cursos</h1>

            <p>Explora las opciones disponibles en EduMarket+</p>

            {/* Grid o Flexbox para mostrar las tarjetas */}

            <div className="course-list">
                {courses.map((course) => (
                    // Renderizar el componente CourseCard por cada curso
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    )
}

export default HomePage