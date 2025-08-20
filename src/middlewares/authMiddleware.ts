import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Tipo local para no depender de augmentations globales
type Role = "admin" | "seller" | "buyer";
type AuthUser = { id: number; role: Role; email?: string; sellerId?: number }; // agregado sellerId
type AuthenticatedRequest = Request & { user?: AuthUser };

export function auth(required = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      if (required) return res.status(401).json({ error: "Unauthorized" });
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (req as AuthenticatedRequest).user = {
        id: payload.id,
        role: payload.role,
        email: payload.email,
        sellerId: payload.sellerId, // ahora es parte del tipo
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
