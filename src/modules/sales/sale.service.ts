
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type {
  CreateSaleInput,
  SaleQuery,
} from "./sale.validation.js";
import { AppError } from "../../utils/Apperror.js";

const createSale = async (
  businessId: string,
  userId: string,
  input: CreateSaleInput,
) => {
  const productIds = [
    ...new Set(input.items.map((item) => item.productId)),
  ];

  if (productIds.length !== input.items.length) {
    throw new AppError(
      "Each product can appear only once in a sale",
      400,
    );
  }

  const invoiceNumber = `INV-${Date.now()}-${randomUUID()
    .slice(0, 6)
    .toUpperCase()}`;

  try {
    return await prisma.$transaction(
      async (tx) => {
        if (input.customerId) {
          const customer = await tx.customer.findFirst({
            where: {
              id: input.customerId,
              businessId,
            },
            select: { id: true },
          });

          if (!customer) {
            throw new AppError(
              "Customer not found in this business",
              404,
            );
          }
        }

        const products = await tx.product.findMany({
          where: {
            businessId,
            isActive: true,
            id: { in: productIds },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            costPrice: true,
            sellingPrice: true,
          },
        });

        if (products.length !== productIds.length) {
          throw new AppError(
            "One or more products are unavailable in this business",
            400,
          );
        }

        const productMap = new Map(
          products.map((product) => [product.id, product]),
        );

        const items = input.items.map((inputItem) => {
          const product = productMap.get(inputItem.productId)!;

          const unitPrice = new Prisma.Decimal(product.sellingPrice);
          const unitCost = new Prisma.Decimal(product.costPrice);
          const lineTotal = unitPrice.mul(inputItem.quantity);

          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: inputItem.quantity,
            unitPrice,
            unitCost,
            discount: new Prisma.Decimal(0),
            lineTotal,
          };
        });

        const subtotal = items.reduce(
          (sum, item) => sum.add(item.lineTotal),
          new Prisma.Decimal(0),
        );

        const discount = new Prisma.Decimal(input.discount);
        const tax = new Prisma.Decimal(input.tax);

        if (discount.greaterThan(subtotal)) {
          throw new AppError(
            "Discount cannot exceed the subtotal",
            400,
          );
        }

        const total = subtotal.sub(discount).add(tax);
        const amountPaid = new Prisma.Decimal(input.amountPaid);

        if (amountPaid.greaterThan(total)) {
          throw new AppError(
            "Amount paid cannot exceed the sale total",
            400,
          );
        }

        const paymentStatus =
          amountPaid.greaterThanOrEqualTo(total)
            ? "PAID"
            : amountPaid.greaterThan(0)
              ? "PARTIAL"
              : "UNPAID";

        const sale = await tx.sale.create({
          data: {
            businessId,
            customerId: input.customerId || null,
            createdById: userId,
            invoiceNumber,
            status: "COMPLETED",
            paymentStatus,
            subtotal,
            discount,
            tax,
            total,
            amountPaid,
            notes: input.notes?.trim() || null,
            items: {
              create: items,
            },
          },
          include: {
            customer: true,
            items: true,
          },
        });

        for (const item of items) {
          const result = await tx.product.updateMany({
            where: {
              id: item.productId,
              businessId,
              isActive: true,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (result.count !== 1) {
            throw new AppError(
              `Insufficient stock for ${item.sku}`,
              409,
            );
          }

          await tx.stockMovement.create({
            data: {
              businessId,
              productId: item.productId,
              userId,
              type: "SALE",
              quantity: item.quantity,
              note: `Sale ${invoiceNumber}`,
              referenceId: sale.id,
            },
          });
        }

        return sale;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      throw new AppError(
        "The sale conflicted with another operation. Please retry.",
        409,
      );
    }

    throw error;
  }
};

const getSales = async (
  businessId: string,
  query: SaleQuery,
) => {
  const where = {
    businessId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus
      ? { paymentStatus: query.paymentStatus }
      : {}),
    ...(query.search
      ? {
          OR: [
            {
              invoiceNumber: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              customer: {
                is: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [sales, total] = await prisma.$transaction([
    prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

const getSaleById = async (
  businessId: string,
  saleId: string,
) => {
  const sale = await prisma.sale.findFirst({
    where: {
      id: saleId,
      businessId,
    },
    include: {
      customer: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      items: true,
    },
  });

  if (!sale) {
    throw new AppError("Sale not found", 404);
  }

  return sale;
};

export const SaleService = { createSale, getSales, getSaleById };
