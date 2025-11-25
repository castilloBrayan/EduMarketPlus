import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
// import { useAuth } from '../context/auth.hooks' // Se usara para el boton de compra

import styles from './CourseDetailPage.module.css'
import { FaShoppingCart, FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa'

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

    if (loading) {
        return <div className="loadingMessage">Cargando detalles del curso...</div>
    }

    if (error || !course) {
        return <div className="errorMessage">Error: {error || "Lo sentimos, el curso solicitado no está disponible"}</div>
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

    // return (
    //     <div className={styles.detailContainer}>
    //         <div className={styles.mainContent}>

    //             <h1 className={styles.title}>{titulo}</h1>

    //             <p className={styles.subtitle}>{titulo}, domina el nivel {clasificacion} con este curso</p>
            
    //             <img 
    //                 src={imagen_url || 'placeholder_detail_url'}
    //                 alt={`Imagen principal de ${titulo}`}
    //                 className={styles.courseImage}
    //             />

    //             

    //             {/* Sección de Descripción */}
    //             <h2 className={styles.sectionTitle}>Descripción del Curso</h2>
    //             <p className={styles.descriptionText}>{descripcion}</p>
    //             <p className={styles.descriptionText}>Impartido por: <strong>{instructor_nombre}</strong></p>


    //             {/* --- Panel Lateral de Compra --- */}
    //             <div className={styles.sidebar}>
    //                 <div className={styles.purchaseCard}>
    //                     <p className={styles.price}>{formattedPrice}</p>
                        
    //                     <button className={styles.buyButton}>Añadir al Carrito</button>
                        
    //                     <div className={styles.instructorInfo}>
    //                         <p>Impartido por:</p>
    //                         <p><strong>{instructor_nombre}</strong></p>
    //                         <p>Nivel: <strong>{clasificacion}</strong></p>
    //                     </div>
    //                 </div>
    //             </div>

    //             <Link to="/" className="back-link">Volver al Catálogo</Link>
    //         </div>
    //     </div>
    // )

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
                        <button className={styles.buyButton}>
                            <FaShoppingCart className={styles.buyButtonIcon} />
                            <span>Comprarlo por {formattedPrice}</span>
                        </button>
                        Obten acceso de por vida solo a este curso
                    </div>
                </div>
            </div>

            {/* TODO: Implementar lógica de promedio de rating del Proyecto Final */}
            {/* TODO: Implementar secciones de Temas (comprado), Comentarios y Rating */}
        </div>
    );

}

export default CourseDetailPage