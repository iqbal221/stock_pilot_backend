
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { createCategorySchema, updateCategorySchema } from "./categories.validation.js";
import { CategoryController } from "./categories.controller.js";

const router = Router();

router.use(requireAuth, requireBusiness);

router.post(
  "/",
  validate(createCategorySchema),
  CategoryController.createCategory,
);

router.get("/", CategoryController.getCategories);

router.get("/:id", CategoryController.getCategoryById);

router.patch(
  "/:id",
  validate(updateCategorySchema),
 CategoryController.updateCategory,
);

router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;
