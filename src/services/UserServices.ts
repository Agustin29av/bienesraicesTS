import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../config/db";
import { User, RegisterUser } from "../models/Users";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Crea un usuario y devuelve el insertId
export async function register(userData: RegisterUser): Promise<number> {
  const { name, email, password, role } = userData;

  // ¿Email ya usado?
  const [exists] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  if ((exists as any[]).length) {
    const err = new Error("Email already in use");
    (err as any).status = 409;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role || "buyer"]
  );

  return (result as ResultSetHeader).insertId;
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  const user = rows[0] as User | undefined;

  if (!user || !(await bcrypt.compare(password, user.password))) {
    const err = new Error("Invalid credentials");
    (err as any).status = 401;
    throw err;
  }

  // Buscamos el sellerId vinculado a este user
  const [srows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM sellers WHERE user_id = ? LIMIT 1",
    [user.id]
  );
  const sellerId = (srows as RowDataPacket[])[0]?.id as number | undefined;

  const payload = { id: user.id, email: user.email, role: user.role, sellerId }; 
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  return { token };
}


// Trae un usuario por id (sin password). Si no existe, devuelve null.
export async function findById(id: number): Promise<Omit<User, "password"> | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  const u = rows[0] as Omit<User, "password"> | undefined;
  return u ?? null;
}

// Elimina un usuario por id. Lanza 404 si no existe.
export async function remove(id: number): Promise<void> {
  const [result] = await db.query<ResultSetHeader>(
    "DELETE FROM users WHERE id = ?",
    [id]
  );
  if ((result as ResultSetHeader).affectedRows === 0) {
    const err = new Error("User not found");
    (err as any).status = 404;
    throw err;
  }
}
