const express = require('express');
const router = express.Router();
const Curso = require('../models/cursos'); // Reemplaza con la ruta correcta a tu modelo

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
  
  module.exports = router;