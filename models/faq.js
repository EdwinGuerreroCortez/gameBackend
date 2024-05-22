const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  pregunta: {
    type: String,
    required: true,
  },
  respuesta: {
    type: String,
    required: true,
  }
});

const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
