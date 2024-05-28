require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/usuarioRoutes');
const imagenesRouter = require('./routes/crudImagenes');
const faqRoutes = require('./routes/faqRoutes');
const misionVisionRoutes = require('./routes/misionVisionRoutes'); 
const temaRoutes = require('./routes/temaRoutes'); // Importar rutas de temas
const evaluacionRoutes = require('./routes/evaluacionRoutes'); // Importar rutas de evaluaciones

const app = express(); 
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a la base de datos MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Rutas
app.use('/api/', userRoutes);
app.use('/api/imagenes', imagenesRouter);
app.use('/api', faqRoutes);
app.use('/api', misionVisionRoutes);
app.use('/api', temaRoutes); // Usar rutas de temas
app.use('/api', evaluacionRoutes); // Usar rutas de evaluaciones

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
