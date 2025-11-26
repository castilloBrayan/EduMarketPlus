import { Router } from 'express'
import { getYoutubeMetadata } from '../controllers/youtube.controller.js'

const router = Router()

// Ruta pública para obtener metadatos de YouTube (S2-DT-X01)
router.get('/metadata', getYoutubeMetadata)

export default router