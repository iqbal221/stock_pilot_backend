
import { Router } from "express";
import { SaleController } from "./sale.controller.js";
import { createSaleSchema } from "./sale.validation.js";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireBusiness);

router.post(
  "/",
  validate(createSaleSchema),
  asyncHandler(SaleController.createSale),
);

router.get("/", asyncHandler(SaleController.getSales));

router.get("/:id", asyncHandler(SaleController.getSaleById));

export const salesRoutes = router;
