// src/middlewares/ownership.ts
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
type Role = "admin" | "seller" | "buyer";
type AuthUser = { id: number; role: Role; email?: string; sellerId?: number };
type AReq = Request & { user?: AuthUser };

export function requirePropertyOwnershipOrAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AReq).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role === "admin") return next();

    const propId = Number(req.params.id);
    const [rows]: any = await db.query("SELECT seller_id FROM properties WHERE id = ?", [propId]);
    if (!rows.length) return res.status(404).json({ error: "Property not found" });

    if (user.role === "seller" && user.sellerId === rows[0].seller_id) return next();
    return res.status(403).json({ error: "Forbidden" });
  };
}
