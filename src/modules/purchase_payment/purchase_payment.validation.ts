
import { z } from "zod";

export const createPurchasePaymentSchema = z.object({
  purchaseId: z.string().trim().min(1, "Purchase ID is required"),
  amount: z.coerce
    .number()
    .finite()
    .positive("Payment amount must be greater than zero")
    .max(9999999999.99),
  method: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "MOBILE_BANKING",
    "CARD",
    "OTHER",
  ]),
  referenceNumber: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
  paidAt: z.coerce.date().optional(),
});

export type CreatePurchasePaymentInput = z.infer<
  typeof createPurchasePaymentSchema
>;
