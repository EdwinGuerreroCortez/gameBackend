const mongoose = require('mongoose');

const misionVisionSchema = new mongoose.Schema({
  mision: {
    type: String,
    required: true,
  },
  vision: {
    type: String,
    required: true,
  }
}, { collection: 'misionVision' }); // Especificar el nombre de la colección

const MisionVision = mongoose.model('MisionVision', misionVisionSchema);

module.exports = MisionVision;
