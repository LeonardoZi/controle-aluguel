"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CustomerType } from "@prisma/client";

export async function getCustomers(query?: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    return { customers };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { error: "Falha ao buscar clientes" };
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return { error: "Cliente não encontrado" };
    }

    return { customer };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return { error: "Falha ao buscar cliente" };
  }
}

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
  type: CustomerType;
}) {
  try {
    const customer = await prisma.customer.create({
      data,
    });

    revalidatePath("/customers");
    return { customer };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { error: "Falha ao criar cliente" };
  }
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    taxId?: string;
    type?: CustomerType;
    isActive?: boolean;
  }
) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { customer };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { error: "Falha ao atualizar cliente" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Soft delete - just mark as inactive
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { error: "Falha ao deletar cliente" };
  }
}

export async function getCustomerSales(customerId: string) {
  try {
    const sales = await prisma.sale.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    return { sales };
  } catch (error) {
    console.error("Error fetching customer sales:", error);
    return { error: "Falha ao buscar vendas do cliente" };
  }
}
