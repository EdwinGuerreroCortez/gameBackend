const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuario' },
  correo: { type: String, required: true },
  visitas: { type: Number, default: 1 }
});

const Contador = mongoose.model('Contador', contadorSchema);

module.exports = Contador;
