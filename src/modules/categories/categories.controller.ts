
import type { Request, Response } from "express";
import { CategoryService } from "./categories.service";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.validation";
import getCategoryId from "./categories.helper";


const createCategory = async(req: Request, res: Response)=> {
  const category = await CategoryService.createCategory(
    req.businessId!,
    req.body as CreateCategoryInput,
  );

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: { category },
  });
}

const getCategories= async(_req: Request, res: Response)=> {
  const categories = await CategoryService.getCategories(
    _req.businessId!,
  );

  return res.status(200).json({
    success: true,
    results: categories.length,
    data: { categories },
  });
}

const getCategoryById = async(req: Request, res: Response)=> {
  const category = await CategoryService.getCategories(
    req.businessId!,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    data: { category },
  });
}

const updateCategory = async(req: Request, res: Response) =>{
  const category = await CategoryService.updateCategory(
    req.businessId!,
    req.params.id,
    req.body as UpdateCategoryInput,
  );

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: { category },
  });
}

const deleteCategory = async(req: Request, res: Response) =>{
  await CategoryService.deleteCategory(
    req.businessId!,
    getCategoryId(req),
  );

  return res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
}

export const CategoryController = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}
