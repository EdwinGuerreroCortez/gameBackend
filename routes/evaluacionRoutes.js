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
    console.log('Tema ID:', tema_id); // Verificar tema_id recibido
    console.log('Buffer:', buffer); // Verificar buffer recibido

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('Datos procesados del Excel:', data); // Verificar datos del Excel

    const evaluaciones = data.map(item => ({
      tema_id: tema_id,
      evaluacion: [
        {
          pregunta: item.pregunta,
          opciones: item.opciones.split(',').map(opcion => opcion.trim()),
          respuesta_correcta: item.respuesta_correcta
        }
      ]
    }));

    console.log('Evaluaciones:', evaluaciones); // Verificar estructura de evaluaciones

    for (const evaluacion of evaluaciones) {
      const nuevaEvaluacion = new Evaluacion(evaluacion);
      await nuevaEvaluacion.save();
    }

    res.status(201).json({ message: 'Evaluaciones cargadas exitosamente' });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(400).json({ message: 'Error al procesar el archivo' });
  }
});

module.exports = router;
