import express from 'express'

import { testConnection } from './src/config/db.mysql.js'
import { connectMongoDB } from './src/config/db.mongo.js'

const app = express()
const PORT = process.env.PORT || 3000

// Probar la conexión al pool
testConnection()
// Establecer la conexión a MongoDB
connectMongoDB();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})