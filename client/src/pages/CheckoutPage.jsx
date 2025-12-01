import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.hooks'
import styles from './CheckoutPage.module.css'

const CheckoutPage = () => {

    const navigate = useNavigate()
    
    
    return (
        <div className={styles.checkoutContainer}>
            <div className={styles.purchaseCard}>
                <h1>Resumen de compra</h1>
                <p className={styles.message}>
                    Tu orden #ordenId ha sido procesada con éxito
                </p>

                {/* Resumen de Compra */}
                <div className={styles.summaryBox}>
                    <p>Subtotal: <span>formatPrice(subtotal)</span></p>
                    <p>Impuesto (13%): <span>formatPrice(impuesto)</span></p>
                    <div className={styles.separator}></div>
                    <p className={styles.total}>Total Final: <span>formatPrice(totalFinal)</span></p>
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