// tests/properties.e2e.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { resetDb } from "./setup";

// Sufijo único por corrida → evitamos choques de emails entre ejecuciones
const SUFFIX = Date.now();

// Usuarios (tabla users)
const S1_USER_EMAIL    = `seller1.props+${SUFFIX}@test.com`;
const S2_USER_EMAIL    = `seller2.props+${SUFFIX}@test.com`;
const ADMIN_USER_EMAIL = `admin.props+${SUFFIX}@test.com`;

// Sellers (tabla sellers) — email independiente del user para que sea explícito
const S1_SELLER_EMAIL  = `s1.seller+${SUFFIX}@test.com`;

async function login(email: string, password: string) {
  const res = await request(app).post("/api/users/login").send({ email, password });
  return res.body.token as string;
}

/**
 * Crea (o recupera) un seller por email.
 * Si ya existía (409) y su user_id no coincide con el user del tokenSeller,
 * lo re-vincula usando el tokenAdmin (PUT /api/sellers/:id { userId }).
 * Devuelve el sellerId listo para usar en propiedades (ownership OK).
 */
async function ensureSellerIdFor(
  sellerEmail: string,
  tokenSeller: string,
  tokenAdmin: string,
  name: string
) {
  // 1) Intento de creación con el propio seller
  const r = await request(app)
    .post("/api/sellers")
    .set("Authorization", `Bearer ${tokenSeller}`)
    .send({ name, email: sellerEmail });

  let sellerId: number;

  if (r.status === 201) {
    sellerId = r.body.id;
  } else if (r.status === 409) {
    // 2) Ya existía: lo busco por email para obtener su id
    const list = await request(app).get("/api/sellers");
    const found = list.body.data.find((x: any) => x.email === sellerEmail);
    if (!found) throw new Error(`Seller ${sellerEmail} no encontrado tras 409`);
    sellerId = found.id;
  } else {
    throw new Error(`POST /api/sellers devolvió estado inesperado: ${r.status}`);
  }

  // 3) Id del user logueado con tokenSeller
  const me = await request(app)
    .get("/api/users/me")
    .set("Authorization", `Bearer ${tokenSeller}`);
  const myUserId = Number(me.body.id);

  // 4) Verificar vínculo actual del seller → si difiere, re-vincular con admin
  const current = await request(app).get(`/api/sellers/${sellerId}`);
  const currentUserId =
    current.body.userId !== undefined ? Number(current.body.userId) : null;

  if (currentUserId !== myUserId) {
    const upd = await request(app)
      .put(`/api/sellers/${sellerId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ userId: myUserId });
    expect(upd.status).toBe(204);

    const after = await request(app).get(`/api/sellers/${sellerId}`);
    const afterUserId =
      after.body.userId !== undefined ? Number(after.body.userId) : null;
    expect(afterUserId).toBe(myUserId);
  }

  return sellerId;
}

describe("Properties E2E", () => {
  let tokenSeller1 = "", tokenSeller2 = "", tokenAdmin = "";
  let seller1Id = 0, propertyId = 0;

  beforeAll(async () => {
    await resetDb();

    // Crear usuarios base
    await request(app).post("/api/users/register").send({
      name: "Seller Uno", email: S1_USER_EMAIL, password: "12345678", role: "seller"
    });
    await request(app).post("/api/users/register").send({
      name: "Seller Dos", email: S2_USER_EMAIL, password: "12345678", role: "seller"
    });
    await request(app).post("/api/users/register").send({
      name: "Admin", email: ADMIN_USER_EMAIL, password: "12345678", role: "admin"
    });

    // Login inicial
    tokenSeller1 = await login(S1_USER_EMAIL, "12345678");
    tokenSeller2 = await login(S2_USER_EMAIL, "12345678");
    tokenAdmin   = await login(ADMIN_USER_EMAIL, "12345678");

    // Asegurar seller de S1 y vincularlo a su user
    seller1Id = await ensureSellerIdFor(
      S1_SELLER_EMAIL,
      tokenSeller1,
      tokenAdmin,
      "Seller Uno"
    );

    // 🔁 Re-login para refrescar el JWT con sellerId embebido
    tokenSeller1 = await login(S1_USER_EMAIL, "12345678");

    // (opcional) sanity check del vínculo
    const me1 = await request(app).get("/api/users/me")
      .set("Authorization", `Bearer ${tokenSeller1}`);
    const s1  = await request(app).get(`/api/sellers/${seller1Id}`);
    expect(s1.body.userId).toBe(me1.body.id);
  });

  it("CRUD + ownership", async () => {
    // CREATE (propiedad del seller1)
    const c = await request(app).post("/api/properties")
      .set("Authorization", `Bearer ${tokenSeller1}`)
      .send({
        title: "Casa Parque",
        price: 150000,
        description: "Casa con patio",
        rooms: 3,
        bathrooms: 2,
        parking: 1,
        sellerId: seller1Id,
      });
    expect(c.status).toBe(201);
    propertyId = c.body.id;

    // GET by id
    const g = await request(app).get(`/api/properties/${propertyId}`);
    expect(g.status).toBe(200);
    expect(g.body.title).toBe("Casa Parque");

    // LIST con filtros
    const l = await request(app)
      .get(`/api/properties?sellerId=${seller1Id}&minPrice=100000&sort=price:asc&page=1&limit=10`);
    expect(l.status).toBe(200);
    expect(Array.isArray(l.body.data)).toBe(true);

    // UPDATE por OTRO seller => 403
    const u403 = await request(app).put(`/api/properties/${propertyId}`)
      .set("Authorization", `Bearer ${tokenSeller2}`)
      .send({ price: 160000 });
    expect(u403.status).toBe(403);

    // UPDATE por admin => 204
    const u204 = await request(app).put(`/api/properties/${propertyId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ price: 160000 });
    expect(u204.status).toBe(204);

    // DELETE por dueño (seller1) => 204 ✅
    const d204 = await request(app).delete(`/api/properties/${propertyId}`)
      .set("Authorization", `Bearer ${tokenSeller1}`);
    expect(d204.status).toBe(204);
  });
});
