//usuarioRoutes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');

// Endpoint para obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para crear un nuevo usuario
router.post('/usuarios', async (req, res) => {
    try {
        // Cifrar el password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Crear el nuevo usuario con el password cifrado
        const nuevoUsuario = new Usuario({
            ...req.body,
            password: hashedPassword
        });

        await nuevoUsuario.save();
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ "datos_personales.correo": email });

        if (!usuario) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        // Devolver solo el ID del usuario
        res.json({ message: 'Inicio de sesión exitoso', userId: usuario._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Endpoint para obtener un usuario por ID
router.get('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Endpoint para actualizar un usuario por ID
router.put('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const updates = req.body;
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        Object.assign(usuario, updates);
        await usuario.save();

        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Endpoint para actualizar la imagen de perfil
router.put('/usuarios/:id/imagen', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        usuario.imagenPerfil = req.body.imagenPerfil;
        await usuario.save();

        res.json(usuario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
