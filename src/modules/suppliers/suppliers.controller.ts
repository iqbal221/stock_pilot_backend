
import type { Request, Response } from "express";
import { AppError } from "../../utils/Apperror";
import { SupplierService } from "./suppliers.service";
import { CreateSupplierInput, supplierQuerySchema, UpdateSupplierInput } from "./suppliers.validation";


const getSupplierId = (req: Request): string => {
  const id = req.params.id;

  if (typeof id !== "string" || id.trim() === "") {
    throw new AppError("Invalid supplier ID", 400);
  }

  return id;
};

const createSupplier = async (req: Request, res: Response) => {
  const supplier = await SupplierService.createSupplier(
    req.businessId!,
    req.body as CreateSupplierInput,
  );

  return res.status(201).json({
    success: true,
    message: "Supplier created successfully",
    data: { supplier },
  });
};

const getSuppliers = async (req: Request, res: Response) => {
  const parsed = supplierQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.flatten(),
    });
  }

  const result = await SupplierService.getSuppliers(
    req.businessId!,
    parsed.data,
  );

  return res.status(200).json({
    success: true,
    results: result.suppliers.length,
    data: result,
  });
};

const getSupplierById = async (req: Request, res: Response) => {
  const supplier = await SupplierService.getSupplierById(
    req.businessId!,
    getSupplierId(req),
  );

  return res.status(200).json({
    success: true,
    data: { supplier },
  });
};

const updateSupplier = async (req: Request, res: Response) => {
  const supplier = await SupplierService.updateSupplier(
    req.businessId!,
    getSupplierId(req),
    req.body as UpdateSupplierInput,
  );

  return res.status(200).json({
    success: true,
    message: "Supplier updated successfully",
    data: { supplier },
  });
};

const deleteSupplier = async (req: Request, res: Response) => {
  await SupplierService.deleteSupplier(
    req.businessId!,
    getSupplierId(req),
  );

  return res.status(200).json({
    success: true,
    message: "Supplier deleted successfully",
  });
};

export const SupplierController = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};
