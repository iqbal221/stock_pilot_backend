
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { PurchasePaymentService } from "./purchase_payment.service";



const createPurchasePayment = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await PurchasePaymentService.createPurchasePayment(
            req.businessId,
            req.userId,
            req.body,
        );

        res.status(201).json({
            success: true,
            message: "Purchase payment recorded successfully",
            data: result,
        });
    },
);

const listPurchasePayments = asyncHandler(
    async (req: Request, res: Response) => {
        const purchaseId = Array.isArray(req.params.purchaseId)
            ? req.params.purchaseId[0]
            : req.params.purchaseId;

        if (!purchaseId) {
            res.status(400).json({
                success: false,
                message: "Purchase ID is required",
            });
            return;
        }

        const payments = await PurchasePaymentService.listPurchasePayments(
            req.businessId,
            purchaseId,
        );

        res.status(200).json({
            success: true,
            data: payments,
        });
    },
);

export const PurchasePayment = {
    createPurchasePayment,
    listPurchasePayments
}
