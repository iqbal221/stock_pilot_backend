
import { Router } from "express";

import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { StockMovementController } from "./stock_movement.controller.js";
import { adjustmentSchema, receiptSchema } from "./stock_movement.validatin.js";

const router = Router();

router.use(requireAuth, requireBusiness);

router.get("/summary", asyncHandler(StockMovementController.getSummary));

router.post(
  "/adjustment",
  validate(adjustmentSchema),
  asyncHandler(StockMovementController.adjustStock),
);

router.post(
  "/receipt",
  validate(receiptSchema),
  asyncHandler(StockMovementController.receiveStock),
);

router.get("/", asyncHandler(StockMovementController.getMovements));

router.get("/:id", asyncHandler(StockMovementController.getMovementById));

export const stockMovementRoutes = router;
