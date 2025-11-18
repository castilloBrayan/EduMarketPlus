import express from 'express'

import { testConnection } from './src/config/db.mysql.js'

const app = express()
const PORT = process.env.PORT || 3000

// Probar la conexión al pool
testConnection()

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})