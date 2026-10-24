
import { z } from "zod";

export const adjustmentSchema = z.object({
  productId: z.string().min(1),
  direction: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().int().min(1).max(100000000),
  note: z.string().trim().max(500).optional(),
});

export const receiptSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(100000000),
  note: z.string().trim().max(500).optional(),
});

export const stockMovementQuerySchema = z.object({
  productId: z.string().min(1).optional(),
  type: z.enum([
    "OPENING",
    "PURCHASE",
    "SALE",
    "SALE_RETURN",
    "PURCHASE_RETURN",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
export type ReceiptInput = z.infer<typeof receiptSchema>;
export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;
