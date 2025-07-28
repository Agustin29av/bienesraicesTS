// src/services/PropertyServices.ts

// Importamos los tipos necesarios de 'mysql2/promise' para manejar los resultados de las consultas a la DB.
// ResultSetHeader: Para operaciones que modifican la DB (INSERT, UPDATE, DELETE) y nos dan info como el ID insertado o filas afectadas.
// RowDataPacket: Para operaciones SELECT que devuelven filas de datos.
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
// Importamos la conexión a la base de datos (nuestra "piscina de conexiones")
import { db } from "../config/db"; // Asumo que tu conexión se llama 'db' y está en 'config/db'
// Importamos los "planos" de la propiedad: Property para operaciones CRUD básicas,
// y PropertyWithSeller para cuando incluimos datos del vendedor.
import { Property, PropertyWithSeller } from '../models/Property';

// --- Función para obtener todas las propiedades ---
// Le pregunta a la base de datos por todas las propiedades.
export const getAll = async (): Promise<Property[]> => {
    // Realizamos la consulta SELECT * FROM properties.
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM properties');
    return rows as Property[];
};

// --- Función para crear una nueva propiedad ---
// Guarda una nueva propiedad en la base de datos y actualiza el property_count del vendedor.
export const createProperty = async (data: Property): Promise<number> => {
    const {
        title, price, description, rooms, bathrooms, parking, seller_id
    } = data;

    // Obtenemos una conexión individual del pool para manejar la transacción.
    const conn = await db.getConnection(); // <-- NUEVO: Obtener conexión para transacción

    try {
        await conn.beginTransaction(); // <-- NUEVO: Iniciar la transacción

        // 1. Insertar la nueva propiedad
        const [result] = await conn.query<ResultSetHeader>(
            'INSERT INTO properties (title, price, description, rooms, bathrooms, parking, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, price, description, rooms, bathrooms, parking, seller_id]
        );
        const propertyId = result.insertId; // ID de la nueva propiedad

        // 2. Incrementar el property_count del vendedor asociado
        await conn.query(
            'UPDATE sellers SET property_count = property_count + 1 WHERE id = ?',
            [seller_id]
        );

        await conn.commit(); // <-- NUEVO: Confirmar todos los cambios si todo fue bien
        return propertyId;
    } catch (err) {
        await conn.rollback(); // <-- NUEVO: Deshacer todos los cambios si algo falló
        console.error('Error en la transacción al crear propiedad y actualizar contador:', err);
        throw err; // Re-lanzar el error para que el controlador lo maneje
    } finally {
        conn.release(); // <-- NUEVO: Liberar la conexión de vuelta al pool
    }
};

// --- Función para obtener una propiedad por su ID ---
// Busca una propiedad específica por su ID.
export const getById = async (id: number): Promise<Property | undefined> => {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM properties WHERE id = ?', [id]);
    return (rows[0] as Property) || undefined;
};

// --- Función para actualizar una propiedad existente ---
// Actualiza los campos de una propiedad específica.
export const update = async (id: number, data: Partial<Property>): Promise<boolean> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);
    }
    if (data.price !== undefined) {
        fields.push('price = ?');
        values.push(data.price);
    }
    if (data.description !== undefined) {
        fields.push('description = ?');
        values.push(data.description);
    }
    if (data.rooms !== undefined) {
        fields.push('rooms = ?');
        values.push(data.rooms);
    }
    if (data.bathrooms !== undefined) {
        fields.push('bathrooms = ?');
        values.push(data.bathrooms);
    }
    if (data.parking !== undefined) {
        fields.push('parking = ?');
        values.push(data.parking);
    }
    if (data.seller_id !== undefined) {
        fields.push('seller_id = ?');
        values.push(data.seller_id);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(id);
    const query = `UPDATE properties SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
};

// --- Función para eliminar una propiedad ---
// Elimina una propiedad de la base de datos y decrementa el property_count del vendedor.
export const remove = async (id: number): Promise<boolean> => {
    // Obtenemos una conexión individual del pool para manejar la transacción.
    const conn = await db.getConnection(); // <-- NUEVO: Obtener conexión para transacción

    try {
        await conn.beginTransaction(); // <-- NUEVO: Iniciar la transacción

        // 1. Obtener el seller_id de la propiedad ANTES de eliminarla
        const [propertyRows] = await conn.query<RowDataPacket[]>('SELECT seller_id FROM properties WHERE id = ?', [id]);
        const propertyToDelete = propertyRows[0] as Property;

        if (!propertyToDelete) {
            await conn.rollback(); // Si la propiedad no existe, no hay nada que eliminar ni actualizar
            return false;
        }

        const sellerId = propertyToDelete.seller_id;

        // 2. Eliminar la propiedad
        const [deleteResult] = await conn.query<ResultSetHeader>('DELETE FROM properties WHERE id = ?', [id]);

        if (deleteResult.affectedRows === 0) {
            await conn.rollback(); // Si no se eliminó ninguna fila, no hay nada que actualizar
            return false;
        }

        // 3. Decrementar el property_count del vendedor asociado
        await conn.query(
            'UPDATE sellers SET property_count = property_count - 1 WHERE id = ?',
            [sellerId]
        );

        await conn.commit(); // <-- NUEVO: Confirmar todos los cambios si todo fue bien
        return true;
    } catch (err) {
        await conn.rollback(); // <-- NUEVO: Deshacer todos los cambios si algo falló
        console.error('Error en la transacción al eliminar propiedad y actualizar contador:', err);
        throw err; // Re-lanzar el error para que el controlador lo maneje
    } finally {
        conn.release(); // <-- NUEVO: Liberar la conexión de vuelta al pool
    }
};

// --- Función para obtener todas las propiedades con detalles del vendedor ---
// Esta función realiza un JOIN para traer los datos de la propiedad y del vendedor asociado.
export const getAllPropertiesWithSellerDetails = async (): Promise<PropertyWithSeller[]> => {
    const [rows] = await db.query<RowDataPacket[]>(`
        SELECT
            p.*,
            s.name AS seller_name,
            s.email AS seller_email
        FROM
            properties AS p
        INNER JOIN
            sellers AS s ON p.seller_id = s.id
    `);
    return rows as PropertyWithSeller[];
};

// --- Función: Buscar propiedades por texto en título o descripción ---
// Busca propiedades que contengan el término de búsqueda en su título o descripción.
export const searchPropertiesByText = async (searchTerm: string): Promise<Property[]> => {
    const searchText = `%${searchTerm}%`;
    const [rows] = await db.query<RowDataPacket[]>(`
        SELECT * FROM properties
        WHERE
            title LIKE ? COLLATE utf8mb4_unicode_ci OR
            description LIKE ? COLLATE utf8mb4_unicode_ci
    `, [searchText, searchText]);
    return rows as Property[];
};
