const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer to store images in the 'creavideojuego/public/imagenes' folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'creavideojuego', 'public', 'imagenes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// File filter to accept only specific image formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Route to upload images
router.post('/upload', upload.array('imagenes', 10), (req, res) => {
  try {
    const fileNames = req.files.map(file => file.filename);
    res.json({ imageNames: fileNames });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir las imágenes', error });
  }
});

module.exports = router;
