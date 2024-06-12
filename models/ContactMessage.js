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
    createdAt: {
      type: Date,
      default: Date.now // Este campo guardará la fecha de creación del documento
    }
  });  

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
