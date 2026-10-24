
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/Apperror.js";
import { AdjustmentInput, ReceiptInput, StockMovementQuery } from "./stock_movement.validatin.js";

export class StockMovementService {
  private static async findProduct(
    businessId: string,
    productId: string,
  ) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
    });

    if (!product) {
      throw new AppError("Active product not found in this business", 404);
    }

    return product;
  }

  static async adjustStock(
    businessId: string,
    userId: string,
    input: AdjustmentInput,
  ) {
    await this.findProduct(businessId, input.productId);

    const isIncrease = input.direction === "IN";
    const movementType = isIncrease ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";

    return prisma.$transaction(async (tx) => {
      if (isIncrease) {
        await tx.product.update({
          where: { id: input.productId },
          data: { stock: { increment: input.quantity } },
        });
      } else {
        const result = await tx.product.updateMany({
          where: {
            id: input.productId,
            businessId,
            isActive: true,
            stock: { gte: input.quantity },
          },
          data: { stock: { decrement: input.quantity } },
        });

        if (result.count !== 1) {
          throw new AppError("Insufficient stock for this adjustment", 409);
        }
      }

      const movement = await tx.stockMovement.create({
        data: {
          businessId,
          productId: input.productId,
          userId,
          type: movementType,
          quantity: input.quantity,
          note: input.note?.trim() || null,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true },
          },
        },
      });

      return movement;
    });
  }

  static async receiveStock(
    businessId: string,
    userId: string,
    input: ReceiptInput,
  ) {
    await this.findProduct(businessId, input.productId);

    return prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: {
          id: input.productId,
          businessId,
          isActive: true,
        },
        data: { stock: { increment: input.quantity } },
      });

      return tx.stockMovement.create({
        data: {
          businessId,
          productId: input.productId,
          userId,
          type: "PURCHASE",
          quantity: input.quantity,
          note: input.note?.trim() || "Stock received",
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true },
          },
        },
      });
    });
  }

  static async getMovements(
    businessId: string,
    query: StockMovementQuery,
  ) {
    const where = {
      businessId,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [movements, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      movements,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async getMovementById(
    businessId: string,
    movementId: string,
  ) {
    const movement = await prisma.stockMovement.findFirst({
      where: {
        id: movementId,
        businessId,
      },
      include: {
        product: true,
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!movement) {
      throw new AppError("Stock movement not found", 404);
    }

    return movement;
  }

  static async getSummary(businessId: string) {
    const [productCount, stockTotals, lowStockCount, movementCount] =
      await Promise.all([
        prisma.product.count({
          where: { businessId, isActive: true },
        }),
        prisma.product.aggregate({
          where: { businessId, isActive: true },
          _sum: { stock: true },
        }),
        prisma.product.count({
          where: {
            businessId,
            isActive: true,
            stock: { lte: 5 },
          },
        }),
        prisma.stockMovement.count({ where: { businessId } }),
      ]);

    return {
      productCount,
      totalUnits: stockTotals._sum.stock ?? 0,
      lowStockCount,
      movementCount,
    };
  }
}
