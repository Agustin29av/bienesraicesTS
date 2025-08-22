// tests/users.e2e.test.ts
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { resetDb } from "./setup";

describe("Users E2E", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("register + login + me", async () => {
    const reg = await request(app).post("/api/users/register").send({
      name: "Admin",
      email: "admin@test.com",
      password: "12345678",
      role: "admin",
    });
    expect([201, 409]).toContain(reg.status);

    const login = await request(app).post("/api/users/login").send({
      email: "admin@test.com",
      password: "12345678",
    });
    expect(login.status).toBe(200);
    const token = login.body.token;
    expect(token).toBeTruthy();

    const me = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.role).toBe("admin");
    expect(me.body.email).toBe("admin@test.com");
  });
});
