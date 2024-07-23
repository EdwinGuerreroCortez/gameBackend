const mongoose = require('mongoose');

const progresoEvaluacionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  temaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tema',
    required: true
  },
  preguntas: [
    {
      pregunta: String,
      opciones: [String],
      respuesta_correcta: String,
      respuesta_seleccionada: String
    }
  ],
  tiempoRestante: {
    type: Number,
    required: true,
    default: 7200 // 2 horas en segundos
  },
  numeroPregunta: {
    type: Number,
    required: true,
    default: 0
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFin: {
    type: Date,
    required: true
  }
});

const ProgresoEvaluacion = mongoose.model('ProgresoEvaluacion', progresoEvaluacionSchema);

module.exports = ProgresoEvaluacion;
