const express = require('express');
const router = express.Router();
const Examen = require('../models/examen');
const Usuario = require('../models/usuario');

// Ruta para guardar resultados de exámenes
router.post('/examenes', async (req, res) => {
  try {
    const { usuarioId, temaId, porcentaje, preguntasRespondidas } = req.body;

    const examenExistente = await Examen.findOne({ usuarioId, temaId });

    if (examenExistente) {
      return res.status(400).json({ message: 'El examen ya ha sido realizado.' });
    }

    const nuevoExamen = new Examen({
      usuarioId,
      temaId,
      preguntasRespondidas,
      porcentaje,
      intentos: 1,
      fecha: new Date() // Guardar la fecha actual
    });

    await nuevoExamen.save();

    res.status(200).json({ message: 'Examen guardado exitosamente', examen: nuevoExamen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Ruta para obtener todos los exámenes con el título del tema
router.get('/examenes', async (req, res) => {
  try {
    const examenes = await Examen.find()
      .populate('usuarioId', 'matricula') // Popula el campo usuarioId para obtener la matrícula
      .populate('temaId', 'titulo'); // Popula el campo temaId para obtener el título del tema

    res.status(200).json(examenes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
