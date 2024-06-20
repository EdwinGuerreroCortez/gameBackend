// models/evaluacion.js

const mongoose = require('mongoose');

const evaluacionSchema = new mongoose.Schema({
  tema_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tema',
    required: true
  },
  evaluacion: [
    {
      pregunta: {
        type: String,
        required: true
      },
      opciones: {
        type: [String],
        required: true
      },
      respuesta_correcta: {
        type: String,
        required: true
      },
      imagen: {
        type: String,
        default: null
      }
    }
  ]
});

const Evaluacion = mongoose.model('Evaluacion', evaluacionSchema);

module.exports = Evaluacion;
