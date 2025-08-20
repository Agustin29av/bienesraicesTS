import { Request, Response } from "express";
import * as SellerServices from "../services/SellerServices";

export async function getSellers(req: Request, res: Response) {
  const { page, limit, sort } = req.query as any;
  const result = await SellerServices.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: sort as string | undefined,
  });
  res.json(result);
}

export async function getSellerById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const seller = await SellerServices.findById(id);
  if (!seller) {
    const err = new Error("Seller not found");
    (err as any).status = 404;
    throw err;
  }
  res.json(seller);
}

export async function createSeller(req: Request, res: Response) {
  const id = await SellerServices.create({
    ...req.body,
    // si el que crea es seller, lo enlazamos
    userId: (req as any).user?.role === "seller" ? (req as any).user?.id : undefined,
  });
  res.status(201).json({ id });
}

export async function updateSeller(req: Request, res: Response) {
  const id = Number(req.params.id);
  await SellerServices.update(id, req.body);
  res.status(204).send();
}

export async function removeSeller(req: Request, res: Response) {
  const id = Number(req.params.id);
  await SellerServices.remove(id);
  res.status(204).send();
}
