"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "@/validations/schema";
import {
  createCustomerCommand,
  deactivateCustomerCommand,
  updateCustomerCommand,
} from "@/server/customers/commands";
import {
  findCustomerById,
  listCustomerSales,
  listCustomers,
} from "@/server/customers/queries";

export async function getCustomers(query?: string) {
  try {
    const customers = await listCustomers(query);
    return { customers };
  } catch {
    return { error: "Falha ao buscar clientes" };
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await findCustomerById(id);

    if (!customer) {
      return { error: "Cliente não encontrado" };
    }

    return { customer };
  } catch {
    return { error: "Falha ao buscar cliente" };
  }
}

export async function createCustomer(data: CreateCustomerInput) {
  const parsed = createCustomerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
  }

  const result = await createCustomerCommand(parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/customers");
  revalidatePath("/");
  return { customer: result.customer };
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const parsed = updateCustomerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
  }

  const result = await updateCustomerCommand(id, parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  revalidatePath("/");
  return { customer: result.customer };
}

export async function deleteCustomer(id: string) {
  const result = await deactivateCustomerCommand(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/customers");
  revalidatePath("/");
  return { success: true };
}

export async function getCustomerSales(customerId: string) {
  try {
    const sales = await listCustomerSales(customerId);
    return { sales };
  } catch {
    return { error: "Falha ao buscar vendas do cliente" };
  }
}
