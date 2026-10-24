
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import {  ProductController } from "./products.controller.js";
import { createProductSchema, updateProductSchema } from "./products.validation.js";

const router = Router();

router.use(requireAuth, requireBusiness);

router.post(
  "/",
  validate(createProductSchema),
  ProductController.createProduct,
);

router.get("/", ProductController.getProducts);

router.get("/:id", ProductController.getProductById);

router.patch(
  "/:id",
  validate(updateProductSchema),
 ProductController.updateProduct,
);

router.delete("/:id", ProductController.deleteProduct);

export const ProductRoutes = router;
