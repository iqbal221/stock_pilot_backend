
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export async function requireBusiness(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const businessId = req.header("x-business-id");

  if (!businessId) {
    return res.status(400).json({
      success: false,
      message: "The x-business-id header is required",
    });
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_businessId: {
          userId: req.userId,
          businessId,
        },
      },
      select: {
        businessId: true,
        user: { select: { isActive: true } },
      },
    });

    if (!membership || !membership.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this business",
      });
    }

    req.businessId = membership.businessId;
    next();
  } catch (error) {
    next(error);
  }
}
