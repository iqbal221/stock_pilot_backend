
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/Apperror.js";
import { CreateSupplierInput, SupplierQuery, UpdateSupplierInput } from "./suppliers.validation.js";



  const createSupplier=async(
    businessId: string,
    input: CreateSupplierInput,
  )=>{
    return prisma.supplier.create({
      data: {
        businessId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        contactPerson: input.contactPerson || null,
      },
    });
  }

  const getSuppliers = async(
    businessId: string,
    query: SupplierQuery,
  )=> {
    const where = {
      businessId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } },
              { phone: { contains: query.search, mode: "insensitive" as const } },
              {
                contactPerson: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  const getSupplierById = async(
    businessId: string,
    supplierId: string,
  ) =>{
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    return supplier;
  }

  const updateSupplier = async(
    businessId: string,
    supplierId: string,
    input: UpdateSupplierInput,
  ) =>{
    const existing = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("Supplier not found", 404);
    }

    return prisma.supplier.update({
      where: { id: existing.id },
      data: input,
    });
  }

  const deleteSupplier = async(
    businessId: string,
    supplierId: string,
  ) =>{
    const existing = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("Supplier not found", 404);
    }

    // The Product.supplier relation must use onDelete: SetNull.
    // This removes the supplier without deleting its products.
    await prisma.supplier.delete({
      where: { id: existing.id },
    });
  }

export const SupplierService = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
}
