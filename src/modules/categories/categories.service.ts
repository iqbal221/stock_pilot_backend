
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/Apperror.js";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.validation.js";



function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

const createCategory = async(
  businessId: string,
  input: CreateCategoryInput,
)=> {
  try {
    return await prisma.category.create({
      data: {
        businessId,
        name: input.name,
        description: input.description,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        "A category with this name already exists",
        409,
      );
    }

    throw error;
  }
}

const getCategories = async (businessId: string) =>{
  return prisma.category.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

const getCategoryById = async (
  businessId: string,
  categoryId: string,
) =>{
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      businessId,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}

const updateCategory = async(
  businessId: string,
  categoryId: string,
  input: UpdateCategoryInput,
)=> {
  const existing = await prisma.category.findFirst({
    where: {
      id: categoryId,
      businessId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Category not found", 404);
  }

  try {
    return await prisma.category.update({
      where: { id: existing.id },
      data: input,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        "A category with this name already exists",
        409,
      );
    }

    throw error;
  }
}

const deleteCategory = async (
  businessId: string,
  categoryId: string,
) =>{
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      businessId,
    },
    select: { id: true },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Product.categoryId is optional and uses onDelete: SetNull.
  await prisma.category.delete({
    where: { id: category.id },
  });

  return { id: category.id };
}

export const CategoryService = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}
