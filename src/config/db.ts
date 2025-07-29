// src/config/db.ts

import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno para la conexión a la base de datos
dotenv.config();

// Crear un pool de conexiones a la base de datos MySQL
// Un pool es más eficiente que abrir y cerrar una conexión para cada consulta.
export const db = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost', // Dirección del host de la DB (por defecto localhost)
    user: process.env.DB_USER || 'root',     // Usuario de la DB (por defecto root)
    password: process.env.DB_PASSWORD || '', // Contraseña de la DB (vacía por defecto)
    database: process.env.DB_NAME || 'bienes_raices_db', // Nombre de la base de datos
    waitForConnections: true, // Esperar si no hay conexiones disponibles en el pool
    connectionLimit: 10,      // Número máximo de conexiones en el pool
    queueLimit: 0             // Número máximo de solicitudes en cola
});

// Función para probar la conexión a la base de datos
// Esta función se exporta para que pueda ser llamada en index.ts
export const connectDB = async () => { // <-- NUEVO: Función exportada
    try {
        // Intentar obtener una conexión del pool para verificar que la conexión es exitosa
        await db.getConnection();
        console.log('Database connected successfully!');
    } catch (error) {
        console.error('Database connection failed:', error);
        // Si la conexión falla, terminamos el proceso de la aplicación
        process.exit(1);
    }
};
