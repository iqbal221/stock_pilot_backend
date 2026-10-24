
import type { Request, Response } from "express";
import { saleQuerySchema } from "./sale.validation.js";
import type { CreateSaleInput } from "./sale.validation.js";
import { AppError } from "../../utils/Apperror.js";
import { SaleService } from "./sale.service.js";

const getSaleId = (req: Request): string => {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    throw new AppError("Invalid sale ID", 400);
  }

  return id;
};

const createSale = async (req: Request, res: Response) => {
  const sale = await SaleService.createSale(
    req.businessId!,
    req.userId!,
    req.body as CreateSaleInput,
  );

  return res.status(201).json({
    success: true,
    message: "Sale completed successfully",
    data: { sale },
  });
};

const getSales = async (req: Request, res: Response) => {
  const parsed = saleQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.flatten(),
    });
  }

  const result = await SaleService.getSales(
    req.businessId!,
    parsed.data,
  );

  return res.status(200).json({
    success: true,
    results: result.sales.length,
    data: result,
  });
};

const getSaleById = async (req: Request, res: Response) => {
  const sale = await SaleService.getSaleById(
    req.businessId!,
    getSaleId(req),
  );

  return res.status(200).json({
    success: true,
    data: { sale },
  });
};

export const SaleController = {
  createSale,
  getSales,
  getSaleById,
};
