const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuario');
const Curso = require('../models/cursos'); 
const Tema = require('../models/tema'); 
const Examen = require('../models/examen');
const Contador = require('../models/contador');
const VerificationCode = require('../models/verificationCode');

// Obtener un usuario por ID
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

// Ruta para autorizar todos los usuarios
router.put('/usuarios/autorizarTodos', async (req, res) => {
  try {
    await Usuario.updateMany({}, { autorizacion: true });
    res.status(200).json({ message: 'Todos los usuarios autorizados con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al autorizar todos los usuarios.' });
  }
});

// Endpoint para verificar el código de verificación
router.post('/verificar-codigo', async (req, res) => {
  const { email, codigoVerificacion } = req.body;
  try {
    const usuario = await Usuario.findOne({ 'datos_personales.correo': email });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.codigoVerificacion || usuario.codigoVerificacion.codigo !== codigoVerificacion || usuario.codigoVerificacion.expiracion < Date.now()) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado.' });
    }

    res.status(200).json({ message: 'Código de verificación correcto.' });
  } catch (error) {
    console.error('Error al verificar el código de verificación:', error);
    res.status(500).json({ message: 'Error al verificar el código de verificación.' });
  }
});

// Endpoint para cambiar la contraseña
router.post('/cambiar-contrasena', async (req, res) => {
  const { email, codigoVerificacion, nuevaContrasena } = req.body;
  try {
    const usuario = await Usuario.findOne({ 'datos_personales.correo': email });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.codigoVerificacion || usuario.codigoVerificacion.codigo !== codigoVerificacion || usuario.codigoVerificacion.expiracion < Date.now()) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado.' });
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    usuario.password = hashedPassword;
    usuario.codigoVerificacion = undefined;
    await usuario.save();

    res.status(200).json({ message: 'Contraseña cambiada exitosamente.' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña.' });
  }
});
// Endpoint para enviar el código de verificación
router.post('/recuperar-contrasena', async (req, res) => {
  const { email } = req.body;
  try {
    const usuario = await Usuario.findOne({ 'datos_personales.correo': email });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar un código de verificación
    const codigoVerificacion = crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres hexadecimales

    // Guardar el código de verificación y su fecha de expiración en el usuario
    usuario.codigoVerificacion = {
      codigo: codigoVerificacion,
      expiracion: Date.now() + 3600000, // 1 hora de validez
    };
    await usuario.save();

    // Configurar nodemailer para enviar el correo.
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'studyweb.uthh@gmail.com',
        pass: 'fckzvtqbjkhuuiid',
      },
    });

    const mailOptions = {
      from: 'studyweb.uthh@gmail.com',
      to: email,
      subject: 'Recuperación de Contraseña',
      html: `
        <div style="text-align: center; font-size: 16px; font-family: Arial, sans-serif;">
          <div style="padding: 20px; background-color: #f7f7f7; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h1 style="font-size: 24px; color: #333;">Recuperación de Contraseña</h1>
            <p style="font-size: 18px; color: #555;">Tu código de verificación es:</p>
            <p style="font-size: 32px; font-weight: bold; color: #000; margin: 20px 0; animation: fadeIn 2s ease-in-out;">${codigoVerificacion}</p>
            <p style="font-size: 14px; color: #777;">Este código es válido por una hora.</p>
          </div>
          <style>
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          </style>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Código de verificación enviado a tu correo electrónico.' });
  } catch (error) {
    console.error('Error al enviar el código de verificación:', error);
    res.status(500).json({ message: 'Error al enviar el código de verificación.' });
  }
});


// Endpoint para cambiar la contraseña
router.post('/cambiar-contrasena', async (req, res) => {
  const { email, codigoVerificacion, nuevaContrasena } = req.body;
  try {
    const usuario = await Usuario.findOne({ 'datos_personales.correo': email });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar el código de verificación y su expiración
    if (!usuario.codigoVerificacion || usuario.codigoVerificacion.codigo !== codigoVerificacion || usuario.codigoVerificacion.expiracion < Date.now()) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado.' });
    }

    // Cifrar la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar la contraseña y eliminar el código de verificación
    usuario.password = hashedPassword;
    usuario.codigoVerificacion = undefined;
    await usuario.save();

    res.status(200).json({ message: 'Contraseña cambiada exitosamente.' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña.' });
  }
});


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
       // Línea de depuración
  
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

    // Incrementar el contador de visitas
    const contador = await Contador.findOne({ userId: usuario._id });
    if (contador) {
      contador.visitas += 1;
      await contador.save();
    } else {
      await Contador.create({ userId: usuario._id, correo: usuario.datos_personales.correo, visitas: 1 });
    }

    // Obtener el total de visitas
    const totalVisitas = await Contador.aggregate([{ $group: { _id: null, total: { $sum: "$visitas" } } }]);

    // Devolver el ID del usuario, el tipo y el total de visitas
    res.json({ message: 'Inicio de sesión exitoso', userId: usuario._id, tipo: usuario.tipo, totalVisitas: totalVisitas[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Endpoint para obtener el total de visitas
router.get('/total-visitas', async (req, res) => {
  try {
    const totalVisitas = await Contador.aggregate([{ $group: { _id: null, total: { $sum: "$visitas" } } }]);
    res.json({ totalVisitas: totalVisitas[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//endpoint para la obtencion de entradas
router.get('/entradas', async (req, res) => {
  try {
    const entradas = await Contador.find();
    const entradasConDetalles = await Promise.all(entradas.map(async (entrada) => {
      const usuario = await Usuario.findById(entrada.userId);
      if (usuario) {
        return {
          ...entrada._doc,
          nombre: usuario.datos_personales.nombre,
          correo: entrada.correo, // Obtener el correo desde la colección Contador
        };
      } else {
        return {
          ...entrada._doc,
          nombre: 'Usuario ya no existe',
          correo: entrada.correo || 'N/A', // Obtener el correo desde la colección Contador
        };
      }
    }));
    res.json(entradasConDetalles);
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

// Endpoint para actualizar un usuario por ID.
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
  const userId = req.params.id;
  try {
      const usuario = await Usuario.findById(userId);
      if (!usuario) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Buscar y actualizar los cursos eliminando la suscripción del usuario
      await Curso.updateMany(
          { "subscritores.usuario": userId },
          { $pull: { subscritores: { usuario: userId } } }
      );

      await Usuario.deleteOne({ _id: userId });
      res.json({ message: 'Usuario eliminado con éxito y sus suscripciones han sido actualizadas.' });
  } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});


// Endpoint para guardar resultados de evaluaciones
router.post('/usuarios/:id/evaluaciones', async (req, res) => {
  try {
    const { examen_id } = req.body; // Solo se necesita el examen_id
    const userId = req.params.id;

    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Agregar solo el ID del examen al campo evaluaciones_realizadas
    usuario.evaluaciones_realizadas.push(examen_id);

    await usuario.save();
    res.status(200).json({ message: 'Evaluación del usuario guardada exitosamente' });
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

// Endpoint to get subscribed courses for the logged-in user
router.get('/usuarios/:userId/cursos-suscritos', async (req, res) => {
  try {
    const userId = req.params.userId;
    const usuario = await Usuario.findById(userId).populate('cursosSubscritos');
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ cursos: usuario.cursosSubscritos });
  } catch (error) {
    console.error('Error al obtener los cursos suscritos del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los cursos suscritos del usuario.' });
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

    // Extraer todos los temas de los cursos del usuario
    const todosLosTemas = usuario.cursos.reduce((acumulador, curso) => {
      return acumulador.concat(curso.temas);
    }, []);

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

    // Extraer todos los temas y sus evaluaciones de los cursos del usuario
    const temasConEvaluaciones = usuario.cursos.reduce((acumulador, curso) => {
      curso.temas.forEach(tema => {
        if (tema.evaluacion_id) {
          acumulador.push({
            tema: tema,
            evaluacion: tema.evaluacion_id,
            cursoNombre: curso.nombre,
            cursoId: curso._id // Añadir el ID del curso
          });
        }
      });
      return acumulador;
    }, []);
    res.json(temasConEvaluaciones);
  } catch (error) {
    console.error('Error al obtener los temas y evaluaciones del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los temas y evaluaciones del usuario.' });
  }
});


router.get('/usuario/:usuarioId/temasbuscar', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    

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

    // Extraer todos los temas de los cursos del usuario
    const todosLosTemas = usuario.cursos.reduce((acumulador, curso) => {
      return acumulador.concat(curso.temas);
    }, []);


    // Obtener los IDs de los temas encontrados
    const temasIds = todosLosTemas.map(tema => tema._id);

    // Buscar exámenes que tengan temaId coincidente con los temas encontrados
    const examenesRelacionados = await Examen.find({ temaId: { $in: temasIds } });

    // Mostrar solo los IDs de los exámenes encontrados
    const examenesIds = examenesRelacionados.map(examen => examen._id);

    res.json({ temas: todosLosTemas, examenes: examenesRelacionados });
  } catch (error) {
    console.error('Error al obtener los temas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener los temas del usuario.' });
  }
});

// Endpoint para enviar el código de verificación al correo
router.post('/enviar-codigo-registro', async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si ya existe un usuario con el mismo correo
    const usuarioExistente = await Usuario.findOne({ 'datos_personales.correo': email });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Correo electrónico ya registrado.' });
    }

    // Generar un código de verificación
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres hexadecimales

    // Crear un nuevo documento de VerificationCode
    const verificationCode = new VerificationCode({
      email: email,
      code: code,
      expiresAt: Date.now()  + 3 * 60 * 1000, // 3 minutos de validez
    });

    await verificationCode.save();

    // Configurar nodemailer para enviar el correo.
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'studyweb.uthh@gmail.com',
        pass: 'fckzvtqbjkhuuiid',
      },
    });

    const mailOptions = {
      from: 'studyweb.uthh@gmail.com',
      to: email,
      subject: 'Código de Verificación',
      html: `
        <div style="text-align: center; font-size: 16px; font-family: Arial, sans-serif;">
          <div style="padding: 20px; background-color: #f7f7f7; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h1 style="font-size: 24px; color: #333;">Código de Verificación</h1>
            <p style="font-size: 18px; color: #555;">Tu código de verificación es:</p>
            <p style="font-size: 32px; font-weight: bold; color: #000; margin: 20px 0; animation: fadeIn 2s ease-in-out;">${code}</p>
            <p style="font-size: 14px; color: #777;">Este código es válido por 3 minutos.</p>
          </div>
          <style>
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          </style>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Código de verificación enviado a tu correo electrónico.' });
  } catch (error) {
    console.error('Error al enviar el código de verificación:', error);
    res.status(500).json({ message: 'Error al enviar el código de verificación.' });
  }
});

// Endpoint para verificar el código de registro
router.post('/verificar-codigo-registro', async (req, res) => {
  const { email, code } = req.body;

  try {
    const verificationCode = await VerificationCode.findOne({ email, code });

    if (!verificationCode) {
      return res.status(400).json({ message: 'Código de verificación incorrecto o expirado.' });
    }

    if (verificationCode.expiresAt < Date.now()) {
      await VerificationCode.deleteOne({ _id: verificationCode._id });
      return res.status(400).json({ message: 'Código de verificación expirado.' });
    }

    await VerificationCode.deleteOne({ _id: verificationCode._id });

    res.status(200).json({ message: 'Código de verificación correcto.' });
  } catch (error) {
    console.error('Error al verificar el código de registro:', error);
    res.status(500).json({ message: 'Error al verificar el código de registro.' });
  }
});

module.exports = router;
