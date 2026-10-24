
import type { Request, Response } from "express";
import { ProductService } from "./products.service";
import { CreateProductInput, UpdateProductInput } from "./products.validation";



export async function createProduct(req: Request, res: Response) {
  const Product = await ProductService.createProduct(
    req.businessId!,
    req.body as CreateProductInput,
  );

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { Product },
  });
}

export async function getProducts(_req: Request, res: Response) {
  const categories = await ProductService.getProducts(
    _req.businessId!,
  );

  return res.status(200).json({
    success: true,
    results: products.length,
    data: { categories },
  });
}

export async function getProductById(req: Request, res: Response) {
  const Product = await ProductService.getProductById(
    req.businessId!,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    data: { Product },
  });
}

export async function updateProduct(req: Request, res: Response) {
  const Product = await ProductService.updateProduct(
    req.businessId!,
    req.params.id,
    req.body as UpdateProductInput,
  );

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: { Product },
  });
}

export async function deleteProduct(req: Request, res: Response) {
  await ProductService.deactivateProduct(
    req.businessId!,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
}

export const ProductController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
}
