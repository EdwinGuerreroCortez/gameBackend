const mongoose = require('mongoose');

const pasoSchema = new mongoose.Schema({
  Titulo: String,
  Descripcion: String,
});

const temaSchema = new mongoose.Schema({
  titulo: String,
  descripcion: String,
  fecha_creacion: { type: Date, default: Date.now },
  autor: String,
  pasos: [pasoSchema],
  video: { type: String, default: null },
});

const Tema = mongoose.model('Tema', temaSchema);

module.exports = Tema;
