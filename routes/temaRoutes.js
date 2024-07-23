const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const XLSX = require('xlsx');
const Tema = require('../models/tema');
const Curso = require('../models/cursos'); // Asegúrate de que la ruta sea correcta
const Evaluacion = require('../models/evaluacion');


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

const validateExcelData = (data) => {
  let errors = [];
  data.forEach((tema, index) => {
    const rowIndex = index + 2; // Índice de fila Excel (1-based)

    if (!tema.titulo.trim()) {
      errors.push(`El campo "título" en la fila ${rowIndex} está vacío.`);
    }
    if (!tema.descripcion.trim()) {
      errors.push(`El campo "descripción" en la fila ${rowIndex} está vacío.`);
    }
    if (!tema.responsable.trim()) {
      errors.push(`El campo "responsable" en la fila ${rowIndex} está vacío.`);
    }
    if (!tema.bibliografia.trim()) {
      errors.push(`El campo "bibliografía" en la fila ${rowIndex} está vacío.`);
    }

    tema.pasos.forEach((paso, pasoIndex) => {
      if (!paso.Titulo.trim()) {
        errors.push(`El Título del paso ${pasoIndex + 1} en la fila ${rowIndex} está vacío.`);
      }
      if (!paso.Descripcion.trim()) {
        errors.push(`La Descripción del paso ${pasoIndex + 1} en la fila ${rowIndex} está vacía.`);
      }
    });

    tema.subtemas.forEach((subtema, subtemaIndex) => {
      if (!subtema.titulo.trim()) {
        errors.push(`El título del subtema ${subtemaIndex + 1} en la fila ${rowIndex} está vacío.`);
      }
      if (!subtema.descripcion.trim()) {
        errors.push(`La descripción del subtema ${subtemaIndex + 1} en la fila ${rowIndex} está vacía.`);
      }
    });
  });

  return errors;
};
// Obtener un tema por ID
router.get('/temas/:id', async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }
    res.json(tema);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Ruta para obtener temas filtrados por curso
router.get('/temas/curso/:cursoId', async (req, res) => {
  try {
    const temas = await Tema.find({ curso: req.params.cursoId });
    res.json(temas);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Eliminar el cuestionario relacionado si existe
    if (tema.evaluacion_id) {
      await Evaluacion.findByIdAndDelete(tema.evaluacion_id);
    }

    // Eliminar la referencia al tema en el curso
    if (tema.curso) {
      await Curso.findByIdAndUpdate(tema.curso, { $pull: { temas: tema._id } });
    }

    await Tema.deleteOne({ _id: req.params.id });
    res.json({ message: 'Tema y cuestionario relacionado eliminados con éxito' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Endpoint for generating and downloading the Excel file based on the selected theme
router.get('/download-tema/:id', async (req, res) => {
  try {
    const tema = await Tema.findById(req.params.id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    // Prepare data for the Excel file
    const worksheetData = [
      {
        titulo: tema.titulo,
        descripcion: tema.descripcion,
        responsable: tema.responsable,
        pasos: tema.pasos[0]?.Titulo || '',
        Descripcion: tema.pasos[0]?.Descripcion || '',
        bibliografia: tema.bibliografia,
        subtema: tema.subtemas[0]?.titulo || '',
        descripcionSubtema: tema.subtemas[0]?.descripcion || ''
      },
      // Add more rows if there are more steps or subtopics
      ...tema.pasos.slice(1).map((paso, index) => ({
        titulo: '',
        descripcion: '',
        responsable: '',
        pasos: paso.Titulo,
        Descripcion: paso.Descripcion,
        bibliografia: '',
        subtema: tema.subtemas[index + 1]?.titulo || '',
        descripcionSubtema: tema.subtemas[index + 1]?.descripcion || ''
      }))
    ];

    // Create a new workbook and add the worksheet data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tema');

    // Send the Excel file to the client
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

// Endpoint para descargar la plantilla
router.get('/download-plantilla', (req, res) => {
  // Crear un nuevo libro de trabajo y una hoja de trabajo con el formato requerido
  const workbook = XLSX.utils.book_new();
  const worksheetData = [
    {
      titulo: 'Ejemplo de Título 1',
      descripcion: 'Descripción del tema 1',
      responsable: 'Responsable del tema 1',
      pasos: 'Título del Paso 1',
      Descripcion: 'Descripción del Paso 1',
      bibliografia: 'Bibliografía del tema 1',
      subtema: 'Título del Subtema 1',
      descripcionSubtema: 'Descripción del Subtema 1',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 2 (Opcional)',
      Descripcion: 'Descripción del Paso 2 (Opcional)',
      bibliografia: '',
      subtema: 'Título del Subtema 2 (Opcional)',
      descripcionSubtema: 'Descripción del Subtema 2 (Opcional)',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 3 (Opcional)',
      Descripcion: 'Descripción del Paso 3 (Opcional)',
      bibliografia: '',
      subtema: 'Título del Subtema 3 (Opcional)',
      descripcionSubtema: 'Descripción del Subtema 3 (Opcional)',
    },
    {
      titulo: 'Ejemplo de Título 2',
      descripcion: 'Descripción del tema 2',
      responsable: 'Responsable del tema 2',
      pasos: 'Título del Paso 1',
      Descripcion: 'Descripción del Paso 1',
      bibliografia: 'Bibliografía del tema 2',
      subtema: 'Título del Subtema 1',
      descripcionSubtema: 'Descripción del Subtema 1',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 2 (Opcional)',
      Descripcion: 'Descripción del Paso 2 (Opcional)',
      bibliografia: '',
      subtema: 'Título del Subtema 2 (Opcional)',
      descripcionSubtema: 'Descripción del Subtema 2 (Opcional)',
    },
    {
      titulo: '',
      descripcion: '',
      responsable: '',
      pasos: 'Título del Paso 3 (Opcional)',
      Descripcion: 'Descripción del Paso 3 (Opcional)',
      bibliografia: '',
      subtema: 'Título del Subtema 3 (Opcional)',
      descripcionSubtema: 'Descripción del Subtema 3 (Opcional)',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Tema');

  // Enviar el archivo Excel al cliente
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_tema.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// Endpoint para subir todos los temas
router.post('/subir-temas', async (req, res) => {
  const { temas, cursoId } = req.body;

  if (!cursoId) {
    return res.status(400).json({ error: 'cursoId es requerido' });
  }

  const validationErrors = validateExcelData(temas);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Errores de validación', details: validationErrors });
  }

  try {
    const savedTemas = await Promise.all(temas.map(async (tema) => {
      const newTema = new Tema({
        titulo: tema.titulo,
        descripcion: tema.descripcion,
        responsable: tema.responsable,
        bibliografia: tema.bibliografia,
        pasos: tema.pasos,
        subtemas: tema.subtemas,
        video: null,
        evaluacion_id: null,
        curso: cursoId
      });

      const savedTema = await newTema.save();

      await Curso.findByIdAndUpdate(cursoId, { $push: { temas: savedTema._id } });

      return savedTema;
    }));

    res.status(200).json(savedTemas);
  } catch (error) {
    console.error('Error guardando los temas:', error);
    res.status(500).json({ error: 'Error guardando los temas: ' + error.message });
  }
});

// Endpoint para subir un tema con video, pasos y subtemas
router.post('/subirTema', upload.single('video'), async (req, res) => {
  try {
    const { titulo, descripcion, responsable, bibliografia, pasos, subtemas, curso } = req.body; // Added `curso` to the request body
    const videoFile = req.file;

    if (!titulo || !descripcion || !responsable || !bibliografia || !curso) { // Ensure `curso` is provided
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const parsedPasos = JSON.parse(pasos);
    const parsedSubtemas = subtemas ? JSON.parse(subtemas) : [];

    if (parsedPasos.length === 0) {
      return res.status(400).json({ error: 'Debe haber al menos un paso definido.' });
    }

    for (const paso of parsedPasos) {
      if (!paso.Titulo || !paso.Descripcion) {
        return res.status(400).json({ error: 'Cada paso debe tener un título y una descripción.' });
      }
    }

    for (const subtema of parsedSubtemas) {
      if (!subtema.Titulo || !subtema.Descripcion) {
        return res.status(400).json({ error: 'Cada subtema debe tener un título y una descripción.' });
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

    let videoUrl = null;
    if (videoFile) {
      videoUrl = await uploadVideo();
    }

    const newTema = new Tema({
      titulo,
      descripcion,
      responsable,
      bibliografia,
      pasos: parsedPasos,
      subtemas: parsedSubtemas.map(subtema => ({
        titulo: subtema.Titulo,
        descripcion: subtema.Descripcion,
        video: subtema.Link || null
      })), // Procesar los subtemas para asegurarse de que se guarden correctamente
      video: videoUrl,
      evaluacion_id: null,
      fecha_creacion: new Date(),
      curso // Store the course ID in the new topic
    });

    const savedTema = await newTema.save();

    // Update the course to include the new topic's ObjectId
    await Curso.findByIdAndUpdate(curso, { $push: { temas: savedTema._id } });

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
// Endpoint para subir un video o link de video para un subtema
router.post('/upload-subtema-video/:id/:subtemaId', upload.single('video'), async (req, res) => {
  try {
    const { id, subtemaId } = req.params;
    const videoFile = req.file;
    const { videoLink } = req.body;

    if (!videoFile && !videoLink) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún video ni link.' });
    }

    const tema = await Tema.findById(id);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    const subtema = tema.subtemas.id(subtemaId);
    if (!subtema) {
      return res.status(404).json({ message: 'Subtema no encontrado' });
    }

    if (videoFile) {
      const uploadVideo = () => {
        return new Promise((resolve, reject) => {
          const cld_upload_stream = cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: 'subtema_videos' },
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
      subtema.video = videoUrl;
    } else if (videoLink) {
      subtema.video = videoLink;
    }

    await tema.save();

    res.status(200).json({ videoUrl: subtema.video });
  } catch (error) {
    console.error('Error subiendo el video o guardando el link:', error);
    res.status(500).json({ error: 'Error subiendo el video o guardando el link. Inténtalo de nuevo.' });
  }
});



// Endpoint for uploading a video link for a general video
router.post('/upload-video-link/:id', async (req, res) => {
  try {
    const temaId = req.params.id;
    const { videoLink } = req.body;

    if (!videoLink) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún link.' });
    }

    const tema = await Tema.findById(temaId);
    if (!tema) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    tema.video = videoLink;
    await tema.save();

    res.status(200).json({ videoUrl: tema.video });
  } catch (error) {
    console.error('Error guardando el link de video:', error);
    res.status(500).json({ error: 'Error guardando el link de video. Inténtalo de nuevo.' });
  }
});


module.exports = router;
