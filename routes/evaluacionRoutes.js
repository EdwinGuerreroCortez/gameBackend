const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const Evaluacion = require('../models/evaluacion');
const Tema = require('../models/tema');
const upload = require('../middleware/upload');

// Función para validar las evaluaciones
const validateEvaluaciones = (evaluaciones) => {
  const errors = [];
  evaluaciones.forEach((eval, index) => {
    const { pregunta, opciones, respuesta_correcta } = eval;
    if (!pregunta) {
      errors.push(`Pregunta vacía en la fila ${index + 2}`);
    }
    if (!respuesta_correcta) {
      errors.push(`Respuesta correcta vacía en la fila ${index + 2}`);
    }
    if (!opciones || opciones.length !== 4) {
      errors.push(`Número incorrecto de opciones en la fila ${index + 2} (debe haber 4 opciones)`);
    }
    if (opciones && opciones.includes('')) {
      errors.push(`Opciones vacías en la fila ${index + 2}`);
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

    const nuevasEvaluaciones = data.map(item => ({
      pregunta: item.pregunta,
      opciones: item.opciones.split(',').map(opcion => opcion.trim()),
      respuesta_correcta: item.respuesta_correcta
    }));

    const validationErrors = validateEvaluaciones(nuevasEvaluaciones);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Errores de validación', details: validationErrors });
    }

    const nuevaEvaluacion = new Evaluacion({
      tema_id: tema_id,
      evaluacion: nuevasEvaluaciones
    });

    const savedEvaluacion = await nuevaEvaluacion.save();

    await Tema.findByIdAndUpdate(tema_id, { evaluacion_id: savedEvaluacion._id });

    res.status(201).json({ message: 'Evaluaciones cargadas exitosamente', evaluacion: savedEvaluacion });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(400).json({ message: 'Error al procesar el archivo', details: error.message });
  }
});

// Ruta para descargar el archivo Excel del tema
router.get('/temas/:id/download', async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id).populate('evaluacion_id');
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    const workbook = xlsx.utils.book_new();
    const data = tema.evaluacion_id.evaluacion.map((pregunta, index) => ({
      pregunta: pregunta.pregunta,
      opciones: pregunta.opciones.join(', '),
      respuesta_correcta: pregunta.respuesta_correcta
    }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Evaluacion');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename=${tema.titulo}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
    res.status(500).json({ message: 'Error al descargar el archivo', error });
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

// Ruta para eliminar una evaluación
router.delete('/evaluaciones/:id', async (req, res) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    await Evaluacion.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Evaluación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la evaluación', error });
  }
});

// Ruta para editar una evaluación
router.put('/evaluaciones/:id', upload.single('file'), async (req, res) => {
  try {
    const evaluacionId = req.params.id;
    const tema_id = req.body.tema;
    const buffer = req.file ? req.file.buffer : null;

    if (buffer) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      const nuevasEvaluaciones = data.map(item => ({
        pregunta: item.pregunta,
        opciones: item.opciones.split(',').map(opcion => opcion.trim()),
        respuesta_correcta: item.respuesta_correcta
      }));

      const validationErrors = validateEvaluaciones(nuevasEvaluaciones);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Errores de validación', details: validationErrors });
      }

      await Evaluacion.findByIdAndUpdate(evaluacionId, {
        tema_id: tema_id,
        evaluacion: nuevasEvaluaciones
      });
    } else {
      await Evaluacion.findByIdAndUpdate(evaluacionId, { tema_id: tema_id });
    }

    res.status(200).json({ message: 'Evaluación actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar la evaluación:', error);
    res.status(500).json({ message: 'Error al actualizar la evaluación', error });
  }
});
//
module.exports = router;
