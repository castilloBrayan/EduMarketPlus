import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Muestra la información esencial de un curso
 * La función necesita un objeto con los datos del curso (titulo, imagen_url...)
 */
const CourseCard = ({ course }) => {
    // Asegurar un valor por defecto si falta algún dato
    const {
        id, 
        titulo = 'Curso sin título', 
        imagen_url, 
        precio = 0, 
        instructor_nombre = 'Desconocido',
        clasificacion = 'N/A'
    } = course

    // Formato para el precio
    const formattedPrice = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(precio)

    return (
        // Uso de Link para navegar al detalle del curso (S1-FE-016)
        <Link to={`/courses/${id}`} className="course-card-link">
            <div className="course-card">
                <img 
                    src={imagen_url || 'placeholder_url'} // URL de imagen por defecto si no hay
                    alt={`Imagen de ${titulo}`}
                    className="course-image"
                />
                <div className="card-body">
                    <h3 className="card-title">{titulo}</h3>

                    <p className="card-instructor">Instructor: {instructor_nombre}</p>

                    <div className="card-footer">
                        <span className="card-classification">{clasificacion}</span>
                        <span className="card-price">{formattedPrice}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default CourseCard