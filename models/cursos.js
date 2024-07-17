const mongoose = require('mongoose');

const nombreCursoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  temas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tema' // Referencia al modelo de temas
  }],
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al modelo de usuarios
    default: null
  },
  subscritores: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId, //Nombre completo del usuario, correo, matricula
      ref: 'Usuario'
    },
    banear: {
      type: Boolean,
      default: true
    }
  }]
}, 
{ collection: 'cursos' });

const Curso = mongoose.model('Curso', nombreCursoSchema);

module.exports = Curso;
