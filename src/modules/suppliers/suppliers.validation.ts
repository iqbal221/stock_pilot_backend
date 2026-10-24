
import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  contactPerson: z.string().trim().max(100).optional().nullable(),
});

export const updateSupplierSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    email: z.string().trim().email().nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    contactPerson: z.string().trim().max(100).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const supplierQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQuery = z.infer<typeof supplierQuerySchema>;
