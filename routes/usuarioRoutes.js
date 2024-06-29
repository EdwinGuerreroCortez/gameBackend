const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');
const Curso = require('../models/cursos'); // Reemplaza con la ruta correcta a tu modelo
const Tema = require('../models/tema'); // Asegúrate de que la ruta sea correcta
const Examen = require('../models/examen');

// Endpoint para obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para crear un nuevo usuario
router.post('/usuarios', async (req, res) => {
    try {
      console.log('Datos del nuevo usuario:', req.body); // Línea de depuración
  
      // Cifrar el password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
      // Crear el nuevo usuario con el password cifrado
      const nuevoUsuario = new Usuario({
        ...req.body,
        password: hashedPassword
      });
  
      await nuevoUsuario.save();
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  

// Endpoint para verificar si existe un usuario
router.post('/verificar', async (req, res) => {
    const { telefono, correo, matricula } = req.body;

    try {
        const telefonoExistente = await Usuario.findOne({ 'datos_personales.telefono': telefono });
        if (telefonoExistente) {
            return res.status(200).json({ message: 'Teléfono ya registrado.' });
        }

        const correoExistente = await Usuario.findOne({ 'datos_personales.correo': correo });
        if (correoExistente) {
            return res.status(200).json({ message: 'Correo electrónico ya registrado.' });
        }

        const matriculaExistente = await Usuario.findOne({ 'datos_personales.matricula': matricula });
        if (matriculaExistente) {
            return res.status(200).json({ message: 'Matrícula ya registrada.' });
        }

        return res.status(200).json({ message: 'Usuario no encontrado.' });
    } catch (error) {
        console.error('Error del servidor:', error);
        return res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Endpoint para iniciar sesión
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const usuario = await Usuario.findOne({ "datos_personales.correo": email });
  
      if (!usuario) {
        return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
      }
  
      const passwordMatch = await bcrypt.compare(password, usuario.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
      }
  
      if (!usuario.autorizacion) {
        return res.status(401).json({ message: 'No tienes autorización para acceder' });
      }
  
      // Devolver el ID del usuario y el tipo
      res.json({ message: 'Inicio de sesión exitoso', userId: usuario._id, tipo: usuario.tipo });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });  

// Endpoint para obtener un usuario por ID
router.get('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para actualizar un usuario por ID
router.put('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const updates = req.body;

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        Object.keys(updates).forEach(key => {
            if (key === 'datos_personales') {
                Object.keys(updates.datos_personales).forEach(subKey => {
                    usuario.datos_personales[subKey] = updates.datos_personales[subKey];
                });
            } else {
                usuario[key] = updates[key];
            }
        });

        await usuario.save();
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para actualizar la imagen de perfil
router.put('/usuarios/:id/imagen', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        usuario.imagenPerfil = req.body.imagenPerfil;
        await usuario.save();

        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para añadir admin o docente
router.post('/usuarios/admin', async (req, res) => {
  try {
    const { correo, telefono, nomusuario, contrasena, tipo, nombre, apellidoPaterno, apellidoMaterno, genero } = req.body;

    // Verificar si ya existe un usuario con el mismo correo
    const usuarioExistentePorCorreo = await Usuario.findOne({ 'datos_personales.correo': correo });
    if (usuarioExistentePorCorreo) {
      return res.status(400).json({ error: 'El correo ya está registrado. Por favor, use otro correo.' });
    }

    // Verificar si ya existe un usuario con el mismo teléfono
    const usuarioExistentePorTelefono = await Usuario.findOne({ 'datos_personales.telefono': telefono });
    if (usuarioExistentePorTelefono) {
      return res.status(400).json({ error: 'El teléfono ya está registrado. Por favor, use otro teléfono.' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = new Usuario({
      username: nomusuario,
      password: hashedPassword,
      tipo: tipo,
      datos_personales: {
        nombre: nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        correo: correo,
        edad: '0',
        genero: genero,
        telefono: telefono,
        grado_de_estudios: 'N/A', // Valor predeterminado
      },
      experiencia_en_lenguaje_de_programacion: [], // Valor predeterminado
      evaluaciones_realizadas: [], // Valor predeterminado
      autorizacion: true, // Asegurarte de establecer este campo
    });

    await nuevoUsuario.save();
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('Error al guardar el usuario:', error); // Depuración: Imprimir error
    res.status(400).json({ message: error.message });
  }
});
  
// Endpoint para eliminar un usuario por ID
router.delete('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        await Usuario.deleteOne({ _id: req.params.id });
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
    }
});

// Endpoint para guardar resultados de evaluaciones
router.post('/usuarios/:id/evaluaciones', async (req, res) => {
    try {
      const { temaId, porcentaje, preguntasRespondidas } = req.body;
      const usuario = await Usuario.findById(req.params.id);
  
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      usuario.evaluaciones_realizadas.push({
        tema_id: temaId,
        porcentaje,
        preguntas_respondidas: preguntasRespondidas,
      });
  
      await usuario.save();
  
      res.status(200).json({ message: 'Evaluación guardada exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

router.put('/usuarios/:id/autorizar', async (req, res) => {
    try {
      const { autorizacion } = req.body;
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      usuario.autorizacion = autorizacion;
      await usuario.save();
  
      res.json({ message: 'Estado de autorización actualizado con éxito', autorizacion: usuario.autorizacion });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
// Endpoint para verificar suscripción al curso
router.post('/usuarios/:usuarioId/verificar-suscripcion/:cursoId', async (req, res) => {
  const { usuarioId, cursoId } = req.params;

  try {
    // Buscar el usuario por ID
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar el curso por ID
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar si el usuario ya está suscrito al curso
    if (usuario.cursosSubscritos && usuario.cursosSubscritos.includes(cursoId)) {
      const subscritor = curso.subscritores.find(sub => sub.usuario.toString() === usuarioId);
      if (subscritor) {
        if (!subscritor.banear) {
          return res.status(200).json({ message: 'Ya estás suscrito a este curso y tienes acceso.' });
        } else {
          return res.status(403).json({ message: 'Has sido baneado de este curso.' });
        }
      }
    } else {
      return res.status(200).json({ message: 'No estás suscrito a este curso. ¿Deseas suscribirte?' });
    }
  } catch (error) {
    console.error('Error al verificar suscripción al curso:', error);
    return res.status(500).json({ message: 'Error al verificar suscripción al curso.', error: error.message });
  }
});

// Endpoint para suscribirse al curso
router.post('/usuarios/:usuarioId/suscribirse/:cursoId', async (req, res) => {
  const { usuarioId, cursoId } = req.params;

  try {
    // Buscar el usuario por ID
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar el curso por ID
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Añadir el ID del curso al array cursosSubscritos del usuario
    usuario.cursosSubscritos = usuario.cursosSubscritos || [];
    usuario.cursosSubscritos.push(cursoId);

    // Añadir el ID del usuario al array subcritores del curso
    curso.subscritores = curso.subscritores || [];
    curso.subscritores.push({ usuario: usuarioId, banear: false });

    // Guardar los cambios en ambos documentos
    await usuario.save();
    await curso.save();

    return res.status(200).json({ message: 'Te has suscrito al curso exitosamente.', usuario, curso });
  } catch (error) {
    console.error('Error al suscribirse al curso:', error);
    return res.status(500).json({ message: 'Error al suscribirse al curso.', error: error.message });
  }
});









  //****************Docentes endpoitn***********************//

  // Endpoint to get courses related to the logged-in user
router.get('/usuario/:userId/cursos', async (req, res) => {
  try {
    const userId = req.params.userId;
    const usuario = await Usuario.findById(userId).populate('cursos');

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario.cursos);
  } catch (error) {
    console.error('Error al obtener los cursos del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los cursos del usuario.' });
  }
});
// Endpoint para obtener los temas de los cursos relacionados a un usuario específico
router.get('/usuario/:usuarioId/temas', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    console.log(`Buscando usuario con ID: ${usuarioId}`);

    // Encontrar al usuario por ID y popular los cursos
    const usuario = await Usuario.findById(usuarioId).populate({
      path: 'cursos',
      populate: {
        path: 'temas',
        model: 'Tema',
      }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log(`Usuario encontrado: ${usuario}`);
    console.log(`Cursos del usuario: ${JSON.stringify(usuario.cursos, null, 2)}`);

    // Extraer todos los temas de los cursos del usuario
    const todosLosTemas = usuario.cursos.reduce((acumulador, curso) => {
      return acumulador.concat(curso.temas);
    }, []);

    console.log(`Temas encontrados: ${JSON.stringify(todosLosTemas, null, 2)}`);

    res.json(todosLosTemas);
  } catch (error) {
    console.error('Error al obtener los temas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los temas del usuario.' });
  }
});

// Endpoint para obtener los temas y sus evaluaciones relacionadas de un usuario específico
router.get('/usuario/:usuarioId/temas-evaluaciones', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    console.log(`Buscando usuario con ID: ${usuarioId}`);

    // Encontrar al usuario por ID y popular los cursos y temas
    const usuario = await Usuario.findById(usuarioId).populate({
      path: 'cursos',
      populate: {
        path: 'temas',
        model: 'Tema',
        populate: {
          path: 'evaluacion_id',
          model: 'Evaluacion'
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log(`Usuario encontrado: ${usuario}`);
    console.log(`Cursos del usuario: ${JSON.stringify(usuario.cursos, null, 2)}`);

    // Extraer todos los temas y sus evaluaciones de los cursos del usuario
    const temasConEvaluaciones = usuario.cursos.reduce((acumulador, curso) => {
      curso.temas.forEach(tema => {
        if (tema.evaluacion_id) {
          acumulador.push({
            tema: tema,
            evaluacion: tema.evaluacion_id
          });
        }
      });
      return acumulador;
    }, []);

    console.log(`Temas y evaluaciones encontrados: ${JSON.stringify(temasConEvaluaciones, null, 2)}`);

    res.json(temasConEvaluaciones);
  } catch (error) {
    console.error('Error al obtener los temas y evaluaciones del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los temas y evaluaciones del usuario.' });
  }
});
router.get('/usuario/:usuarioId/temasbuscar', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    console.log(`Buscando usuario con ID: ${usuarioId}`);

    // Encontrar al usuario por ID y popular los cursos
    const usuario = await Usuario.findById(usuarioId).populate({
      path: 'cursos',
      populate: {
        path: 'temas',
        model: 'Tema',
      }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log(`Usuario encontrado: ${usuario}`);
    console.log(`Cursos del usuario: ${JSON.stringify(usuario.cursos, null, 2)}`);

    // Extraer todos los temas de los cursos del usuario
    const todosLosTemas = usuario.cursos.reduce((acumulador, curso) => {
      return acumulador.concat(curso.temas);
    }, []);

    console.log(`Temas encontrados: ${JSON.stringify(todosLosTemas, null, 2)}`);

    // Obtener los IDs de los temas encontrados
    const temasIds = todosLosTemas.map(tema => tema._id);

    // Buscar exámenes que tengan temaId coincidente con los temas encontrados
    const examenesRelacionados = await Examen.find({ temaId: { $in: temasIds } });

    // Mostrar solo los IDs de los exámenes encontrados
    const examenesIds = examenesRelacionados.map(examen => examen._id);
    console.log(`IDs de exámenes relacionados: ${JSON.stringify(examenesIds, null, 2)}`);

    res.json({ temas: todosLosTemas, examenes: examenesRelacionados });
  } catch (error) {
    console.error('Error al obtener los temas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los temas del usuario.' });
  }
});


module.exports = router;
