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

        res.json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;
