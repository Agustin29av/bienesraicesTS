import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../config/db";

type ListInput = {
  page: number;
  limit: number;
  sort?: string; // "name:asc" | "name:desc"
};

export async function list(input: ListInput) {
  const { page, limit, sort } = input;
  const offset = (page - 1) * limit;

  let orderBy = "name ASC";
  if (sort === "name:desc") orderBy = "name DESC";

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name, email, property_count
     FROM sellers
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [countRows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM sellers"
  );
  const total = Number((countRows as any)[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows,
    page,
    limit,
    total,
    totalPages,
  };
}

export async function findById(id: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, name, email, property_count FROM sellers WHERE id = ?",
    [id]
  );
  return (rows[0] as any) || null;
}

export async function create(input: { name: string; email: string; userId?: number }) {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO sellers (name, email, user_id) VALUES (?, ?, ?)",
    [input.name, input.email, input.userId ?? null]
  );
  return (result as ResultSetHeader).insertId;
}

export async function update(id: number, input: Partial<{ name: string; email: string }>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    values.push(input.name);
  }
  if (input.email !== undefined) {
    fields.push("email = ?");
    values.push(input.email);
  }

  if (!fields.length) return;

  values.push(id);
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE sellers SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  if ((result as ResultSetHeader).affectedRows === 0) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }
}

export async function remove(id: number) {
  // Opcional: si querés impedir borrar si tiene propiedades:
  // const [rows] = await db.query<RowDataPacket[]>(
  //   "SELECT property_count FROM sellers WHERE id = ?",
  //   [id]
  // );
  // if (!rows.length) { const err = new Error("Seller not found"); (err as any).status = 404; throw err; }
  // if (rows[0].property_count > 0) { const err = new Error("Seller has properties"); (err as any).status = 409; throw err; }

  const [result] = await db.query<ResultSetHeader>(
    "DELETE FROM sellers WHERE id = ?",
    [id]
  );
  if ((result as ResultSetHeader).affectedRows === 0) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }
}
