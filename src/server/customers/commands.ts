import { prisma } from "@/lib/prisma";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/validations/schema";
import type { CustomerDto } from "@/server/contracts/v1/customers";
import { toCustomerDto } from "@/server/customers/mappers";

export async function createCustomerCommand(
  payload: CreateCustomerInput,
): Promise<{ customer?: CustomerDto; error?: string }> {
  try {
    const customer = await prisma.customer.create({
      data: payload,
    });

    return {
      customer: toCustomerDto(customer),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao criar cliente",
    };
  }
}

export async function updateCustomerCommand(
  id: string,
  payload: UpdateCustomerInput,
): Promise<{ customer?: CustomerDto; error?: string }> {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: payload,
    });

    return {
      customer: toCustomerDto(customer),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao atualizar cliente",
    };
  }
}

export async function deactivateCustomerCommand(
  id: string,
): Promise<{ success?: true; error?: string }> {
  try {
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao deletar cliente",
    };
  }
}
