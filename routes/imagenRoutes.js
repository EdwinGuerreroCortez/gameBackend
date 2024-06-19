const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para almacenar las imágenes en la carpeta 'creavideojuego/src/imagenes'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'creavideojuego', 'src', 'imagenes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ruta para subir imágenes
router.post('/upload', upload.array('imagenes', 10), (req, res) => {
  try {
    const fileNames = req.files.map(file => file.filename);
    res.json({ imageNames: fileNames });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir las imágenes', error });
  }
});

module.exports = router;
