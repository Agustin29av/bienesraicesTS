import { z } from "zod";

export const createSellerBody = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email(),
});

export const updateSellerBody = createSellerBody.partial();

export const sellerIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSellersQuery = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sort: z.enum(["name:asc", "name:desc"]).optional(),
});
