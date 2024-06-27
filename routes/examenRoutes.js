const express = require('express');
const router = express.Router();
const Examen = require('../models/examen');
const Usuario = require('../models/usuario');
const Curso = require('../models/cursos');


// Ruta para guardar resultados de exámenes
router.post('/examenes', async (req, res) => {
  try {
    const { usuarioId, temaId, porcentaje, preguntasRespondidas, fecha } = req.body;

    let examenExistente = await Examen.findOne({ usuarioId, temaId });

    if (examenExistente) {
      examenExistente.intentos += 1;
      examenExistente.preguntasRespondidas.push({
        intento: examenExistente.intentos,
        fecha,
        respuestas: preguntasRespondidas,
        porcentaje
      });
      examenExistente.examenPermitido = false; // Establecer examenPermitido a false
    } else {
      examenExistente = new Examen({
        usuarioId,
        temaId,
        intentos: 1,
        examenPermitido: false, // Establecer examenPermitido a false
        preguntasRespondidas: [{
          intento: 1,
          fecha,
          respuestas: preguntasRespondidas,
          porcentaje
        }]
      });
    }

    await examenExistente.save();
    res.status(200).json({ message: 'Examen guardado exitosamente', examen: examenExistente });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Ruta para obtener todos los exámenes con el título del tema y la matrícula del usuario
router.get('/examenes', async (req, res) => {
  try {
    const examenes = await Examen.find()
      .populate('usuarioId', 'matricula datos_personales')
      .populate('temaId', 'titulo');

    res.status(200).json(examenes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/examenes/:usuarioId/:temaId', async (req, res) => {
  try {
    const { usuarioId, temaId } = req.params;
    const examen = await Examen.findOne({ usuarioId, temaId });

    if (examen) {
      res.status(200).json(examen);
    } else {
      res.status(404).json({ message: 'Examen no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Nueva ruta para cambiar el estado de examenPermitido
router.put('/examenes/:id/toggle', async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id);
    if (!examen) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }

    examen.examenPermitido = !examen.examenPermitido;
    await examen.save();

    res.status(200).json({ message: 'Estado de examen permitido actualizado', examen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  
});


// Nueva ruta para obtener un examen específico por id
router.get('/examenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const examen = await Examen.findById(id)
      .populate('usuarioId', 'matricula datos_personales')
      .populate('temaId', 'titulo');

    if (examen) {
      res.status(200).json(examen);
    } else {
      res.status(404).json({ message: 'Examen no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});






module.exports = router;

