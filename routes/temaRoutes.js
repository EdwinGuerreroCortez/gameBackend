// routes/temaRoutes.js
const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Tema = require('../models/tema');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const router = express.Router();

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configurar las credenciales de Cloudinary usando variables de entorno
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para limpiar los nombres de las columnas
const cleanColumnNames = (data) => {
  const cleanedData = {};
  for (const key in data) {
    const cleanKey = key.trim();
    cleanedData[cleanKey] = data[key];
  }
  return cleanedData;
};

// Función para validar los datos del Excel
const validateExcelData = (data, requiredColumns) => {
  let errors = [];

  requiredColumns.forEach(column => {
    if (!data.hasOwnProperty(column) || !data[column].trim()) {
      errors.push(`El campo "${column}" es obligatorio y no puede estar vacío.`);
    }
  });

  return errors;
};

// Endpoint para subir un archivo Excel y un video, y procesarlos
router.post('/upload-excel-video', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  try {
    if (!req.files || !req.files['file'] || !req.files['video']) {
      return res.status(400).json({ error: 'Archivo Excel y/o video no proporcionados.' });
    }

    const file = req.files['file'][0];
    const videoFile = req.files['video'][0];

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (json.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel está vacío o tiene un formato incorrecto.' });
    }

    let data = json[0];
    data = cleanColumnNames(data);
    console.log('Datos procesados del Excel:', data);

    // Columnas requeridas en el formato correcto
    const requiredColumns = ['titulo', 'descripcion', 'autor', 'pasoTitulo1', 'pasoDescripcion1'];

    // Validar los datos del Excel
    const validationErrors = validateExcelData(data, requiredColumns);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Errores de validación en el archivo Excel.', details: validationErrors });
    }

    const pasos = [];
    let i = 1;
    while (data[`pasoTitulo${i}`] && data[`pasoDescripcion${i}`]) {
      pasos.push({ Titulo: data[`pasoTitulo${i}`].trim(), Descripcion: data[`pasoDescripcion${i}`].trim() });
      i++;
    }

    console.log('Pasos extraídos:', pasos);

    // Crear un stream de carga para Cloudinary para el video
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'videos' },
      (error, result) => {
        if (error) {
          console.error('Error al subir el video:', error);
          return res.status(500).json({ error: error.message });
        }

        // Crear y guardar el nuevo tema con la URL del video
        const tema = new Tema({
          titulo: data.titulo,
          descripcion: data.descripcion,
          autor: data.autor,
          pasos: pasos,
          video: result.secure_url,
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
      }
    );

    // Conectar el buffer del archivo de video a un stream de lectura para enviarlo a Cloudinary
    streamifier.createReadStream(videoFile.buffer).pipe(cld_upload_stream);
  } catch (error) {
    console.error('Error procesando los archivos:', error);
    res.status(500).json({ error: 'Error procesando los archivos: ' + error });
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
// Endpoint para generar y descargar el archivo Excel basado en el tema seleccionado
router.get('/download-tema/:id', async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    // Crear un nuevo libro de trabajo y una hoja de trabajo
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      { titulo: tema.titulo, descripcion: tema.descripcion, autor: tema.autor }
    ];

    tema.pasos.forEach((paso, index) => {
      worksheetData[0][`pasoTitulo${index + 1}`] = paso.Titulo;
      worksheetData[0][`pasoDescripcion${index + 1}`] = paso.Descripcion;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tema');

    // Enviar el archivo Excel al cliente
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', `attachment; filename=${tema.titulo}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generando el archivo Excel:', error);
    res.status(500).json({ error: 'Error generando el archivo Excel' });
  }
});

module.exports = router;
