// tests/setup.ts
import { beforeAll, afterAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";

// Cargar .env.test (y sobrescribir lo que venga de .env)
loadEnv({ path: path.resolve(process.cwd(), ".env.test"), override: true });
console.log("DB_NAME en tests:", process.env.DB_NAME);

import { db } from "../src/config/db";

export async function resetDb() {
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.query("TRUNCATE TABLE properties");
  await db.query("TRUNCATE TABLE sellers");
  await db.query("TRUNCATE TABLE users");
  await db.query("SET FOREIGN_KEY_CHECKS = 1");
}

beforeAll(async () => {
  await resetDb();
});

afterAll(async () => {
  await db.end();
});
