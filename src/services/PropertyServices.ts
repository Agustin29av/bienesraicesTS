import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../config/db";

type ListInput = {
  page: number;
  limit: number;
  sort?: string;              // "price:asc" | "price:desc" | "title:asc" | "created_at:desc" ...
  sellerId?: number;
  minPrice?: number;
  maxPrice?: number;
};

const ALLOWED_SORT_FIELDS = new Set(["price", "title", "id", "created_at"]);
function parseSort(sort?: string) {
  if (!sort) return "id DESC";
  const [field, dirRaw] = sort.split(":");
  const dir = (dirRaw || "asc").toUpperCase() === "DESC" ? "DESC" : "ASC";
  return ALLOWED_SORT_FIELDS.has(field) ? `${field} ${dir}` : "id DESC";
}

/** LISTAR con filtros + paginación */
export async function list(input: ListInput) {
  const { page, limit, sort, sellerId, minPrice, maxPrice } = input;
  const offset = (page - 1) * limit;
  const orderBy = parseSort(sort);

  const where: string[] = [];
  const params: any[] = [];

  if (sellerId) { where.push("seller_id = ?"); params.push(sellerId); }
  if (minPrice) { where.push("price >= ?");    params.push(minPrice); }
  if (maxPrice) { where.push("price <= ?");    params.push(maxPrice); }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, price, description, rooms, bathrooms, parking,
            seller_id AS sellerId
     FROM properties
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM properties ${whereSql}`,
    params
  );
  const total = Number((countRows as any)[0].total);
  const totalPages = Math.ceil(total / limit);

  return { data: rows, page, limit, total, totalPages };
}

/** OBTENER por id */
export async function findById(id: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, price, description, rooms, bathrooms, parking,
            seller_id AS sellerId
     FROM properties
     WHERE id = ?`,
    [id]
  );
  return (rows[0] as any) || null;
}

/** BUSCAR (simple) por texto */
export async function search(q: string) {
  const like = `%${q}%`;
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, price, description, rooms, bathrooms, parking,
            seller_id AS sellerId
     FROM properties
     WHERE title LIKE ? OR description LIKE ?`,
    [like, like]
  );
  return rows;
}

/** LISTAR con datos del seller (para vistas combinadas) */
export async function listWithSeller() {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.price, p.description, p.rooms, p.bathrooms, p.parking,
            s.id AS sellerId, s.name AS sellerName, s.email AS sellerEmail
     FROM properties p
     JOIN sellers s ON s.id = p.seller_id
     ORDER BY p.id DESC`
  );
  return rows;
}

/** CREAR (ahora requiere todos los campos del DTO) */
export async function create(input: {
  title: string;
  price: number;
  description: string;
  rooms: number;
  bathrooms: number;
  parking: number;
  sellerId: number;
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // validar seller
    const [sellerRows] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM sellers WHERE id = ?",
      [input.sellerId]
    );
    if (!(sellerRows as any[]).length) {
      const err = new Error("Seller not found");
      (err as any).status = 404;
      throw err;
    }

    // insertar propiedad con TODOS los campos NOT NULL de la tabla
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO properties
       (title, price, description, rooms, bathrooms, parking, seller_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.price,
        input.description,
        input.rooms,
        input.bathrooms,
        input.parking,
        input.sellerId,
      ]
    );

    // actualizar contador del seller
    await conn.query(
      "UPDATE sellers SET property_count = property_count + 1 WHERE id = ?",
      [input.sellerId]
    );

    await conn.commit();
    return (result as ResultSetHeader).insertId;
  } catch (e: any) {
    await conn.rollback();
    // opcional: mapear errores de MySQL a 400
    if (e?.code === "ER_BAD_NULL_ERROR") {
      const err = new Error("Campos requeridos faltantes");
      (err as any).status = 400;
      throw err;
    }
    throw e;
  } finally {
    conn.release();
  }
}

/** ACTUALIZAR (parcial) */
export async function update(id: number, input: Partial<{
  title: string;
  price: number;
  description: string;
  rooms: number;
  bathrooms: number;
  parking: number;
  sellerId: number;
}>) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Traer propiedad actual (para saber si cambia de seller)
    const [propRows] = await conn.query<RowDataPacket[]>(
      "SELECT id, seller_id FROM properties WHERE id = ?",
      [id]
    );
    if (!(propRows as any[]).length) {
      const err = new Error("Property not found");
      (err as any).status = 404;
      throw err;
    }
    const currentSellerId = (propRows as any)[0].seller_id as number;

    const fields: string[] = [];
    const values: any[] = [];

    if (input.title       !== undefined) { fields.push("title = ?");       values.push(input.title); }
    if (input.price       !== undefined) { fields.push("price = ?");       values.push(input.price); }
    if (input.description !== undefined) { fields.push("description = ?"); values.push(input.description); }
    if (input.rooms       !== undefined) { fields.push("rooms = ?");       values.push(input.rooms); }
    if (input.bathrooms   !== undefined) { fields.push("bathrooms = ?");   values.push(input.bathrooms); }
    if (input.parking     !== undefined) { fields.push("parking = ?");     values.push(input.parking); }

    if (input.sellerId !== undefined) {
      // validar seller nuevo
      const [sellerRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM sellers WHERE id = ?",
        [input.sellerId]
      );
      if (!(sellerRows as any[]).length) {
        const err = new Error("New seller not found");
        (err as any).status = 404;
        throw err;
      }
      fields.push("seller_id = ?");
      values.push(input.sellerId);
    }

    if (fields.length) {
      values.push(id);
      const [result] = await conn.query<ResultSetHeader>(
        `UPDATE properties SET ${fields.join(", ")} WHERE id = ?`,
        values
      );
      if ((result as ResultSetHeader).affectedRows === 0) {
        const err = new Error("Property not updated");
        (err as any).status = 400;
        throw err;
      }
    }

    // Ajustar contadores si cambió de seller
    if (input.sellerId !== undefined && input.sellerId !== currentSellerId) {
      await conn.query(
        "UPDATE sellers SET property_count = property_count - 1 WHERE id = ?",
        [currentSellerId]
      );
      await conn.query(
        "UPDATE sellers SET property_count = property_count + 1 WHERE id = ?",
        [input.sellerId]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** ELIMINAR */
export async function remove(id: number) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // obtener seller_id para ajustar contador
    const [propRows] = await conn.query<RowDataPacket[]>(
      "SELECT seller_id FROM properties WHERE id = ?",
      [id]
    );
    if (!(propRows as any[]).length) {
      const err = new Error("Property not found");
      (err as any).status = 404;
      throw err;
    }
    const sellerId = (propRows as any)[0].seller_id as number;

    const [result] = await conn.query<ResultSetHeader>(
      "DELETE FROM properties WHERE id = ?",
      [id]
    );
    if ((result as ResultSetHeader).affectedRows === 0) {
      const err = new Error("Property not found");
      (err as any).status = 404;
      throw err;
    }

    await conn.query(
      "UPDATE sellers SET property_count = property_count - 1 WHERE id = ?",
      [sellerId]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
