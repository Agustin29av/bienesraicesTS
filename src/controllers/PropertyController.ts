// src/controllers/PropertyController.ts
import { Request, Response } from "express";
import * as PropertyServices from "../services/PropertyServices";

type Role = "admin" | "seller" | "buyer";
type AuthReq = Request & { user?: { id: number; role: Role; email?: string } };

export async function getProperties(_req: Request, res: Response) {
  const q = (res.locals.query || {}) as {
    page?: number; limit?: number; sort?: string;
    sellerId?: number; minPrice?: number; maxPrice?: number;
  };

  const result = await PropertyServices.list({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 10,
    sort: q.sort,
    sellerId: q.sellerId ? Number(q.sellerId) : undefined,
    minPrice: q.minPrice ? Number(q.minPrice) : undefined,
    maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
  });

  res.json(result);
}

export async function getPropertyById(_req: Request, res: Response) {
  const { id } = (res.locals.params || {}) as { id: number };
  const prop = await PropertyServices.findById(Number(id));
  if (!prop) {
    const err = new Error("Property not found");
    (err as any).status = 404;
    throw err;
  }
  res.json(prop);
}

export async function searchProperties(_req: Request, res: Response) {
  const { q } = (res.locals.query || {}) as { q: string };
  const data = await PropertyServices.search(q);
  res.json({ data });
}

export async function getPropertiesWithSellerInfo(_req: Request, res: Response) {
  const data = await PropertyServices.listWithSeller();
  res.json({ data });
}

export async function createProperty(req: Request, res: Response) {
  const body = res.locals.body as {
    title: string;
    price: number;
    description: string;
    rooms: number;
    bathrooms: number;
    parking: number;
    sellerId: number;
  };

  // (Opcional) Si querés forzar que un seller sólo cree para su propio sellerId:
  // const auth = (req as AuthReq).user;
  // if (auth && auth.role === "seller") {
  //   const ownerUserId = await PropertyServices.getSellerOwnerUserId(body.sellerId);
  //   if (ownerUserId !== auth.id) {
  //     return res.status(403).json({ error: "Forbidden" });
  //   }
  // }

  const id = await PropertyServices.create(body);
  res.status(201).json({ id });
}

export async function updateProperty(req: Request, res: Response) {
  const { id } = (res.locals.params || {}) as { id: number };
  const patch = (res.locals.body || {}) as Partial<{
    title: string; price: number; description: string;
    rooms: number; bathrooms: number; parking: number; sellerId: number;
  }>;

  const auth = (req as AuthReq).user;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (auth.role !== "admin") {
    const ownerUserId = await PropertyServices.getOwnerUserId(Number(id));
    if (ownerUserId === null) {
      const err = new Error("Property not found");
      (err as any).status = 404;
      throw err;
    }
    // 👇 Fuerzo ambos a número
    if (Number(ownerUserId) !== Number(auth.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  await PropertyServices.update(Number(id), patch);
  res.status(204).send();
}

export async function removeProperty(req: Request, res: Response) {
  const { id } = (res.locals.params || {}) as { id: number };

  const auth = (req as AuthReq).user;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (auth.role !== "admin") {
    const ownerUserId = await PropertyServices.getOwnerUserId(Number(id));
    if (ownerUserId === null) {
      const err = new Error("Property not found");
      (err as any).status = 404;
      throw err;
    }
    // 👇 Fuerzo ambos a número
    if (Number(ownerUserId) !== Number(auth.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  await PropertyServices.remove(Number(id));
  res.status(204).send();
}
