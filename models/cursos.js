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
}, { collection: 'cursos' }); // Especificar el nombre de la colección

const NombreCurso = mongoose.model('NombreCurso', nombreCursoSchema);

module.exports = NombreCurso;
