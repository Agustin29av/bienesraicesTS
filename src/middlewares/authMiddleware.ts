import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db";
import { RowDataPacket } from "mysql2/promise";

type Role = "admin" | "seller" | "buyer";
type AuthUser = { id: number; role: Role; email?: string; sellerId?: number };
type AuthenticatedRequest = Request & { user?: AuthUser };

export function auth(required = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      if (required) return res.status(401).json({ error: "Unauthorized" });
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      let sellerId: number | undefined =
        payload.sellerId !== undefined && payload.sellerId !== null
          ? Number(payload.sellerId)
          : undefined;

      // 🔁 Hidratamos sellerId si el token es de seller pero no lo trae
      if (payload.role === "seller" && (sellerId === undefined || Number.isNaN(sellerId))) {
        const [rows] = await db.query<RowDataPacket[]>(
          "SELECT id FROM sellers WHERE user_id = ? LIMIT 1",
          [payload.id]
        );
        const found = (rows as RowDataPacket[])[0] as any;
        if (found?.id !== undefined) {
          sellerId = Number(found.id);
        }
      }

      (req as AuthenticatedRequest).user = {
        id: Number(payload.id),
        role: payload.role as Role,
        email: payload.email,
        sellerId,
      };

      return next();
    } catch {
      return res.status(401).json({ error: "InvalidToken" });
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

// Alias por compatibilidad
export { auth as authenticateToken, requireRole as authorizeRoles };
