import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: number;
      role: "admin" | "seller" | "buyer";
      email?: string;
      sellerId?: number; // Agregado para compatibilidad
    }
    interface Request {
      user?: UserPayload;
    }
  }
}
export {};
