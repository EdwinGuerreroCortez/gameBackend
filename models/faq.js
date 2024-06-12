const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  pregunta: {
    type: String,
    required: true,
  },
  respuesta: {
    type: String,
    default: null, // La respuesta puede ser nula inicialmente
  }, 
});

const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
