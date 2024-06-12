// src/models/ContactMessage.js
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  tipoMensaje: {
    type: String,
    required: true,
    enum: ['Pregunta', 'Sugerencia', 'Queja']
  },
  correo: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, 'Por favor ingrese un correo válido']
  },
  mensaje: {
    type: String,
    required: true
  },
  respuesta: {
    type: String,
    default: '' 
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
