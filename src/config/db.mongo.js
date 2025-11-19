import mongoose from 'mongoose'
import 'dotenv/config'

const MONGODB_URL = process.env.MONGODB_URL

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URL)
    
    console.log('Conexión a MongoDB establecida con éxito')

    // Manejo de eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión en tiempo de ejecución de Mongoose: ', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose se ha desconectado de MongoDB')
    })

  } catch (error) {
    console.error('Error fatal al intentar conectar con MongoDB: ', error.message)
    // En caso de fallo crítico, salir de la aplicación
    process.exit(1)
  }
}

export { connectMongoDB }