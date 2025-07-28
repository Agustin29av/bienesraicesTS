// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz Request de Express para añadir la propiedad 'user'
// Esto nos permitirá almacenar la información del usuario autenticado en el objeto Request
// para que esté disponible en los controladores posteriores.
declare global {
    namespace Express {
        interface Request {
            user?: { id: number; email: string; role: string }; // Propiedades del payload del JWT
        }
    }
}

// Obtenemos la clave secreta para JWT desde las variables de entorno.
// Es CRUCIAL que esta clave sea la misma que usaste en UserServices.ts
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware de autenticación
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // 1. Obtener el token del encabezado de la autorización.
    // Los tokens JWT suelen enviarse en el formato "Bearer TOKEN_AQUI".
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrae el token después de "Bearer "

    // 2. Verificar si no hay token.
    if (token == null) {
        // Si no se proporciona un token, se devuelve un error 401 (Unauthorized).
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }

    // 3. Verificar el token.
    jwt.verify(token, JWT_SECRET, (err, user) => {
        // Si hay un error en la verificación (token inválido, expirado, etc.).
        if (err) {
            // Se devuelve un error 403 (Forbidden) si el token no es válido.
            return res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
        }

        // Si el token es válido, adjuntamos la información del usuario al objeto Request.
        // Esto permite que los controladores que usan este middleware accedan a los datos del usuario.
        // Hacemos un casting a 'any' temporalmente para evitar problemas con el tipo 'user' de jwt.verify,
        // ya que declaramos 'user' en Request como un tipo específico.
        req.user = user as { id: number; email: string; role: string };
        
        // Continuamos con la siguiente función middleware o el controlador de la ruta.
        next();
    });
};

// Opcional: Middleware para verificar roles (ej. solo admin puede hacer X)
export const authorizeRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Si el usuario no está autenticado (no pasó por authenticateToken),
        // o si no tiene un rol definido, se devuelve 403.
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Acceso denegado. No se pudo verificar el rol del usuario.' });
        }

        // Verificamos si el rol del usuario está incluido en los roles permitidos.
        if (!roles.includes(req.user.role)) {
            // Si el rol no está permitido, se devuelve un error 403 (Forbidden).
            return res.status(403).json({ message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.` });
        }

        // Si el usuario tiene el rol permitido, continuamos.
        next();
    };
};
