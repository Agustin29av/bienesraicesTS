import { z } from "zod";

export const registerBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "seller", "buyer"]).optional()
});

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const userIdParam = z.object({
  id: z.coerce.number().int().positive()
});
