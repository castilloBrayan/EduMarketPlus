/**
 * Valida un formato básico de URL de YouTube
 * Devuelve True si es una URL de YouTube válida
 */
export const isVideoUrlValid = (url) => {
    // Patrones comunes: youtube.com/watch?v=... o youtu.be/...
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    return youtubeRegex.test(url)
}