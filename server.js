require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/usuarioRoutes');
const imagenesRouter = require('./routes/crudImagenes');
const imagenesRouterReact = require('./routes/imagenRoutes');
const contactRoutes = require('./routes/contact');
const misionVisionRoutes = require('./routes/misionVisionRoutes'); 
const temaRoutes = require('./routes/temaRoutes');
const evaluacionRoutes = require('./routes/evaluacionRoutes');
const examenRoutes = require('./routes/examenRoutes');
const cursosRoutes = require('./routes/cursosRoutes');

const app = express(); 
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a la base de datos MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Rutas
app.use('/api/', userRoutes);
app.use('/api/imagenes', imagenesRouter);
app.use('/api/imagenesReact', imagenesRouterReact);
app.use('/api', contactRoutes);
app.use('/api', misionVisionRoutes);
app.use('/api', temaRoutes);
app.use('/api', evaluacionRoutes);
app.use('/api', examenRoutes);
app.use('/api', cursosRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
