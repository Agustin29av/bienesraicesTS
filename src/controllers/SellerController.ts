import { Request, Response } from "express";
import * as SellerServices from "../services/SellerServices";

type Role = "admin" | "seller" | "buyer";
type AuthReq = Request & { user?: { id: number; role: Role } };

export async function getSellers(_req: Request, res: Response) {
  const q = (res.locals.query || {}) as { page?: number; limit?: number; sort?: string };
  const result = await SellerServices.list({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 10,
    sort: q.sort,
  });
  res.json(result);
}

export async function getSellerById(_req: Request, res: Response) {
  const { id } = (res.locals.params || {}) as { id: number };
  const seller = await SellerServices.findById(Number(id));
  if (!seller) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }
  res.json(seller);
}

export async function createSeller(req: Request, res: Response) {
  const body = res.locals.body as { name: string; email: string };
  const auth = (req as AuthReq).user;
  const id = await SellerServices.create({
    ...body,
    // si el que crea es seller, lo vinculamos a su user.id
    userId: auth?.role === "seller" ? auth.id : undefined,
  });
  res.status(201).json({ id });
}

export async function updateSeller(req: Request, res: Response) {
  const { id } = (res.locals.params || {}) as { id: number };
  const patch = (res.locals.body || {}) as Partial<{ name: string; email: string; userId?: number }>;

  // ✅ solo admin puede cambiar la vinculación (userId)
  const role = (req as AuthReq).user?.role;
  if (role !== "admin" && patch.userId !== undefined) {
    delete patch.userId;
  }

  await SellerServices.update(Number(id), patch);
  res.status(204).send();
}

export async function removeSeller(_req: Request, res: Response) {
  const { id } = (res.locals.params || {}) as { id: number };
  await SellerServices.remove(Number(id));
  res.status(204).send();
}
