import mongoose from 'mongoose'

/**
 * Esquema Mongoose para guardar el Rating y Comentario de un usuario sobre un curso al que esta inscrito
 * Usar una referencia al ID del curso (MySQL) y al ID del usuario (MySQL)
 */
const InteractionSchema = new mongoose.Schema({
    // El ID del curso al que pertenece el comentario/rating (Referencia a la tabla cursos de MySQL)
        // Uso de index para búsquedas rápidas por curso
    cursoId: {
        type: Number,
        required: true,
        index: true, 
    },
    // El ID del usuario que deja el comentario (Referencia a la tabla usuarios de MySQL)
    usuarioId: {
        type: Number,
        required: true,
        index: true, 
    },
    // Valoración del curso, número entre 1 y 5
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    // El texto del comentario
    comentario: {
        type: String,
        trim: true,
        maxlength: 500, // Límite de 500 caracteres
    },
    // Para saber cuándo se publicó la interacción 
    fechaPublicacion: {
        type: Date,
        default: Date.now,
    },
    // NOTE: restricción, un usuario solo puede calificar un curso una vez
        // Esto crea un índice compuesto único en MongoDB
}, { 
    collection: 'interacciones' // Nombre de colección 
})

// Aplicar la restricción para evitar que un usuario comente un curso dos veces
InteractionSchema.index({ cursoId: 1, usuarioId: 1 }, { unique: true })

export const Interaction = mongoose.model('Interaction', InteractionSchema)