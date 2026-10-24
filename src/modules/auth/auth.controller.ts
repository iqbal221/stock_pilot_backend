
import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import type {
  LoginInput,
  RegisterInput,
} from "./auth.validation.js";
import { AppError } from "../../utils/Apperror.js";


export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body as RegisterInput);

  return res.status(201).json({
    success: true,
    message: "Account and business created successfully",
    data: result,
  });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInput);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
}

export async function me(req: Request, res: Response) {
  if (!req.userId) {
    throw new AppError("Authentication required", 401);
  }

  const result = await authService.getMe(req.userId);

  return res.status(200).json({
    success: true,
    data: result,
  });
}
