
import { Prisma, PurchaseStatus } from "@prisma/client";
import type { PaymentStatus } from "@prisma/client";

import type { CreatePurchasePaymentInput } from "./purchase_payment.validation";
import { AppError } from "../../utils/Apperror";
import { prisma } from "../../config/prisma";

const createPurchasePayment = async (
  businessId: string,
  userId: string,
  input: CreatePurchasePaymentInput,
) => {
  const amount = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: {
        id: input.purchaseId,
        businessId,
      },
      select: {
        id: true,
        total: true,
        amountPaid: true,
        status: true,
      },
    });

    if (!purchase) {
      throw new AppError("Purchase not found", 404);
    }

    if (
      purchase.status === PurchaseStatus.CANCELLED ||
      purchase.status === PurchaseStatus.DRAFT
    ) {
      throw new AppError(
        "Payments cannot be recorded for draft or cancelled purchases",
        400,
      );
    }

    const balance = purchase.total.minus(purchase.amountPaid);

    if (balance.lte(0)) {
      throw new AppError("This purchase is already fully paid", 400);
    }

    if (amount.gt(balance)) {
      throw new AppError(
        `Payment exceeds the outstanding balance of ${balance.toFixed(2)}`,
        400,
      );
    }

    const updatedAmountPaid = purchase.amountPaid.plus(amount);

    const paymentStatus: PaymentStatus = updatedAmountPaid.gte(purchase.total)
      ? "PAID"
      : "PARTIAL";

    const payment = await tx.purchasePayment.create({
      data: {
        businessId,
        purchaseId: purchase.id,
        createdById: userId,
        amount,
        method: input.method,
        referenceNumber: input.referenceNumber || null,
        note: input.note || null,
        ...(input.paidAt ? { paidAt: input.paidAt } : {}),
      },
    });

    await tx.purchase.update({
      where: {
        id: purchase.id,
      },
      data: {
        amountPaid: updatedAmountPaid,
        paymentStatus,
      },
    });

    return {
      payment,
      purchase: {
        id: purchase.id,
        total: purchase.total,
        amountPaid: updatedAmountPaid,
        balance: purchase.total.minus(updatedAmountPaid),
        paymentStatus,
      },
    };
  });
};

const listPurchasePayments = async (
  businessId: string,
  purchaseId: string,
) => {
  const purchase = await prisma.purchase.findFirst({
    where: {
      id: purchaseId,
      businessId,
    },
    select: {
      id: true,
    },
  });

  if (!purchase) {
    throw new AppError("Purchase not found", 404);
  }

  return prisma.purchasePayment.findMany({
    where: {
      purchaseId: purchase.id,
      businessId,
    },
    orderBy: {
      paidAt: "desc",
    },
  });
};

export const PurchasePaymentService = {
  createPurchasePayment,
  listPurchasePayments,
};
