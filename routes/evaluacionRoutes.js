const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const Evaluacion = require('../models/evaluacion');
const upload = require('../middleware/upload');

// Ruta para cargar archivo Excel
router.post('/evaluaciones/upload', upload.single('file'), async (req, res) => {
  try {
    const tema_id = req.body.tema;
    const buffer = req.file.buffer;

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const nuevasEvaluaciones = data.map(item => ({
      pregunta: item.pregunta,
      opciones: item.opciones.split(',').map(opcion => opcion.trim()),
      respuesta_correcta: item.respuesta_correcta
    }));

    // Crear un nuevo documento para cada archivo Excel
    const nuevaEvaluacion = new Evaluacion({
      tema_id: tema_id,
      evaluacion: nuevasEvaluaciones
    });

    await nuevaEvaluacion.save();

    res.status(201).json({ message: 'Evaluaciones cargadas exitosamente' });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(400).json({ message: 'Error al procesar el archivo' });
  }
});

module.exports = router;
