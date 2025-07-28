// src/index.ts

import express from 'express';
import dotenv from 'dotenv';
// Importamos la conexión a la base de datos. Al importarlo, se ejecuta el código de conexión.
import './config/db'; // Asumo que tu archivo de conexión a la DB está en 'src/config/db.ts'

// Importamos los routers (nuestros "sub-mapas de caminos") para cada módulo.
import sellersRoutes from './routes/Sellers';     // Rutas para vendedores
import propertiesRoutes from './routes/Properties'; // Rutas para propiedades
import usersRoutes from './routes/Users';         // <-- NUEVO: Importamos las rutas de usuarios

// Carga las variables de entorno desde el archivo .env
// Esto debe hacerse al principio para que las variables estén disponibles en toda la aplicación.
dotenv.config();

const app = express(); // Creamos la instancia de nuestra aplicación Express
const PORT = process.env.PORT || 3000; // Definimos el puerto donde escuchará el servidor (desde .env o 3000 por defecto)

// Middleware para parsear el cuerpo de las solicitudes como JSON.
// Esto es crucial para que la API pueda leer los datos enviados en peticiones POST/PUT.
app.use(express.json());

// Middleware para servir archivos estáticos desde la carpeta 'public'.
// Si tienes un frontend simple (HTML, CSS, JS) en una carpeta 'public',
// esta línea permite que el servidor los sirva directamente.
// app.use(express.static('public')); // Descomentar si tienes una carpeta 'public' con frontend

// Montamos los routers en sus respectivas rutas base de la API.
// Esto le dice a Express que todas las peticiones que empiecen con '/api/sellers'
// deben ser manejadas por 'sellersRoutes', y lo mismo para 'properties'.
app.use('/api/sellers', sellersRoutes);
app.use('/api/properties', propertiesRoutes);

// <-- NUEVO: Montar las rutas de usuarios bajo el prefijo /api/users
app.use('/api/users', usersRoutes);

// Ruta de prueba simple para verificar que el servidor está funcionando.
// Cuando accedes a la raíz del servidor (ej. http://localhost:3000/),
// te devolverá este mensaje.
app.get('/', (_req, res) => {
    res.send('API Bienes Raices funcionando');
});

// Inicia el servidor Express para que empiece a escuchar peticiones en el puerto definido.
app.listen(PORT, () => {
    // Imprime un mensaje en la consola cuando el servidor se ha iniciado correctamente.
    // Se corrigió la interpolación de la variable PORT para que se muestre correctamente.
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
