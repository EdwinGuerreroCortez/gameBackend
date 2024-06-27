const express = require('express');
const router = express.Router();
const Curso = require('../models/cursos'); // Reemplaza con la ruta correcta a tu modelo
const Tema = require('../models/tema'); // Asegúrate de que la ruta sea correcta

// Endpoint para obtener los temas de un curso específico
router.get('/cursos/:cursoId/temas', async (req, res) => {
  try {
    const cursoId = req.params.cursoId;
    const curso = await Curso.findById(cursoId).populate('temas');

    if (!curso) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const temasHabilitados = curso.temas.filter(tema => tema.habilitado);
    res.json(temasHabilitados);
  } catch (error) {
    console.error('Error al obtener los temas del curso:', error);
    res.status(500).json({ message: 'Error al obtener los temas del curso.' });
  }
});
// Crear un nuevo curso
router.post('/curso', async (req, res) => {
  const { nombre } = req.body;

  try {
    const nuevoCurso = new Curso({
      nombre,
      temas: [] // Puedes dejar temas vacío inicialmente si es necesario
    });

    const savedCurso = await nuevoCurso.save();
    res.status(201).json(savedCurso);
  } catch (error) {
    console.error('Error al guardar el curso:', error);
    res.status(400).json({ message: error.message });
  }
});
// Endpoint para obtener todos los cursos
router.get('/cursos', async (req, res) => {
  try {
    const cursos = await Curso.find();
    res.json(cursos);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    res.status(500).json({ message: 'Error al obtener los cursos.' });
  }
});

module.exports = router;