
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createSupplierSchema, updateSupplierSchema } from "./suppliers.validation.js";
import { SupplierController } from "./suppliers.controller.js";

const router = Router();

router.use(requireAuth, requireBusiness);

router.post(
  "/",
  validate(createSupplierSchema),
  asyncHandler(SupplierController.createSupplier),
);

router.get("/", asyncHandler(SupplierController.getSuppliers));

router.get("/:id", asyncHandler(SupplierController.getSupplierById));

router.patch(
  "/:id",
  validate(updateSupplierSchema),
  asyncHandler(SupplierController.updateSupplier),
);

router.delete("/:id", asyncHandler(SupplierController.deleteSupplier));

export const SupplierRoutes = router;