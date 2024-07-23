const mongoose = require('mongoose');
const Usuario = require('./models/usuario'); // Asegúrate de que el path sea correcto
const Tema = require('./models/tema'); // Asegúrate de que el path sea correcto
const Examen = require('./models/examen'); // Asegúrate de que el path sea correcto

const MONGODB_URI = 'mongodb+srv://guerrerocortezedwin416:vGR6ghb9TpRQKyNZ@paginaunigame.12kgvqs.mongodb.net/bdUniGame';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function actualizarExamenes() {
  try {
    const examenes = await Examen.find();

    for (const examen of examenes) {
      // Obtener el nombre del usuario y la matrícula
      const usuario = await Usuario.findById(examen.usuarioId).select('datos_personales.nombre datos_personales.matricula');
      const nombreUsuario = usuario ? usuario.datos_personales.nombre : 'Desconocido';
      const matriculaUsuario = usuario ? usuario.datos_personales.matricula : 'Desconocido';

      // Obtener el nombre del tema
      const tema = await Tema.findById(examen.temaId).select('titulo');
      const nombreTema = tema ? tema.titulo : 'Desconocido';

      // Actualizar el examen con los nombres y la matrícula
      examen.usuario = nombreUsuario;
      examen.matricula = matriculaUsuario;
      examen.tema = nombreTema;

      await examen.save();
    }

    console.log('Documentos de exámenes actualizados exitosamente.');
  } catch (error) {
    console.error('Error al actualizar los documentos de exámenes:', error);
  } finally {
    mongoose.connection.close();
  }
}

actualizarExamenes();
