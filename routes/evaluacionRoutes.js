//routes/evaluacion
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

    if (!pregunta || pregunta.trim() === '') {
      errors.push(`La pregunta en la fila ${index + 2} está vacía`);
    }

    if (!respuesta_correcta || respuesta_correcta.trim() === '') {
      errors.push(`La respuesta correcta en la fila ${index + 2} está vacía`);
    }

    if (!opciones || opciones.length !== 4) {
      errors.push(`Número incorrecto de opciones en la fila ${index + 2} (debe haber 4 opciones)`);
    }

    if (opciones) {
      opciones.forEach((opcion, i) => {
        if (!opcion || opcion.trim() === '') {
          errors.push(`La opción ${String.fromCharCode(97 + i)} en la fila ${index + 2} está vacía`);
        }
      });
    }

    if (new Set(opciones).size !== opciones.length) {
      errors.push(`Opciones duplicadas en la fila ${index + 2}`);
    }

    if (!opciones.includes(respuesta_correcta)) {
      errors.push(`La respuesta correcta en la fila ${index + 2} no coincide con ninguna opción`);
    }
  });

  return errors;
};

const expectedFields = ['pregunta', 'respuesta_correcta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d'];

// Ruta para cargar archivo Excel
router.post('/evaluaciones/upload', upload.single('file'), async (req, res) => {
  try {
    const tema_id = req.body.tema;
    const buffer = req.file.buffer;

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const expectedFields = ['pregunta', 'respuesta_correcta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'imagen'];
    const fileFields = Object.keys(data[0]);
    const missingFields = expectedFields.filter(field => !fileFields.includes(field));
    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'El archivo no cumple con el formato esperado', details: [`Campos faltantes: ${missingFields.join(', ')}`] });
    }

    const nuevasEvaluaciones = data.map(item => ({
      pregunta: item.pregunta ? item.pregunta.toString().trim() : '',
      opciones: [
        item.opcion_a ? item.opcion_a.toString().trim() : '',
        item.opcion_b ? item.opcion_b.toString().trim() : '',
        item.opcion_c ? item.opcion_c.toString().trim() : '',
        item.opcion_d ? item.opcion_d.toString().trim() : ''
      ],
      respuesta_correcta: item.respuesta_correcta ? item.respuesta_correcta.toString().trim() : '',
      imagen: item.imagen ? item.imagen.toString().trim() : null
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
    res.status(400).json({ message: 'Error al procesar el archivo', details: [error.message] });
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

    let nuevasEvaluaciones = req.body.evaluacion ? JSON.parse(req.body.evaluacion) : null;
    if (buffer) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      nuevasEvaluaciones = data.map(item => ({
        pregunta: item.pregunta,
        opciones: [
          item.opcion_a ? item.opcion_a.toString().trim() : '',
          item.opcion_b ? item.opcion_b.toString().trim() : '',
          item.opcion_c ? item.opcion_c.toString().trim() : '',
          item.opcion_d ? item.opcion_d.toString().trim() : ''
        ],
        respuesta_correcta: item.respuesta_correcta ? item.respuesta_correcta.toString().trim() : '',
        imagen: item.imagen ? item.imagen.toString().trim() : null
      }));
    }

    const validationErrors = validateEvaluaciones(nuevasEvaluaciones);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Errores de validación', details: validationErrors });
    }

    await Evaluacion.findByIdAndUpdate(evaluacionId, {
      tema_id: tema_id,
      evaluacion: nuevasEvaluaciones
    });

    res.status(200).json({ message: 'Evaluación actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar la evaluación:', error);
    res.status(500).json({ message: 'Error al actualizar la evaluación', error });
  }
});

// Ruta para descargar la plantilla de cuestionario
router.get('/evaluaciones/plantilla', (req, res) => {
  try {
    const data = [
      { 
        pregunta: 'Ejemplo de pregunta', 
        respuesta_correcta: 'Opción Correcta', 
        opcion_a: 'Opción A', 
        opcion_b: 'Opción B', 
        opcion_c: 'Opción C', 
        opcion_d: 'Opción D' 
      }
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Cuestionario.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar la plantilla:', error);
    res.status(500).json({ message: 'Error al generar la plantilla', error });
  }
});
router.get('/evaluaciones/:temaId', async (req, res) => {
  try {
    const { temaId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;
    const evaluacion = await Evaluacion.findOne({ tema_id: temaId });

    if (!evaluacion) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    // Shuffle the questions and return the limited amount
    const shuffledEvaluacion = evaluacion.evaluacion.sort(() => 0.5 - Math.random()).slice(0, limit);

    res.json({ evaluacion: shuffledEvaluacion });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la evaluación', error });
  }
});
router.get('/evaluaciones/:id/download', async (req, res) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id).populate('tema_id');
    if (!evaluacion) {
      return res.status(404).json({ message: 'Evaluación no encontrada' });
    }

    const workbook = xlsx.utils.book_new();
    const data = evaluacion.evaluacion.map((pregunta, index) => ({
      pregunta: pregunta.pregunta,
      respuesta_correcta: pregunta.respuesta_correcta,
      opcion_a: pregunta.opciones[0],
      opcion_b: pregunta.opciones[1],
      opcion_c: pregunta.opciones[2],
      opcion_d: pregunta.opciones[3],
      imagen: pregunta.imagen || ''
    }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Evaluacion');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename=${evaluacion.tema_id.titulo}_cuestionario.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
    res.status(500).json({ message: 'Error al descargar el archivo', error });
  }
});


module.exports = router;
