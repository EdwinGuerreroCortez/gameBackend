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
    },
  },
  experiencia_en_lenguaje_de_programacion: {
    type: [String],
    required: true,
  },
  evaluaciones_realizadas: [
    {
      tema_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      preguntas_respondidas: [
        {
          pregunta_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          respuesta_elegida: {
            type: String,
            required: true,
          },
        },
      ],
      calificacion: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
