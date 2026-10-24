
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";

import type {
  LoginInput,
  RegisterInput,
} from "./auth.validation.js";
import { AppError } from "../../utils/Apperror.js";

function createAccessToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 bytes of random secret material",
    );
  }

  return jwt.sign({}, secret, {
    subject: userId,
    expiresIn: "1d",
    issuer: "stockpilot-api",
    audience: "stockpilot-client",
  });
}

export async function register(input: RegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const businessName = input.businessName.trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const slugBase =
    businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45) || "business";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName,
          slug: `${slugBase}-${randomUUID().slice(0, 8)}`,
          memberships: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          currency: true,
        },
      });

      return { user, business };
    });

    return {
      token: createAccessToken(result.user.id),
      user: result.user,
      business: result.business,
    };
  } catch (error) {
    // Handle a concurrent registration with the same email.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError("An account with this email already exists", 409);
    }

    throw error;
  }
}

export async function login(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        select: {
          role: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(input.password, user.passwordHash))
  ) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    token: createAccessToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    businesses: user.memberships.map((membership) => ({
      ...membership.business,
      role: membership.role,
    })),
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      memberships: {
        select: {
          role: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("User account is unavailable", 401);
  }

  return { user };
}
