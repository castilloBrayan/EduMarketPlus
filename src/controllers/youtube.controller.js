import { google } from 'googleapis'
import 'dotenv/config'
import { isVideoUrlValid } from '../utils/validation.js'

// Inicializar el cliente de YouTube con tu API Key
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
})

// Función de utilidad para convertir la duración PThM0s (ISO 8601) a minutos y segundos
    // (PT1H30M5S = { hours: 1, minutes: 30, seconds: 5 })
const parseDuration = (isoDuration) => {
    const matches = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!matches) return { hours: 0, minutes: 0, seconds: 0 }

    // Función auxiliar para extraer el valor numérico
    const extract = (match) => (match ? parseInt(match.slice(0, -1)) : 0)

    return {
        hours: extract(matches[1]),
        minutes: extract(matches[2]),
        seconds: extract(matches[3]),
    }
}

/**
 * Extrae el ID del video de una URL de YouTube 'watch?v=dQw4w9WgXcQ'
 * Necesita la URL completa del video
 * Devolver ID del video o null si no se encuentra
 */
const extractVideoId = (url) => {
    // Expresión regular para URL de YouTube (incluye formatos estándar y acortados)
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
}

/**
 * Endpoint para obtener metadatos de un video de YouTube a partir de su URL
 * GET /api/youtube/metadata?url=...
 */
export const getYoutubeMetadata = async (req, res) => {
    const videoUrl = req.query.url

    if (!videoUrl) {
        return res.status(400).json({ error: 'El parámetro "url" es obligatorio' })
    }

    if (!isVideoUrlValid(videoUrl)) {
        return res.status(400).json({ error: 'Formato de URL de YouTube inválido' })
    }

    const videoId = extractVideoId(videoUrl)

    if (!videoId) {
        return res.status(400).json({ error: 'No se pudo extraer el ID del video de la URL proporcionada' })
    }
    
    try {
        // Llamada a la API de YouTube
        const response = await youtube.videos.list({
            part: 'snippet,contentDetails', // Solicitamos los metadatos relevantes
            id: videoId,
        })
        
        const video = response.data.items[0]

        if (!video) {
            return res.status(404).json({ error: 'Video no encontrado en YouTube o es privado' })
        }

        const durationISO = video.contentDetails.duration // Formato PThM0s
        const publishedAt = video.snippet.publishedAt // Fecha de publicación

        // Procesar la duración para un formato más amigable
        const durationParsed = parseDuration(durationISO)

        // Respuesta limpia con los metadatos
        return res.status(200).json({
            message: 'Metadatos recuperados exitosamente',
            data: {
                publishedDate: publishedAt,
                duration: durationParsed,
            },
        })

    } catch (error) {
        console.error('Error al llamar a la API de YouTube: ', error.message)
        return res.status(500).json({ error: 'Error al conectar o consultar la API de YouTube. Revisa la API Key.' })
    }
}