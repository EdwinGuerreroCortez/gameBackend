const express = require('express');
const router = express.Router();
const Faq = require('../models/faq');

// Endpoint para obtener todas las FAQs
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await Faq.find();
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para crear una nueva FAQ
router.post('/faqs', async (req, res) => {
  try {
    const nuevaFaq = new Faq(req.body);
    await nuevaFaq.save();
    res.status(201).json(nuevaFaq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Endpoint para obtener una FAQ por ID
router.get('/faqs/:id', async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ no encontrada' });
    }
    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para actualizar una FAQ por ID
router.put('/faqs/:id', async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ no encontrada' });
    }
    
    Object.assign(faq, req.body);
    await faq.save();
    res.json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Endpoint para eliminar una FAQ por ID
router.delete('/faqs/:id', async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ no encontrada' });
    }
    
    await Faq.deleteOne({ _id: req.params.id });
    res.json({ message: 'FAQ eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
