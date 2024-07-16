const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  imagenPerfil: {
    type: String,
    default: 'https://png.pngtree.com/png-vector/20191018/ourmid/pngtree-user-icon-isolated-on-abstract-background-png-image_1824979.jpg'
  },
  tipo: {
    type: String,
    required: true,
  },
  fecha_registro: {
    type: Date,
    default: Date.now,
  },
  datos_personales: {
    nombre: {
      type: String,
      required: true,
    },
    apellido_paterno: {
      type: String,
      required: true,
    },
    apellido_materno: {
      type: String,
      required: true,
    },
    edad: {
      type: Number,
      required: true,
    },
    genero: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      required: true,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
    },
    grado_de_estudios: {
      type: String,
      required: true,
      default: 'N/A' // valor predeterminado para administradores
    },
    matricula: {
      type: String,
      required: true, // Aquí asumimos que es un campo obligatorio
      default: 'N/A' // valor predeterminado para administradores
    },
  },
  experiencia_en_lenguaje_de_programacion: {
    type: [String],
    required: true,
    default: [] // valor predeterminado para administradores
  },
  evaluaciones_realizadas: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examen', // Referencia a la colección de exámenes
    },
  ],
  autorizacion: {
    type: Boolean,
    default: false,
  },
  cursos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso'
  }],
  cursosSubscritos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso'
  }],
  codigoVerificacion: {
    codigo: { type: String },
    expiracion: { type: Date },
  },
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
