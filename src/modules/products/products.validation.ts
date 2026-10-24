
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(150),
  sku: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  costPrice: z.coerce.number().min(0).max(9999999999),
  sellingPrice: z.coerce.number().min(0).max(9999999999),
  initialStock: z.coerce.number().int().min(0).max(100000000).default(0),
  minStock: z.coerce.number().int().min(0).max(100000000).default(5),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  sku: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  supplierId: z.string().min(1).nullable().optional(),
  costPrice: z.coerce.number().min(0).max(9999999999).optional(),
  sellingPrice: z.coerce.number().min(0).max(9999999999).optional(),
  minStock: z.coerce.number().int().min(0).max(100000000).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" },
);

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
