import { Request, Response } from "express";
import * as UserServices from "../services/UserServices";

export default class UserController {
  async register(req: Request, res: Response) {
    const id = await UserServices.register(req.body); // RegisterUser
    res.status(201).json({ id });
  }

  async login(req: Request, res: Response) {
    const { token } = await UserServices.login(req.body.email, req.body.password);
    res.json({ token });
  }

  async me(req: Request, res: Response) {
    const user = await UserServices.findById(req.user!.id);
    if (!user) {
      const err = new Error("User not found");
      (err as any).status = 404;
      throw err;
    }
    res.json(user);
  }

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    await UserServices.remove(id);
    res.status(204).send();
  }
}
