"use server";

import { revalidatePath } from "next/cache";
import {
  createSaleSchema,
  processReturnSchema,
  type CreateSaleInput,
  type ProcessReturnInput,
} from "@/validations/schema";
import {
  cancelSaleCommand,
  completeSaleCommand,
  createSaleCommand,
  processReturnCommand,
} from "@/server/sales/commands";
import {
  findSaleById,
  getSalesSummaryReadModel,
  listSales,
} from "@/server/sales/queries";
import type { SaleStatus } from "@/server/contracts/v1/sales";

export async function getSales(options?: {
  status?: SaleStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  isOverdue?: boolean;
}) {
  try {
    const sales = await listSales(options || {});
    return { sales };
  } catch {
    return { error: "Falha ao buscar vendas" };
  }
}

export async function getSaleById(id: string) {
  try {
    const sale = await findSaleById(id);

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    return { sale };
  } catch {
    return { error: "Falha ao buscar venda" };
  }
}

export async function createSale(data: CreateSaleInput) {
  const parsed = createSaleSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
  }

  const result = await createSaleCommand(parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { sale: result.sale };
}

export async function processReturn(data: ProcessReturnInput) {
  const parsed = processReturnSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
  }

  const result = await processReturnCommand(parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${parsed.data.saleId}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { sale: result.sale };
}

export async function cancelSale(id: string) {
  const result = await cancelSaleCommand(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}

export async function completeSale(id: string) {
  const result = await completeSaleCommand(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}

export async function getSalesSummary(options?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const summary = await getSalesSummaryReadModel(options || {});
    return { summary };
  } catch {
    return { error: "Falha ao buscar resumo de vendas" };
  }
}
