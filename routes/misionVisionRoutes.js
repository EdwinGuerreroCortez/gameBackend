const express = require('express');
const router = express.Router();
const MisionVision = require('../models/misionVision');

// Obtener todas las misiones y visiones
router.get('/misionVision', async (req, res) => {
  try {
    const items = await MisionVision.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva misión y visión
router.post('/misionVision', async (req, res) => {
  const { mision, vision } = req.body;

  const nuevoItem = new MisionVision({
    mision,
    vision
  });

  try {
    const savedItem = await nuevoItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error al guardar:', error); // Añade esto para capturar errores
    res.status(400).json({ message: error.message });
  }
});

// Obtener una misión y visión por ID
router.get('/misionVision/:id', async (req, res) => {
  try {
    const item = await MisionVision.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Misión y Visión no encontradas' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar una misión y visión por ID
router.put('/misionVision/:id', async (req, res) => {
  const { mision, vision } = req.body;

  try {
    const item = await MisionVision.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Misión y Visión no encontradas' });
    }

    item.mision = mision;
    item.vision = vision;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar una misión y visión por ID
router.delete('/misionVision/:id', async (req, res) => {
  try {
    const item = await MisionVision.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Misión y Visión no encontradas' });
    }
    await MisionVision.deleteOne({ _id: req.params.id });
    res.json({ message: 'Misión y Visión eliminadas con éxito' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
