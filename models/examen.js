const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreguntaRespondidaSchema = new Schema({
  intento: Number,
  fecha: Date,
  respuestas: [
    {
      pregunta: String,
      respuesta: String,
      correcta: Boolean,
    }
  ],
  porcentaje: Number
});

const ExamenSchema = new Schema({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  temaId: { type: Schema.Types.ObjectId, ref: 'Tema', required: true },
  intentos: { type: Number, default: 1 },
  preguntasRespondidas: [PreguntaRespondidaSchema],
  examenPermitido: { type: Boolean, default: false } // Add this line
}, { collection: 'examenes' });

module.exports = mongoose.model('Examen', ExamenSchema);
