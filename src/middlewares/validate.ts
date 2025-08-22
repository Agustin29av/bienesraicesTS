import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

type TargetKeys = "body" | "params" | "query";
type SchemaShape = Partial<Record<TargetKeys, ZodTypeAny>>;

export const validate = (schema: SchemaShape) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body)   res.locals.body   = schema.body.parse(req.body);
      if (schema.params) res.locals.params = schema.params.parse(req.params);
      if (schema.query)  res.locals.query  = schema.query.parse(req.query);
      return next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ error: "ValidationError", details: e.flatten() });
      }
      return next(e);
    }
  };
