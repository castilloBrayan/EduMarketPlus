// ID fijo para la sala de chat de Soporte
export const SUPPORT_ROOM_ID = 'chat_room_support'

/**
 *  un ID de sala de chat canónico entre dos usuarios.
 * Genera un ID concatenando los IDs de usuario en orden ascendente,
 * para que la sala sea única sin importar quién la inicie
 * Devuelve un ID único de la sala de chat
 */
export const getChatRoomId = (userId1, userId2) => {
    const id1 = String(userId1)
    const id2 = String(userId2)

    // Ordenar IDs para crear un identificador canónico (1_10 es igual que 10_1)
    const sortedIds = [id1, id2].sort()

    // El formato del ID de sala será "chat_IDMENOR_IDMAYOR"
    return `chat_${sortedIds[0]}_${sortedIds[1]}`
}