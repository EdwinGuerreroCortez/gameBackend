const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');

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

//endpoint para añadir admin o docente 
router.post('/usuarios/admin', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.contrasena, 10);
  
      const nuevoUsuario = new Usuario({
        username: req.body.nomusuario,
        password: hashedPassword,
        tipo: req.body.tipo,
        datos_personales: {
          nombre: req.body.nombre,
          apellido_paterno: req.body.apellidoPaterno,
          apellido_materno: req.body.apellidoMaterno,
          correo: req.body.correo,
          edad:  '0',
          genero: req.body.genero,
          telefono: req.body.telefono,
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
  
module.exports = router;
