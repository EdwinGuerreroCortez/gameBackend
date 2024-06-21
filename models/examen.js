const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExamenSchema = new Schema({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  temaId: { type: Schema.Types.ObjectId, ref: 'Tema', required: true },
  preguntasRespondidas: [
    {
      pregunta: String,
      respuesta: String,
      correcta: Boolean,
    }
  ],
  intentos: { type: Number, default: 1 },
  porcentaje: { type: Number, required: true },
  fecha: { type: Date, default: Date.now } // Añadir el campo de fecha con valor por defecto
}, { collection: 'examenes' });

module.exports = mongoose.model('Examen', ExamenSchema);
