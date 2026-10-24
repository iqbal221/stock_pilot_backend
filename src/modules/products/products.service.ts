
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/Apperror.js";
import { CreateProductInput, ProductQuery, UpdateProductInput } from "./products.validation.js";


function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

const validateRelations =async(
  businessId: string,
  input: {
    categoryId?: string | null;
    supplierId?: string | null;
  },
)=> {
  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        businessId,
      },
      select: { id: true },
    });

    if (!category) {
      throw new AppError(
        "Category not found in this business",
        400,
      );
    }
  }

  if (input.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: input.supplierId,
        businessId,
      },
      select: { id: true },
    });

    if (!supplier) {
      throw new AppError(
        "Supplier not found in this business",
        400,
      );
    }
  }
}

const createProduct =async(
  businessId: string,
  input: CreateProductInput,
) =>{
  await validateRelations(businessId, input);

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          businessId,
          name: input.name,
          sku: input.sku,
          description: input.description,
          categoryId: input.categoryId,
          supplierId: input.supplierId,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          stock: input.initialStock,
          minStock: input.minStock,
        },
        include: {
          category: true,
          supplier: true,
        },
      });

      if (input.initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            businessId,
            productId: product.id,
            type: "OPENING",
            quantity: input.initialStock,
            note: "Initial stock when product was created",
          },
        });
      }

      return product;
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        "A product with this SKU already exists in this business",
        409,
      );
    }

    throw error;
  }
}

const getProducts =async(
  businessId: string,
  query: ProductQuery,
) =>{
  const {
    page,
    limit,
    search,
    categoryId,
    supplierId,
    isActive,
  } = query;

  const where = {
    businessId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(isActive !== undefined
      ? { isActive: isActive === "true" }
      : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const getProductById =async(
  businessId: string,
  productId: string,
)=> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId,
    },
    include: {
      category: true,
      supplier: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
}

const updateProduct =async(
  businessId: string,
  productId: string,
  input: UpdateProductInput,
)=> {
  const existing = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  await validateRelations(businessId, input);

  try {
    return await prisma.product.update({
      where: { id: existing.id },
      data: input,
      include: {
        category: true,
        supplier: true,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        "A product with this SKU already exists in this business",
        409,
      );
    }

    throw error;
  }
}

const deactivateProduct =async(
  businessId: string,
  productId: string,
) =>{
  const existing = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId,
    },
    select: { id: true, isActive: true },
  });

  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  return prisma.product.update({
    where: { id: existing.id },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      sku: true,
      isActive: true,
    },
  });
}

export const ProductService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct
}
