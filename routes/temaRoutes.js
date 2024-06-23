const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const XLSX = require('xlsx');
const Tema = require('../models/tema');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanColumnNames = (data) => {
  const cleanedData = {};
  for (const key in data) {
    const cleanKey = key.trim();
    cleanedData[cleanKey] = data[key];
  }
  return cleanedData;
};

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
router.post('/upload-excel-video', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
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

    let temas = [];
    let currentTema = null;

    json.forEach((row) => {
      row = cleanColumnNames(row);

      if (row['titulo']) {
        if (currentTema) {
          temas.push(currentTema);
        }
        currentTema = {
          titulo: row['titulo'],
          descripcion: row['descripcion'],
          responsable: row['responsable'],
          bibliografia: row['bibliografia'],
          pasos: [],
        };
      }

      if (currentTema) {
        currentTema.pasos.push({ Titulo: row['pasoTitulo'], Descripcion: row['pasoDescripcion'] });
      }
    });

    if (currentTema) {
      temas.push(currentTema);
    }

    const validationErrors = temas.map((tema) =>
      validateExcelData(tema, ['titulo', 'descripcion', 'responsable', 'bibliografia'])
    ).flat();

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Errores de validación en el archivo Excel.', details: validationErrors });
    }

    const uploadVideo = (tema) => {
      return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'videos' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        streamifier.createReadStream(videoFile.buffer).pipe(cld_upload_stream);
      });
    };

    const saveTema = async (tema) => {
      try {
        const videoUrl = await uploadVideo(tema);
        const newTema = new Tema({ ...tema, video: videoUrl, evaluacion_id: null });
        return await newTema.save();
      } catch (error) {
        throw new Error(`Error guardando el tema: ${error.message}`);
      }
    };

    Promise.all(temas.map(saveTema))
      .then((savedTemas) => {
        res.status(200).json(savedTemas);
      })
      .catch((error) => {
        console.error('Error guardando los temas:', error);
        res.status(500).json({ error: 'Error guardando los temas: ' + error.message });
      });
  } catch (error) {
    console.error('Error procesando los archivos:', error);
    res.status(500).json({ error: 'Error procesando los archivos: ' + error });
  }
});

// Endpoint para subir un video para un tema
router.post('/upload-video/:id', upload.single('video'), async (req, res) => {
  try {
    const temaId = req.params.id;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún video.' });
    }

    const tema = await Tema.findById(temaId);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    const uploadVideo = () => {
      return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'videos' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        streamifier.createReadStream(videoFile.buffer).pipe(cld_upload_stream);
      });
    };

    const videoUrl = await uploadVideo();
    tema.video = videoUrl;
    await tema.save();

    res.status(200).json({ videoUrl });
  } catch (error) {
    console.error('Error subiendo el video:', error);
    res.status(500).json({ error: 'Error subiendo el video. Inténtalo de nuevo.' });
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
      { titulo: tema.titulo, descripcion: tema.descripcion, responsable: tema.responsable, bibliografia: tema.bibliografia }
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

// Endpoint para actualizar un tema con validación
router.put('/temas/:id', upload.none(), async (req, res) => {
  try {
    const { titulo, descripcion, responsable, bibliografia, pasos } = req.body;
    const requiredFields = { titulo, descripcion, responsable, bibliografia };
    const errors = [];

    Object.keys(requiredFields).forEach(field => {
      if (!requiredFields[field] || requiredFields[field].trim() === '') {
        errors.push(`El campo "${field}" es obligatorio y no puede estar vacío.`);
      }
    });

    const parsedPasos = JSON.parse(pasos);
    if (parsedPasos.length === 0) {
      errors.push('Debe haber al menos un paso definido.');
    }

    parsedPasos.forEach((paso, index) => {
      if (!paso.Titulo || paso.Titulo.trim() === '') {
        errors.push(`El Título del paso ${index + 1} es obligatorio y no puede estar vacío.`);
      }
      if (!paso.Descripcion || paso.Descripcion.trim() === '') {
        errors.push(`La Descripción del paso ${index + 1} es obligatoria y no puede estar vacía.`);
      }
    });

    if (errors.length > 0) {
      console.log('Validation Errors:', errors);
      return res.status(400).json({ error: 'Errores de validación', details: errors });
    }

    const tema = await Tema.findById(req.params.id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    tema.titulo = titulo;
    tema.descripcion = descripcion;
    tema.responsable = responsable;
    tema.bibliografia = bibliografia;
    tema.pasos = parsedPasos;

    const updatedTema = await tema.save();
    res.json(updatedTema);
  } catch (error) {
    console.error('Error actualizando el tema:', error);
    res.status(500).json({ message: 'Error actualizando el tema', details: error.message });
  }
});

// Endpoint for downloading the template
router.get('/download-plantilla', (req, res) => {
  // Create a new workbook and worksheet with the exact structure of the provided Excel file
  const workbook = XLSX.utils.book_new();
  const worksheetData = [
    {
      titulo: 'Ejemplo de Título 1',
      descripcion: 'Descripción del tema 1',
      responsable: 'Responsable del tema 1',
      pasos: 'Título del Paso 1',
      Descripcion: 'Descripción del Paso 1',
      bibliografia: 'Bibliografía del tema 1',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 2 (Opcional)',
      Descripcion: 'Descripción del Paso 2 (Opcional)',
      bibliografia: '',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 3 (Opcional)',
      Descripcion: 'Descripción del Paso 3 (Opcional)',
      bibliografia: '',
    },
    {
      titulo: 'Ejemplo de Título 2',
      descripcion: 'Descripción del tema 2',
      responsable: 'Responsable del tema 2',
      pasos: 'Título del Paso 1',
      Descripcion: 'Descripción del Paso 1',
      bibliografia: 'Bibliografía del tema 2',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 2 (Opcional)',
      Descripcion: 'Descripción del Paso 2 (Opcional)',
      bibliografia: '',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 3 (Opcional)',
      Descripcion: 'Descripción del Paso 3 (Opcional)',
      bibliografia: '',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Tema');

  // Send the Excel file to the client
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_tema.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});
// Endpoint para subir todos los temas
router.post('/subir-temas', async (req, res) => {
  const { temas } = req.body;

  try {
    const savedTemas = await Promise.all(temas.map(async (tema) => {
      const newTema = new Tema({
        titulo: tema.titulo,
        descripcion: tema.descripcion,
        responsable: tema.responsable,
        bibliografia: tema.bibliografia,
        pasos: tema.pasos,
        video: null,
        evaluacion_id: null,
      });
      return await newTema.save();
    }));

    res.status(200).json(savedTemas);
  } catch (error) {
    console.error('Error guardando los temas:', error);
    res.status(500).json({ error: 'Error guardando los temas: ' + error.message });
  }
});
// Endpoint para subir un tema con video y pasos
router.post('/subirTema', upload.single('video'), async (req, res) => {
  try {
    const { titulo, descripcion, responsable, bibliografia, pasos } = req.body;
    const videoFile = req.file;

    if (!titulo || !descripcion || !responsable || !bibliografia) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const parsedPasos = JSON.parse(pasos);
    if (parsedPasos.length === 0) {
      return res.status(400).json({ error: 'Debe haber al menos un paso definido.' });
    }

    for (const paso of parsedPasos) {
      if (!paso.Titulo || !paso.Descripcion) {
        return res.status(400).json({ error: 'Cada paso debe tener un título y una descripción.' });
      }
    }

    const uploadVideo = () => {
      return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'videos' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        streamifier.createReadStream(videoFile.buffer).pipe(cld_upload_stream);
      });
    };

    const videoUrl = await uploadVideo();
    const newTema = new Tema({
      titulo,
      descripcion,
      responsable,
      bibliografia,
      pasos: parsedPasos,
      video: videoUrl,
      evaluacion_id: null,
      fecha_creacion: new Date(),
    });

    const savedTema = await newTema.save();
    res.status(200).json(savedTema);
  } catch (error) {
    console.error('Error creando el tema:', error);
    res.status(500).json({ error: 'Error creando el tema. Inténtalo de nuevo.' });
  }
});
// Endpoint para habilitar o deshabilitar un tema
router.put('/temas/:id/habilitar', async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    tema.habilitado = !tema.habilitado;
    await tema.save();

    res.json(tema);
  } catch (error) {
    console.error('Error actualizando el estado de habilitación del tema:', error);
    res.status(500).json({ error: 'Error actualizando el estado de habilitación del tema.' });
  }
});

module.exports = router;
