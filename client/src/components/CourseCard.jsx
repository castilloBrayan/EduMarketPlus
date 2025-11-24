import React from 'react'
import { Link } from 'react-router-dom'

import styles from './CourseCard.module.css'

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
        <div className={styles.courseCard}>

            {/* Uso de Link para navegar al detalle del curso (S1-FE-016) */}
            <Link to={`/courses/${id}`} className={styles.cardLink}>
                <div className="course-card">
                    <img 
                        src={imagen_url || 'placeholder_url'} // URL de imagen por defecto si no hay
                        alt={`Imagen de ${titulo}`}
                        className={styles.courseImage}
                    />
                    <div className={styles.cardContent}>
                        <h3 className="card-title">{titulo}</h3>

                        <p className={styles.instructor}>Instructor: {instructor_nombre}</p>

                        <span className={styles.classification}>Nivel: {clasificacion}</span>
                        
                        <p className={styles.price}>{formattedPrice}</p>

                        {/* <div className="card-footer">
                            <span className={styles.classification}>{clasificacion}</span> <br></br>
                            <span className={styles.price}>{formattedPrice}</span>
                        </div> */}

                        <button className={styles.detailsButton}>Agregar al carrito</button>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default CourseCard