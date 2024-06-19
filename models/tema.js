const mongoose = require('mongoose');

const pasoSchema = new mongoose.Schema({
  Titulo: String,
  Descripcion: String,
});

const temaSchema = new mongoose.Schema({
  titulo: String,
  descripcion: String,
  fecha_creacion: { type: Date, default: Date.now },
  responsable: String,
  bibliografia: String,
  pasos: [pasoSchema],
  video: { type: String, default: null },
  evaluacion_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluacion',
    default: null
  },
  habilitado: { type: Boolean, default: false } // Nuevo campo

});

const Tema = mongoose.model('Tema', temaSchema);

module.exports = Tema;

