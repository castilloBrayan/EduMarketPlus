import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/cart.hooks'
import { FaTimes, FaShoppingBag, FaTrashAlt } from 'react-icons/fa'

import styles from './CartSidebar.module.css'

const CartSidebar = () => {
    const { 
        isSidebarOpen, 
        toggleSidebar, 
        cartItems, 
        cartTotal, 
        fetchCart 
    } = useCart()
    const navigate = useNavigate()

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

    const handleCheckout = () => {
        toggleSidebar() // Cierra el sidebar
        navigate('/checkout') // Navega a la vista de checkout (Página de compra)
    }

    // Formato de moneda para el precio
    const formatPrice = (price) => new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(price)

    return (
        <>
            {/* Backdrop con efecto de desenfoque */}
            {isSidebarOpen && (
                <div 
                    className={styles.backdrop} 
                    onClick={toggleSidebar} // Cierra al hacer clic fuera
                />
            )}

            {/* Contenedor principal del Sidebar */}
            <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
                <div className={styles.header}>
                    <h2><FaShoppingBag />Tu carrito({cartItems.length})</h2>
                    <button onClick={toggleSidebar} className={styles.closeButton}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.itemsList}>
                    {cartItems.length === 0 ? (
                        <p className={styles.emptyMessage}>¡Tu carrito está vacío!</p>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.curso_id} className={styles.item}>
                                <img src={item.imagen_url} alt={item.titulo} className={styles.itemImage} />
                                <div className={styles.itemInfo}>
                                    <h4 className={styles.itemTitle}>{item.titulo}</h4>
                                    <span className={styles.itemPrice}>{formatPrice(item.precio_al_comprar)}</span>
                                </div>
                                <button 
                                    className={styles.removeItemButton} 
                                    onClick={() => handleRemoveItem(item.curso_id)}
                                >
                                    <FaTrashAlt />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.totalSummary}>
                        <span>Total ({cartItems.length}) cursos:</span>
                        <span className={styles.totalPrice}>{formatPrice(cartTotal)}</span>
                    </div>
                    <button 
                        className={styles.checkoutButton} 
                        onClick={handleCheckout} 
                        disabled={cartItems.length === 0}
                    >
                        Proceder al Checkout
                    </button>
                    <Link to="/catalogo" className={styles.continueShopping}>
                        Continuar Comprando
                    </Link>
                </div>
            </div>
        </>
    )
}

export default CartSidebar