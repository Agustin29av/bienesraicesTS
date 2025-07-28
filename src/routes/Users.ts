// src/routes/users.ts

import { Router } from 'express';
// Importamos a nuestro "capataz" de usuarios (el controlador)
import * as UserController from '../controllers/UserController';

// Creamos un nuevo "router" de Express para las rutas de usuarios.
const router = Router();

// --- Definición de Rutas para Usuarios ---

// POST /api/users/register
// Ruta para el registro de nuevos usuarios.
// Cuando alguien hace una petición POST a esta ruta, se llama a la función 'register' del controlador.
router.post('/register', UserController.register);

// POST /api/users/login
// Ruta para el inicio de sesión de usuarios existentes.
// Cuando alguien hace una petición POST a esta ruta, se llama a la función 'login' del controlador.
router.post('/login', UserController.login);

// Exportamos este router para que pueda ser "montado" en el archivo principal 'index.ts'.
export default router;
