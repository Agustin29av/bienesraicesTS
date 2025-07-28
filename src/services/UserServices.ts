// src/services/UserServices.ts

// Importamos los tipos necesarios de 'mysql2/promise' para manejar los resultados de las consultas a la DB.
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
// Importamos la conexión a la base de datos.
import { db } from "../config/db";
// Importamos las interfaces para el usuario.
import { User, RegisterUser, LoginUser } from '../models/Users';
// Importamos bcryptjs para el hashing de contraseñas.
import bcrypt from 'bcryptjs';
// Importamos jsonwebtoken para la creación y verificación de JWTs.
import jwt from 'jsonwebtoken';

// Obtenemos la clave secreta para JWT desde las variables de entorno.
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// --- Función para registrar un nuevo usuario ---
// Hashea la contraseña y guarda el usuario en la base de datos.
export const registerUser = async (userData: RegisterUser): Promise<number> => { // <-- Asegúrate de que tenga 'export'
    const { name, email, password, role } = userData;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query<ResultSetHeader>(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role || 'buyer']
    );

    return result.insertId;
};

// --- Función para loguear un usuario ---
// Verifica las credenciales y, si son correctas, genera un JWT.
export const loginUser = async (loginData: LoginUser): Promise<string | null> => { // <-- Asegúrate de que tenga 'export'
    const { email, password } = loginData;

    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0] as User;

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return null;
    }

    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    return token;
};

// --- Función para encontrar un usuario por email (útil para validaciones) ---
export const findUserByEmail = async (email: string): Promise<User | undefined> => { // <-- Asegúrate de que tenga 'export'
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    return (rows[0] as User) || undefined;
};

// --- Función para obtener un usuario por ID (sin contraseña) ---
export const getUserById = async (id: number): Promise<Omit<User, 'password'> | undefined> => { // <-- Asegúrate de que tenga 'export'
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [id]);
    return (rows[0] as Omit<User, 'password'>) || undefined;
};
