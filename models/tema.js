const mongoose = require('mongoose');

const PasoSchema = new mongoose.Schema({
  Titulo: { type: String, required: true },
  Descripcion: { type: String, required: true },
});

const SubtemaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  video: { type: String, default: null },
});

const TemaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  responsable: { type: String, required: true },
  bibliografia: { type: String, required: true },
  pasos: [PasoSchema],
  subtemas: { type: [SubtemaSchema], default: [] },
  video: { type: String, default: null },
  evaluacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluacion' },
  habilitado: { type: Boolean, default: false },
  fecha_creacion: { type: Date, default: Date.now },
  curso: { type: mongoose.Schema.Types.ObjectId, ref: 'Curso' }, // Referencia al curso
});

module.exports = mongoose.model('Tema', TemaSchema);
