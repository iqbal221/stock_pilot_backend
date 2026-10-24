
import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(1000000),
});

export const createSaleSchema = z.object({
  customerId: z.string().min(1).optional(),
  items: z.array(saleItemSchema).min(1).max(500),
  discount: z.coerce.number().min(0).max(9999999999).default(0),
  tax: z.coerce.number().min(0).max(9999999999).default(0),
  amountPaid: z.coerce.number().min(0).max(9999999999).default(0),
  notes: z.string().trim().max(1000).optional(),
});

export const saleQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleQuery = z.infer<typeof saleQuerySchema>;
