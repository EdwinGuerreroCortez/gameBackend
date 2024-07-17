const express = require('express');
const router = express.Router();
const Examen = require('../models/examen');
const Usuario = require('../models/usuario');
const Curso = require('../models/cursos');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Ruta para guardar resultados de exámenes
router.post('/examenes', async (req, res) => {
  try {
    const { usuarioId, temaId, porcentaje, preguntasRespondidas, fecha } = req.body;

    let examenExistente = await Examen.findOne({ usuarioId, temaId });

    if (examenExistente) {
      examenExistente.intentos += 1;
      examenExistente.preguntasRespondidas.push({
        intento: examenExistente.intentos,
        fecha,
        respuestas: preguntasRespondidas,
        porcentaje
      });
      examenExistente.examenPermitido = false; // Establecer examenPermitido a false
    } else {
      examenExistente = new Examen({
        usuarioId,
        temaId,
        intentos: 1,
        examenPermitido: false, // Establecer examenPermitido a false
        preguntasRespondidas: [{
          intento: 1,
          fecha,
          respuestas: preguntasRespondidas,
          porcentaje
        }]
      });
    }

    await examenExistente.save();
    res.status(200).json({ message: 'Examen guardado exitosamente', examen: examenExistente });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Ruta para obtener todos los exámenes con el título del tema y la matrícula del usuario
router.get('/examenes', async (req, res) => {
  try {
    const examenes = await Examen.find()
      .populate('usuarioId', 'matricula datos_personales')
      .populate({
        path: 'temaId',
        select: 'titulo curso',
        populate: {
          path: 'curso',
          select: 'nombre'
        }
      });

    const examenesConCurso = examenes.map(examen => {
      const sortedPreguntasRespondidas = examen.preguntasRespondidas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const fechaUltimoIntento = sortedPreguntasRespondidas[0]?.fecha;

      return {
        _id: examen._id,
        usuarioId: examen.usuarioId ? examen.usuarioId : null,
        temaId: examen.temaId ? examen.temaId._id : null,
        tituloTema: examen.temaId ? examen.temaId.titulo : 'Tema no disponible',
        nombreCurso: examen.temaId && examen.temaId.curso ? examen.temaId.curso.nombre : 'Curso no disponible',
        intentos: examen.intentos,
        preguntasRespondidas: examen.preguntasRespondidas,
        examenPermitido: examen.examenPermitido,
        fechaUltimoIntento,
        nombreCompleto: examen.usuarioId && examen.usuarioId.datos_personales 
          ? `${examen.usuarioId.datos_personales.nombre} ${examen.usuarioId.datos_personales.apellido_paterno} ${examen.usuarioId.datos_personales.apellido_materno}` 
          : 'Nombre no disponible'
      };
    });

    res.status(200).json(examenesConCurso);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/examenes/:usuarioId/:temaId', async (req, res) => {
  try {
    const { usuarioId, temaId } = req.params;
    const examen = await Examen.findOne({ usuarioId, temaId });

    if (examen) {
      res.status(200).json(examen);
    } else {
      res.status(404).json({ message: 'Examen no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para obtener el último examen realizado por un usuario para un tema específico
router.get('/examenes/:userId/:temaId/ultimo', async (req, res) => {
  const { userId, temaId } = req.params;

  try {
    // Encontrar el examen realizado por el usuario para el tema específico
    const examen = await Examen.findOne({ usuarioId: userId, temaId: temaId });

    if (!examen) {
      return res.status(404).json({ message: 'No se encontró ningún examen para este usuario y tema' });
    }

    // Ordenar el arreglo de preguntasRespondidas para obtener el último intento
    examen.preguntasRespondidas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Devolver el examen con las respuestas más recientes al inicio
    res.json(examen);
  } catch (error) {
    console.error('Error al obtener el último examen:', error);
    res.status(500).json({ message: 'Error al obtener el último examen.', error: error.message });
  }
});

// Nueva ruta para cambiar el estado de examenPermitido
router.put('/examenes/:id/toggle', async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id);
    if (!examen) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }

    examen.examenPermitido = !examen.examenPermitido;
    await examen.save();

    res.status(200).json({ message: 'Estado de examen permitido actualizado', examen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  
});


// Nueva ruta para obtener un examen específico por id
router.get('/examenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let examen = await Examen.findById(id)
      .populate('usuarioId', 'matricula datos_personales')
      .populate({
        path: 'temaId',
        select: 'titulo curso',
        populate: {
          path: 'curso',
          select: 'nombre'
        }
      });

    if (examen) {
      const examenConCurso = {
        _id: examen._id,
        usuarioId: examen.usuarioId,
        temaId: examen.temaId._id,
        tituloTema: examen.temaId.titulo, // Ensure this line is correct
        nombreCurso: examen.temaId.curso ? examen.temaId.curso.nombre : 'Sin curso',
        intentos: examen.intentos,
        preguntasRespondidas: examen.preguntasRespondidas,
        examenPermitido: examen.examenPermitido,
        fechaUltimoIntento: examen.preguntasRespondidas.length > 0 ? examen.preguntasRespondidas[examen.preguntasRespondidas.length - 1].fecha : null,
        nombreCompleto: `${examen.usuarioId.datos_personales.nombre} ${examen.usuarioId.datos_personales.apellido_paterno} ${examen.usuarioId.datos_personales.apellido_materno}`
      };

      res.status(200).json(examenConCurso);
    } else {
      res.status(404).json({ message: 'Examen no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/concentrado/:curso', async (req, res) => {
  const { curso } = req.params;

  try {
    const examenes = await Examen.find()
      .populate('usuarioId', 'matricula datos_personales')
      .populate({
        path: 'temaId',
        select: 'titulo curso',
        populate: {
          path: 'curso',
          select: 'nombre'
        }
      });

    const examenesFiltrados = examenes.filter(examen => examen.temaId.curso && examen.temaId.curso.nombre === curso);

    if (examenesFiltrados.length === 0) {
      return res.status(404).json({ message: 'No se encontraron exámenes para el curso seleccionado' });
    }

    const concentrado = examenesFiltrados.reduce((acc, examen) => {
      const matricula = examen.usuarioId.datos_personales.matricula;
      const nombreCompleto = `${examen.usuarioId.datos_personales.nombre} ${examen.usuarioId.datos_personales.apellido_paterno} ${examen.usuarioId.datos_personales.apellido_materno}`;
      if (!acc[matricula]) {
        acc[matricula] = { matricula, nombreCompleto, calificaciones: [] };
      }
      acc[matricula].calificaciones.push(examen.preguntasRespondidas[examen.preguntasRespondidas.length - 1].porcentaje);
      return acc;
    }, {});

    const maxEval = Math.max(...Object.values(concentrado).map(item => item.calificaciones.length));

    const concentradoCompleto = Object.values(concentrado).map(item => {
      const calificacionesCompletas = [...item.calificaciones, ...Array(maxEval - item.calificaciones.length).fill(0)];
      const promedio = calificacionesCompletas.reduce((acc, cal) => acc + cal, 0) / maxEval;
      return {
        Matrícula: item.matricula,
        'Nombre Completo': item.nombreCompleto,
        ...calificacionesCompletas.reduce((acc, cal, i) => ({ ...acc, [`Evaluación ${i + 1}`]: cal }), {}),
        Promedio: promedio.toFixed(2)
      };
    });

    const ws = XLSX.utils.json_to_sheet(concentradoCompleto);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Concentrado');

    const cursoNombre = curso;
    XLSX.utils.sheet_add_aoa(ws, [[`Concentrado de calificaciones de ${cursoNombre}`]], { origin: 'A1' });

    const filePath = path.join(__dirname, `../../concentrado_${cursoNombre}.xlsx`);
    XLSX.writeFile(wb, filePath);

    res.download(filePath, `Concentrado_${cursoNombre}.xlsx`, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error al eliminar el archivo:', err);
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





module.exports = router;

