// src/controllers/UserController.ts

import { Request, Response } from 'express';
// Importamos todas las funciones del servicio de usuarios (nuestro "peón")
import * as UserService from '../services/UserServices';
// Importamos las interfaces para el usuario (para tipado y validaciones)
import { RegisterUser, LoginUser } from '../models/Users';

// --- Función para registrar un nuevo usuario (POST /api/users/register) ---
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos los datos del cuerpo de la petición.
        const { name, email, password, role } = req.body as RegisterUser;

        // Validaciones básicas:
        if (!name || typeof name !== 'string' || name.trim() === '') {
            res.status(400).json({ message: 'El nombre es requerido y debe ser un texto no vacío.' });
            return;
        }
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ message: 'El email es requerido y debe tener un formato válido.' });
            return;
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            res.status(400).json({ message: 'La contraseña es requerida y debe tener al menos 6 caracteres.' });
            return;
        }
        // Opcional: Validar el rol si se proporciona
        if (role && !['admin', 'seller', 'buyer'].includes(role)) {
            res.status(400).json({ message: 'El rol proporcionado no es válido.' });
            return;
        }

        // Verificar si el email ya está registrado
        const existingUser = await UserService.findUserByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: 'El email ya está registrado.' }); // 409 Conflict
            return;
        }

        // Llamamos al servicio para registrar al usuario.
        const userId = await UserService.registerUser({ name, email, password, role });

        res.status(201).json({ id: userId, message: 'Usuario registrado exitosamente.' }); // 201 Created
        return;
    } catch (error: any) {
        console.error('Error al registrar usuario:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar usuario.' });
        return;
    }
};

// --- Función para loguear un usuario (POST /api/users/login) ---
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos los datos del cuerpo de la petición.
        const { email, password } = req.body as LoginUser;

        // Validaciones básicas:
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ message: 'El email es requerido y debe tener un formato válido.' });
            return;
        }
        if (!password || typeof password !== 'string') {
            res.status(400).json({ message: 'La contraseña es requerida.' });
            return;
        }

        // Llamamos al servicio para intentar loguear al usuario y obtener un token.
        const token = await UserService.loginUser({ email, password });

        if (token) {
            // Si el login fue exitoso, devolvemos el token.
            res.status(200).json({ message: 'Login exitoso.', token });
            return;
        } else {
            // Si el token es null, significa credenciales inválidas.
            res.status(401).json({ message: 'Credenciales inválidas (email o contraseña incorrectos).' }); // 401 Unauthorized
            return;
        }
    } catch (error: any) {
        console.error('Error al iniciar sesión:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
        return;
    }
};
