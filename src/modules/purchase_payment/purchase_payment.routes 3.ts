
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { createPurchasePaymentSchema } from "./purchase_payment.validation";
import { PurchasePayment } from "./purchase_payment.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireBusiness } from "../../middleware/business.middleware";

const router = Router();

router.use(requireAuth, requireBusiness);

router.post(
  "/:purchaseId",
  validate(createPurchasePaymentSchema),
  PurchasePayment.createPurchasePayment,
);

router.get("/:purchaseId", PurchasePayment.listPurchasePayments);

export const purchasePaymentRoutes = router;
