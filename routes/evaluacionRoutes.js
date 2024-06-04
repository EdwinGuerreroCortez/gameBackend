const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const Evaluacion = require('../models/evaluacion');
const Tema = require('../models/tema');
const upload = require('../middleware/upload');

// Función para validar los datos del Excel
const validateExcelData = (data) => {
  const requiredFields = ['pregunta', 'opciones', 'respuesta_correcta'];
  let errors = [];

  data.forEach((row, rowIndex) => {
    requiredFields.forEach((field) => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`La fila ${rowIndex + 2} tiene el campo "${field}" vacío.`); // Ajuste del índice para coincidir con la fila real en Excel
      }
    });

    if (row.opciones) {
      const opciones = row.opciones.split(',').map(opcion => opcion.trim());
      if (opciones.length !== 4) {
        errors.push(`La fila ${rowIndex + 2} debe tener exactamente 4 opciones, pero tiene ${opciones.length}.`);
      }
    }
  });

  return errors;
};

// Ruta para cargar archivo Excel
router.post('/evaluaciones/upload', upload.single('file'), async (req, res) => {
  try {
    const tema_id = req.body.tema;
    const buffer = req.file.buffer;

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validar los datos del Excel
    const validationErrors = validateExcelData(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Errores de validación en el archivo Excel.', details: validationErrors });
    }

    const nuevasEvaluaciones = data.map(item => ({
      pregunta: item.pregunta,
      opciones: item.opciones.split(',').map(opcion => opcion.trim()),
      respuesta_correcta: item.respuesta_correcta
    }));

    // Crear la nueva evaluación
    const nuevaEvaluacion = new Evaluacion({
      tema_id: tema_id,
      evaluacion: nuevasEvaluaciones
    });

    const savedEvaluacion = await nuevaEvaluacion.save();

    // Actualizar el tema con el ID de la evaluación
    await Tema.findByIdAndUpdate(tema_id, { evaluacion_id: savedEvaluacion._id });

    res.status(201).json({ message: 'Evaluaciones cargadas exitosamente' });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(400).json({ message: 'Error al procesar el archivo' });
  }
});

router.get('/evaluaciones', async (req, res) => {
  try {
    const evaluaciones = await Evaluacion.find().populate('tema_id');
    res.status(200).json(evaluaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las evaluaciones', error });
  }
});

router.post('/usuarios/:id/evaluaciones', async (req, res) => {
  try {
    const { evaluacionId, calificacion } = req.body;
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const evaluacionRealizada = usuario.evaluaciones_realizadas.find(evaluacion => evaluacion.tema_id.toString() === evaluacionId);
    if (evaluacionRealizada) {
      return res.status(400).json({ message: 'La evaluación ya ha sido realizada' });
    }

    usuario.evaluaciones_realizadas.push({ tema_id: evaluacionId, calificacion });
    await usuario.save();

    res.status(200).json({ message: 'Calificación guardada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar la calificación', error });
  }
});

module.exports = router;
