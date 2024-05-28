const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Tema = require('../models/tema');
const router = express.Router();

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Función para limpiar los nombres de las columnas
const cleanColumnNames = (data) => {
  const cleanedData = {};
  for (const key in data) {
    const cleanKey = key.trim();
    cleanedData[cleanKey] = data[key];
  }
  return cleanedData;
};

// Endpoint para subir un archivo Excel y procesarlo
router.post('/upload-excel', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (json.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel está vacío o tiene un formato incorrecto' });
    }

    let data = json[0];
    data = cleanColumnNames(data);
    console.log('Datos procesados del Excel:', data);

    const pasos = [];
    let i = 1;
    while (data[`pasoTitulo${i}`] && data[`pasoDescripcion${i}`]) {
      pasos.push({ Titulo: data[`pasoTitulo${i}`].trim(), Descripcion: data[`pasoDescripcion${i}`].trim() });
      i++;
    }

    console.log('Pasos extraídos:', pasos);

    const tema = new Tema({
      titulo: data.titulo,
      descripcion: data.descripcion,
      autor: data.autor,
      pasos: pasos,
    });

    tema.save()
      .then((savedTema) => {
        console.log('Tema guardado:', savedTema);
        res.status(200).json(savedTema);
      })
      .catch((error) => {
        console.error('Error guardando el tema:', error);
        res.status(500).json({ error: 'Error subiendo datos: ' + error });
      });
  } catch (error) {
    console.error('Error procesando el archivo:', error);
    res.status(500).json({ error: 'Error procesando el archivo: ' + error });
  }
});

// Endpoint para obtener todos los temas
router.get('/temas', async (req, res) => {
  try {
    const temas = await Tema.find();
    res.json(temas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Endpoint para eliminar un tema por ID
router.delete('/temas/:id', async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    await Tema.deleteOne({ _id: req.params.id });
    res.json({ message: 'Tema eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
