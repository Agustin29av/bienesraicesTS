// src/services/SellerServices.ts

// Importamos los tipos necesarios de 'mysql2/promise' para manejar los resultados de las consultas a la DB.
// ResultSetHeader: Para operaciones que modifican la DB (INSERT, UPDATE, DELETE) y nos dan info como el ID insertado o filas afectadas.
// RowDataPacket: Para operaciones SELECT que devuelven filas de datos.
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
// Importamos la conexión a la base de datos 
import { db } from '../config/db';
// Importamos el "plano" del vendedor para el tipado
import { Seller } from '../models/Seller';

// --- Función para obtener todos los vendedores ---
// Le pregunta a la base de datos por todos los vendedores.
export const getAll = async (): Promise<Seller[]> => {
    // Realizamos la consulta SELECT * FROM sellers.
    // El 'db.query' devuelve un array, donde la primera posición '[rows]' contiene los resultados.
    // <RowDataPacket[]> es para que TypeScript sepa el tipo de los resultados crudos de la DB.
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM sellers'); 
    // Convertimos las filas de datos crudas a nuestro tipo 'Seller[]' y las devolvemos.
    return rows as Seller[];
};

// --- Función para crear un nuevo vendedor ---
// Guarda un nuevo vendedor en la base de datos.
export const createSeller = async (data: Seller): Promise<number> => { // <-- Ahora promete devolver el ID (number)
    const { name, email } = data;

    // Ejecutamos la consulta INSERT. Los '?' son placeholders que se reemplazan con los valores del array.
    // <ResultSetHeader> es para que TypeScript sepa el tipo de la respuesta de un INSERT.
    const [result] = await db.query<ResultSetHeader>(
        'INSERT INTO sellers (name, email) VALUES (?, ?)', // <-- CORREGIDO: (?. ?) a (?, ?)
        [name, email]
    );
    // 'result.insertId' contiene el ID que la base de datos asignó automáticamente al nuevo registro.
    return result.insertId; // Devolvemos el ID del vendedor recién creado
};

// --- Función para obtener un vendedor por su ID ---
// Busca un vendedor específico por su ID.
export const getById = async (id: number): Promise<Seller | undefined> => { // <-- CORREGIDO: getByIid a getById y Promise<Seller | undefined>
    // Realizamos la consulta SELECT donde el ID del vendedor coincida.
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM sellers WHERE id = ?', [id]);
    // Devolvemos la primera fila encontrada (si existe) como tipo 'Seller'.
    // Si no se encontró ninguna fila, 'rows[0]' será undefined, y la función devolverá undefined.
    return (rows[0] as Seller) || undefined;
};

// --- Función para actualizar un vendedor existente ---
// Actualiza los campos de un vendedor específico.
// 'Partial<Seller>' significa que 'data' puede contener solo algunos campos de 'Seller'.
export const update = async (id: number, data: Partial<Seller>): Promise<boolean> => { // <-- Ahora promete un boolean
    const fields: string[] = []; // Array para construir las partes 'campo = ?' de la consulta
    const values: any[] = [];    // Array para guardar los valores correspondientes a los '?'

    // Construimos la consulta UPDATE dinámicamente:
    // Solo añadimos campos a la actualización si están presentes en el objeto 'data'.
    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }
    if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
    }

    // Si no hay campos para actualizar (el objeto 'data' estaba vacío o solo tenía campos no válidos),
    // no hacemos la consulta y devolvemos false.
    if (fields.length === 0) {
        return false;
    }

    // Añadimos el ID al final del array de valores, ya que se usará en la cláusula WHERE.
    values.push(id);

    // Construimos la consulta SQL final uniendo los campos y añadiendo la cláusula WHERE.
    const query = `UPDATE sellers SET ${fields.join(', ')} WHERE id = ?`;
    // Ejecutamos la consulta UPDATE.
    const [result] = await db.query<ResultSetHeader>(query, values);

    // 'result.affectedRows' nos dice cuántas filas fueron modificadas.
    // Si es mayor que 0, significa que se actualizó al menos una fila (el vendedor existe y se modificó).
    return result.affectedRows > 0; // Devolvemos true si se actualizó, false si no.
};

// --- Función para eliminar un vendedor ---
// Elimina un vendedor de la base de datos por su ID.
export const remove = async (id: number): Promise<boolean> => { // <-- Ahora promete un boolean
    // Ejecutamos la consulta DELETE.
    const [result] = await db.query<ResultSetHeader>('DELETE FROM sellers WHERE id = ?', [id]);
    // Devolvemos true si se eliminó al menos una fila, false si no se encontró el ID.
    return result.affectedRows > 0; // Devolvemos true si se eliminó, false si no.
};
