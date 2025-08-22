import { Request, Response } from "express";
import * as UserServices from "../services/UserServices";

type Role = "admin" | "seller" | "buyer";
type AuthReq = Request & { user?: { id: number; role: Role; email?: string } };

export default class UserController {
  async register(_req: Request, res: Response) {
    const body = res.locals.body as { name: string; email: string; password: string; role?: Role };
    const id = await UserServices.register(body);
    res.status(201).json({ id });
  }

  async login(_req: Request, res: Response) {
    const body = res.locals.body as { email: string; password: string };
    const { token } = await UserServices.login(body.email, body.password);
    res.json({ token });
  }

  async me(req: Request, res: Response) {
    const userId = (req as AuthReq).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await UserServices.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      (err as any).status = 404;
      throw err;
    }
    res.json(user);
  }

  async remove(_req: Request, res: Response) {
    const { id } = (res.locals.params || {}) as { id: number };
    await UserServices.remove(Number(id));
    res.status(204).send();
  }
}
