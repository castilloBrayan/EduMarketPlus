import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'
import styles from './CheckoutPage.module.css'

const CheckoutPage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [orderSummary, setOrderSummary] = useState(null)

    useEffect(() => {
        // Solo un usuario logueado debería poder hacer checkout
        if (!user.isLoggedIn) {
            navigate('/login')
            return
        }

        const handleCheckout = async () => {
            setLoading(true)
            setError(null)

            try {
                // Llama al endpoint de checkout (S2-CART028)
                const response = await fetch('/api/cart/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // No necesita body, ya que el backend encuentra el carrito por el ID de sesión (cookie)
                })

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'Fallo al procesar la compra')
                }

                setOrderSummary({
                    ordenId: result.ordenId,
                    subtotal: parseFloat(result.subtotal),
                    impuesto: parseFloat(result.impuesto),
                    totalFinal: parseFloat(result.totalFinal),
                })

            } catch (err) {
                console.error('Error durante el checkout: ', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        handleCheckout()
    }, [user.isLoggedIn, navigate])


    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(price)
    }

    // Manejar estados de carga y error
    if (loading) {
        return <div className={styles.checkoutContainer}><p>Procesando tu compra...</p></div>
    }
    
    if (error) {
        return (
            <div className={styles.checkoutContainer}>
                <h3>Error al Finalizar Compra</h3>
                <p>Hubo un problema: {error}</p>
                <button onClick={() => navigate('/')}>Volver al Catálogo</button>
            </div>
        )
    }

    // Si todo es exitoso
    const { ordenId, subtotal, impuesto, totalFinal } = orderSummary

    return (
        <div className={styles.checkoutContainer}>
            <div className={styles.purchaseCard}>
                <h1>¡Compra Exitosa!</h1>
                <p className={styles.message}>
                    Tu orden #{ordenId} ha sido procesada con éxito
                </p>

                {/* Resumen de Compra */}
                <div className={styles.summaryBox}>
                    <p>Subtotal: <span>{formatPrice(subtotal)}</span></p>
                    <p>Impuesto (13%): <span>{formatPrice(impuesto)}</span></p>
                    <div className={styles.separator}></div>
                    <p className={styles.total}>Total Final: <span>{formatPrice(totalFinal)}</span></p>
                </div>
                
                <p>Ahora puedes acceder a tus cursos comprados</p>

                {/* Botón de Redirección */}
                <button 
                    className={styles.goToCoursesButton}
                    onClick={() => navigate('/my-courses')}
                >
                    Ir a Mis Cursos
                </button>
            </div>
        </div>
    )
}

export default CheckoutPage