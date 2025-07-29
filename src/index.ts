// src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Importamos el paquete cors
import { connectDB } from './config/db'; // Importamos la función connectDB
import propertyRoutes from './routes/Properties'; // <-- CORREGIDO: Vuelve a 'Properties' (mayúscula)
import sellerRoutes from './routes/Sellers';     // <-- CORREGIDO: Vuelve a 'Sellers' (mayúscula)
import userRoutes from './routes/Users';         // <-- CORREGIDO: Vuelve a 'Users' (mayúscula)

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Inicializar la aplicación Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Configuración de CORS
// Esto permite que tu frontend (http://localhost:5173) acceda a tu backend.
app.use(cors({
  origin: 'http://localhost:5173', // Permite solo peticiones desde tu frontend de React
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos (importante para el token JWT)
}));
// Si quieres permitir cualquier origen durante el desarrollo (menos seguro para producción):
// app.use(cors());

// Rutas
app.use('/api/properties', propertyRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/users', userRoutes); // Usar las rutas de usuarios

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Bienes Raíces funcionando!');
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
