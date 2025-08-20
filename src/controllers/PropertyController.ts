import { Request, Response } from "express";
import * as PropertyServices from "../services/PropertyServices";

export async function getProperties(req: Request, res: Response) {
  const {
    page, limit, sort, sellerId, minPrice, maxPrice
  } = req.query as any;

  const result = await PropertyServices.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: sort as string | undefined,
    sellerId: sellerId ? Number(sellerId) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  res.json(result);
}

export async function getPropertyById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const prop = await PropertyServices.findById(id);
  if (!prop) {
    const err = new Error("Property not found");
    (err as any).status = 404;
    throw err;
  }
  res.json(prop);
}

export async function searchProperties(req: Request, res: Response) {
  const { q } = req.query as any;
  const data = await PropertyServices.search(q);
  res.json({ data });
}

export async function getPropertiesWithSellerInfo(_req: Request, res: Response) {
  const data = await PropertyServices.listWithSeller();
  res.json({ data });
}

export async function createProperty(req: Request, res: Response) {
  const id = await PropertyServices.create(req.body);
  res.status(201).json({ id });
}

export async function updateProperty(req: Request, res: Response) {
  const id = Number(req.params.id);
  await PropertyServices.update(id, req.body);
  res.status(204).send();
}

export async function removeProperty(req: Request, res: Response) {
  const id = Number(req.params.id);
  await PropertyServices.remove(id);
  res.status(204).send();
}
