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
      default: 0 // valor predeterminado para administradores
    },
    genero: {
      type: String,
      required: true,
      default: 'N/A' // valor predeterminado para administradores
    },
    telefono: {
      type: String,
      required: true,
      default: 'N/A' // valor predeterminado para administradores
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
      tema_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluacion',
        required: true,
      },
      porcentaje: {
        type: Number,
        required: true,
      },
      preguntas_respondidas: [
        {
          pregunta: {
            type: String,
            required: true,
          },
          respuesta: {
            type: String,
            required: true,
          },
          correcta: {
            type: Boolean,
            required: true,
          },
        },
      ],
    },
  ],
  rol: {
    type: String,
    enum: ['cliente', 'administrador'],
    default: 'cliente',
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
