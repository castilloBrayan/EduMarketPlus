import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import styles from './CheckoutPage.module.css'

const CheckoutPage = () => {

    const navigate = useNavigate()
    const location = useLocation()

    const [ordenData] = useState(() => {
        // Obtenemos los datos pasados en la navegación
        const stateData = location.state?.resumenDeOrden
        if (stateData) return stateData

        const saved = localStorage.getItem('lastOrder')

        // Si se perdieron los datos en la recarga, devolver null
        return saved ? JSON.parse(saved) : null
    })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Lógica para obtener el resumen
    useEffect(() => {
        if (ordenData) {
            localStorage.removeItem('lastOrder') // Limpieza de 'lastOrder' en localStorage
            
            queueMicrotask(() => {
                setLoading(false)
            })
        } else {
            queueMicrotask(() => {
                setError('No se encontró información de la orden.')
                setLoading(false)
            })
        }
    }, [ordenData]) // Dependencia: Solo se ejecuta si ordenData cambia (o es null/inicial)

    if (loading) {
        return <div className={styles.heroBackground}><p>Cargando detalles de la orden...</p></div>
    }

    if (error) {
        return (
            <div className={styles.purchaseCard}>
                <h2>Error en el Checkout</h2>
                <br />
                <p>{error}</p>
                <br />
                <button 
                    className={styles.goToCoursesButton}
                    onClick={() => navigate('/')}
                >
                    Volver al Catálogo
                </button>
            </div>
        )
    }

    const { orderId, subtotal, tax, total } = ordenData
    
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(price)
    }
    
    return (
        <div className={styles.heroBackground}> {/* checkoutContainer */}

            {/* <div className={`content-wrap ${styles.mainContentArea}`}> NUEVA CLASE AQUÍ */}
            <div className={`content-wrap ${styles.mainContentArea}`}>

                <div className={styles.purchaseCard}>
                    <h1 className={styles.title}>¡Gracias por tu compra!</h1>
                    <p className={styles.message}>
                        Tu orden #{ orderId } ha sido procesada con éxito
                    </p>

                    {/* Resumen de Compra */}
                    <div className={styles.summaryBox}>
                        <p>Subtotal: <span>{ formatPrice(subtotal) }</span></p>
                        <p>Impuesto (13%): <span>{ formatPrice(tax) }</span></p>
                        <div className={styles.separator}></div>
                        <p className={styles.total}>Total Final: <span>{ formatPrice(total) }</span></p>
                    </div>
                    
                    {/* Botón de Redirección */}
                    <button 
                        className={styles.goToCoursesButton}
                        onClick={() => navigate('/my-courses')}
                    >
                        Ir a Mis Cursos
                    </button>
                    <small>Ahora puedes acceder a tus cursos comprados</small>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage