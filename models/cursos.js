const mongoose = require('mongoose');

const nombreCursoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  temas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tema' // Referencia al modelo de temas
  }]
}, { collection: 'cursos' });

const Curso = mongoose.model('Curso', nombreCursoSchema);

module.exports = Curso;
