
import type { Request, Response } from "express";
import { AppError } from "../../utils/Apperror";
import { StockMovementService } from "./stock_movement.service";
import { AdjustmentInput, ReceiptInput, stockMovementQuerySchema } from "./stock_movement.validatin";


const getMovementId = (req: Request): string => {
  const id = req.params.id;

  if (typeof id !== "string" || id.trim() === "") {
    throw new AppError("Invalid stock movement ID", 400);
  }

  return id;
};

const adjustStock = async (req: Request, res: Response) => {
  const movement = await StockMovementService.adjustStock(
    req.businessId!,
    req.userId!,
    req.body as AdjustmentInput,
  );

  return res.status(201).json({
    success: true,
    message: "Stock adjusted successfully",
    data: { movement },
  });
};

const receiveStock = async (req: Request, res: Response) => {
  const movement = await StockMovementService.receiveStock(
    req.businessId!,
    req.userId!,
    req.body as ReceiptInput,
  );

  return res.status(201).json({
    success: true,
    message: "Stock received successfully",
    data: { movement },
  });
};

const getMovements = async (req: Request, res: Response) => {
  const parsed = stockMovementQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsed.error.flatten(),
    });
  }

  const result = await StockMovementService.getMovements(
    req.businessId!,
    parsed.data,
  );

  return res.status(200).json({
    success: true,
    results: result.movements.length,
    data: result,
  });
};

const getMovementById = async (req: Request, res: Response) => {
  const movement = await StockMovementService.getMovementById(
    req.businessId!,
    getMovementId(req),
  );

  return res.status(200).json({
    success: true,
    data: { movement },
  });
};

const getSummary = async (req: Request, res: Response) => {
  const summary = await StockMovementService.getSummary(req.businessId!);

  return res.status(200).json({
    success: true,
    data: { summary },
  });
};

export const StockMovementController = {
  adjustStock,
  receiveStock,
  getMovements,
  getMovementById,
  getSummary,
};
