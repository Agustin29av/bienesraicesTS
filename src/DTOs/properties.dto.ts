import { z } from "zod";

/** Crear propiedad */
export const createPropertyBody = z.object({
  title: z.string().min(2, "Título muy corto"),
  price: z.coerce.number().positive("Precio debe ser > 0"),
  description: z.string().min(3, "Descripción muy corta"),
  rooms: z.coerce.number().int().min(0, "Rooms >= 0"),
  bathrooms: z.coerce.number().int().min(0, "Bathrooms >= 0"),
  parking: z.coerce.number().int().min(0, "Parking >= 0"),
  sellerId: z.coerce.number().int().positive("sellerId inválido"),
});

/** Actualizar propiedad (al menos un campo) */
export const updatePropertyBody = createPropertyBody
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Debes enviar al menos un campo para actualizar." }
  );

/** Param id de propiedad */
export const propertyIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

/** Listado con filtros/paginación */
export const listPropertiesQuery = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  // formato: campo:orden — campos permitidos y orden asc/desc
  sort: z
    .string()
    .regex(
      /^(price|title|created_at):(asc|desc)$/i,
      "Formato sort inválido. Usa 'price|title|created_at:asc|desc'"
    )
    .optional(),
  sellerId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
})
.superRefine((val, ctx) => {
  if (val.minPrice !== undefined && val.maxPrice !== undefined) {
    if (val.minPrice > val.maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice no puede ser mayor que maxPrice",
        path: ["minPrice"],
      });
    }
  }
});

/** Búsqueda por texto */
export const searchPropertiesQuery = z.object({
  q: z.string().trim().min(2, "Mínimo 2 caracteres para buscar"),
});

/** (Opcional) Tipos TS inferidos */
export type CreatePropertyBody = z.infer<typeof createPropertyBody>;
export type UpdatePropertyBody = z.infer<typeof updatePropertyBody>;
export type PropertyIdParam = z.infer<typeof propertyIdParam>;
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuery>;
export type SearchPropertiesQuery = z.infer<typeof searchPropertiesQuery>;
