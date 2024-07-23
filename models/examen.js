const mongoose = require('mongoose');
const Usuario = require('./usuario'); // Modelo de Usuario
const Tema = require('./tema'); // Modelo de Tema
const Schema = mongoose.Schema;

const PreguntaRespondidaSchema = new Schema({
  intento: Number,
  fecha: Date,
  respuestas: [
    {
      pregunta: String,
      respuesta: String,
      correcta: Boolean,
    }
  ],
  porcentaje: Number
});

const ExamenSchema = new Schema({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  usuario: { type: String }, // Nombre del usuario
  matricula: { type: String }, // Matrícula del usuario
  temaId: { type: Schema.Types.ObjectId, ref: 'Tema', required: true },
  tema: { type: String }, // Nombre del tema
  intentos: { type: Number, default: 1 },
  preguntasRespondidas: [PreguntaRespondidaSchema],
  examenPermitido: { type: Boolean, default: false }
}, { collection: 'examenes' });

// Middleware para obtener y guardar el nombre del usuario, la matrícula y el nombre del tema antes de guardar el examen
ExamenSchema.pre('save', async function (next) {
  try {
    // Obtener el nombre del usuario y la matrícula
    const usuario = await Usuario.findById(this.usuarioId).select('datos_personales.nombre datos_personales.matricula');
    if (usuario) {
      this.usuario = usuario.datos_personales.nombre;
      this.matricula = usuario.datos_personales.matricula;
    } else {
      this.usuario = 'Desconocido';
      this.matricula = 'Desconocido';
    }

    // Obtener el nombre del tema
    const tema = await Tema.findById(this.temaId).select('titulo');
    this.tema = tema ? tema.titulo : 'Desconocido';

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Examen', ExamenSchema);
