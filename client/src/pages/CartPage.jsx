import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'
import { useCart } from '../context/cart.hooks'

import styles from './CartPage.module.css'

const CartPage = () => {

    const { user } = useAuth()
    const {
        cartItems, 
        cartTotal, 
        cartSubTotal,
        cartTax,
        fetchCart 
    } = useCart()

    const navigate = useNavigate()
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Solo un usuario logueado debería poder hacer checkout
        if (!user.isLoggedIn) {
            navigate('/login')
            return
        }

        setLoading(false)

    }, [user.isLoggedIn, navigate, fetchCart])
    
    const handleProcessAndFinalize = async () => {
        
        if (cartItems.length === 0) {
            setError('Tu carrito está vacío. Agrega cursos antes de finalizar la compra.')
            return
        }

        setLoading(true) // Se inicia la carga al hacer clic
        setError(null)
        let summaryData = null

        try {
            // Llama al endpoint de checkout (S2-CART028) - Ahora solo al CLIC
            const response = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Fallo al procesar la compra')
            }
            
            // Obtener los datos del resumen
            summaryData = {
                orderId: result.ordenId,
                subtotal: parseFloat(result.subTotal),
                tax: parseFloat(result.tax),
                total: parseFloat(result.total),
            }

            fetchCart()

            console.log('Datos del resumen de la orden: ', summaryData)

            localStorage.setItem('lastOrder', JSON.stringify(summaryData))

            // Navegar con los datos
            navigate(
                '/checkout'
            )
            
        } catch (err) {
            console.error('Error durante el checkout: ', err)
            setError(err.message)
            setLoading(false) // Detener la carga en caso de error
        }
    }

    // Maneja la eliminación de un curso del carrito
    const handleRemoveItem = async (cursoId) => {
        // Endpoint para eliminar curso del carrito (S2-CART-027)
        try {
            const response = await fetch(`/api/cart/${cursoId}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                fetchCart() // Recargar la lista de cursos después de eliminar
            } else {
                // Manejar error de eliminación
                console.error('Error al eliminar curso del carrito')
            }
        } catch (error) {
            console.error('Error de red al eliminar curso: ', error)
        }
    }
    
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
                <button onClick={() => { 
                    setError(null)
                    setLoading(false)
                    navigate('/')
                }}>
                    Volver al Catálogo
                </button>
            </div>
        )
    }

    return (
        <div className={styles.heroBackground}> {/* checkoutContainer */}
            <h1 className={styles.pageTitle}>Resumen de Compra</h1>

            {/* <div className={`content-wrap ${styles.mainContentArea}`}> NUEVA CLASE AQUÍ */}
            <div className={`content-wrap ${styles.mainContentArea}`}>
            

                <div className={styles.sumaryContainer}>

                    <div className={styles.itemsList}>
                        {cartItems.map((item, index) => (
                            <React.Fragment key={item.curso_id}>
                                
                                <div className={styles.item}>
                                    <img src={item.imagen_url} alt={item.titulo} className={styles.itemImage} />
                                    
                                    <div className={styles.itemInfo}>
                                        <h4 className={styles.itemTitle}>{item.titulo}</h4>
                                        <button 
                                            className={styles.removeItemButton}
                                            onClick={() => handleRemoveItem(item.curso_id)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>

                                    <h4 className={styles.itemPrice}>{item.precio_al_comprar}</h4>
                                </div>

                                {index < cartItems.length - 1 && (
                                    <hr className={styles.customDivider} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                </div>

                <div className={styles.purchaseCard}>
                    <p className={styles.message}>
                        Has agregado {cartItems.length} Cursos
                    </p>
                    
                    <hr className={styles.customDivider} />

                    {/* Resumen de Compra */}
                    <div className={styles.summaryBox}>
                        <p>Subtotal: <span>{ formatPrice(cartSubTotal) }</span></p>
                        <p>Impuesto (13%): <span>{ formatPrice(cartTax) }</span></p>
                        <div className={styles.separator}></div>
                        <p className={styles.total}>Total Final: <span>{ formatPrice(cartTotal) }</span></p>
                    </div>
                    
                    {/* Botón de Redirección */}
                    <button 
                        className={styles.goToCoursesButton}
                        onClick={handleProcessAndFinalize}
                        disabled={loading || cartItems.length === 0} // Deshabilitar si está cargando o no hay items
                    >
                        {loading ? 'Procesando Compra...' : 'Finalizar compra'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CartPage