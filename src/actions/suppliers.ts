"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PurchaseStatus } from "@prisma/client";

// Buscar todos os fornecedores
export async function getSuppliers(query?: string) {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              OR: [
                { companyName: { contains: query, mode: "insensitive" } },
                { contactName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { taxId: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { companyName: "asc" },
    });

    return { suppliers };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return { error: "Falha ao buscar fornecedores" };
  }
}

// Buscar um fornecedor pelo ID
export async function getSupplierById(id: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!supplier) {
      return { error: "Fornecedor não encontrado" };
    }

    // Buscar os pedidos deste fornecedor
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      orderBy: { orderDate: "desc" },
      take: 10, // Últimos 10 pedidos
    });

    return { supplier, purchaseOrders };
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return { error: "Falha ao buscar fornecedor" };
  }
}

// Criar um novo fornecedor
export async function createSupplier(data: {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
}) {
  try {
    // Verificar se já existe um fornecedor com este CNPJ
    if (data.taxId) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          taxId: data.taxId,
          isActive: true,
        },
      });

      if (existingSupplier) {
        return { error: "Já existe um fornecedor ativo com este CNPJ" };
      }
    }

    const supplier = await prisma.supplier.create({
      data,
    });

    revalidatePath("/suppliers");
    return { success: true, supplier };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return { error: "Falha ao criar fornecedor" };
  }
}

// Atualizar um fornecedor
export async function updateSupplier(
  id: string,
  data: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    taxId?: string;
    isActive?: boolean;
  }
) {
  try {
    // Verificar se o fornecedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return { error: "Fornecedor não encontrado" };
    }

    // Verificar se está tentando atualizar o CNPJ para um que já existe
    if (data.taxId && data.taxId !== existingSupplier.taxId) {
      const duplicateTaxId = await prisma.supplier.findFirst({
        where: {
          taxId: data.taxId,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateTaxId) {
        return { error: "Já existe outro fornecedor ativo com este CNPJ" };
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return { success: true, supplier };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { error: "Falha ao atualizar fornecedor" };
  }
}

// Desativar um fornecedor (soft delete)
export async function deleteSupplier(id: string) {
  try {
    // Verificar se há produtos ativos deste fornecedor
    const productsCount = await prisma.product.count({
      where: {
        supplierId: id,
        isActive: true,
      },
    });

    if (productsCount > 0) {
      return {
        error: `Este fornecedor está associado a ${productsCount} produtos ativos. Desative os produtos primeiro ou altere o fornecedor.`,
      };
    }

    // Verificar se há pedidos pendentes para este fornecedor
    const pendingOrdersCount = await prisma.purchaseOrder.count({
      where: {
        supplierId: id,
        status: { in: ["PENDING", "APPROVED", "ORDERED"] },
      },
    });

    if (pendingOrdersCount > 0) {
      return {
        error: `Este fornecedor possui ${pendingOrdersCount} pedidos pendentes. Finalize ou cancele os pedidos antes de desativar o fornecedor.`,
      };
    }

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { error: "Falha ao desativar fornecedor" };
  }
}

// Buscar produtos de um fornecedor
export async function getSupplierProducts(id: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        supplierId: id,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return { products };
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    return { error: "Falha ao buscar produtos do fornecedor" };
  }
}

// Buscar pedidos de um fornecedor
export async function getSupplierOrders(id: string, status?: string) {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: id,
        ...(status ? { status: status as PurchaseStatus } : {}),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
    });

    return { orders };
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    return { error: "Falha ao buscar pedidos do fornecedor" };
  }
}
