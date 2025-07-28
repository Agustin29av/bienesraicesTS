// src/models/User.ts

// Definimos la interfaz para un Usuario.
// Esta interfaz representa la estructura de los datos de un usuario
// tal como se almacenarán en la base de datos y se usarán en la aplicación.
export interface User {
    id?: number; // El ID es opcional porque la base de datos lo genera automáticamente al crear.
    name: string;
    email: string;
    password: string; // Aquí almacenaremos el hash de la contraseña, no la contraseña en texto plano.
    role?: 'admin' | 'seller' | 'buyer'; // El rol es opcional y tiene valores predefinidos.
    created_at?: Date; // Opcional, la base de datos lo maneja automáticamente.
    updated_at?: Date; // Opcional, la base de datos lo maneja automáticamente.
}

// Opcional: Interfaz para los datos de registro (sin ID, created_at, updated_at, y con rol opcional)
export interface RegisterUser {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'seller' | 'buyer';
}

// Opcional: Interfaz para los datos de login (solo email y contraseña)
export interface LoginUser {
    email: string;
    password: string;
}
