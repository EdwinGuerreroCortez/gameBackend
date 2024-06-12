const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage.js');

// Endpoint para obtener todos los mensajes de contacto
router.get('/contact/messages', async (req, res) => {
    try {
        const messages = await ContactMessage.find();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ruta para obtener las preguntas con sus respuestas
router.get('/contact/messages/questions', async (req, res) => {
    try {
      const questions = await ContactMessage.find({ tipoMensaje: 'Pregunta' });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

// Endpoint para crear un nuevo mensaje de contacto
router.post('/contact/messages/faqs', async (req, res) => {
    try {
        const newMessage = new ContactMessage({
            tipoMensaje: req.body.tipoMensaje,
            correo: req.body.correo,
            mensaje: req.body.mensaje,
            respuesta: req.body.respuesta,
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para obtener un mensaje de contacto por ID
router.get('/contact/messages/:id', async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Mensaje no encontrado' });
        }
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para actualizar un mensaje de contacto por ID
router.put('/contact/messages/:id', async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Mensaje no encontrado' });
        }

        Object.assign(message, req.body);
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para eliminar un mensaje de contacto por ID
router.delete('/contact/messages/:id', async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Mensaje no encontrado' });
        }

        await ContactMessage.deleteOne({ _id: req.params.id });
        res.json({ message: 'Mensaje eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para crear una sugerencia
router.post('/contact/messages/suggestions', async (req, res) => {
    try {
        const newSuggestion = new ContactMessage({
            tipoMensaje: 'Sugerencia',
            correo: req.body.correo,
            mensaje: req.body.mensaje,
            respuesta: 'ninguna',
        });
        await newSuggestion.save();
        res.status(201).json(newSuggestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para crear una queja
router.post('/contact/messages/complaints', async (req, res) => {
    try {
        const newComplaint = new ContactMessage({
            tipoMensaje: 'Queja',
            correo: req.body.correo,
            mensaje: req.body.mensaje,
            respuesta: 'ninguna',
        });
        await newComplaint.save();
        res.status(201).json(newComplaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para responder a una pregunta de contacto
router.put('/contact/messages/questions/:id', async (req, res) => {
    try {
        console.log('Datos recibidos para actualizar:', req.body); // Añadido para depuración
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Pregunta no encontrada' });
        }

        if (message.tipoMensaje !== 'Pregunta') {
            return res.status(400).json({ message: 'El mensaje seleccionado no es una pregunta' });
        }

        message.respuesta = req.body.respuesta;
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});



module.exports = router;
