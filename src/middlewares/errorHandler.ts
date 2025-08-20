import { ErrorRequestHandler } from 'express';

// Middleware de manejo de errores
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = (err as any).status ?? 500;
    const name = err.name || "InternalServerError";
    const message = err.message || "Unexpected error";
    // en dev podés loguear stack:
    if (process.env.NODE_ENV !== "production") {
        console.error(err);
    }
    res.status(status).json({ error: name, message });
};