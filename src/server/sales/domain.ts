import { Prisma } from "@prisma/client";
import type { SaleStatus } from "../contracts/v1/sales";

export interface SaleItemLike {
  quantidadeRetirada: number;
  quantidadeDevolvida: number | null;
  precoUnitarioNoMomento: Prisma.Decimal | number;
}

export function deriveSaleStatus(
  status: SaleStatus,
  dueDate: Date,
  now: Date,
): SaleStatus {
  if (status === "ATIVO" && dueDate.getTime() < now.getTime()) {
    return "ATRASADO";
  }

  return status;
}

export function getPendingQuantity(item: {
  quantidadeRetirada: number;
  quantidadeDevolvida: number | null;
}): number {
  return item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
}

export function hasPendingReturns(
  items: Array<{
    quantidadeRetirada: number;
    quantidadeDevolvida: number | null;
  }>,
): boolean {
  return items.some((item) => getPendingQuantity(item) > 0);
}

export function countPendingReturns(
  sales: Array<{
    itens: Array<{
      quantidadeRetirada: number;
      quantidadeDevolvida: number | null;
    }>;
  }>,
): number {
  return sales.reduce((count, sale) => {
    return count + (hasPendingReturns(sale.itens) ? 1 : 0);
  }, 0);
}

export function calculateTotalAmount(items: SaleItemLike[]): Prisma.Decimal {
  return items.reduce((sum, item) => {
    const unitPrice = new Prisma.Decimal(item.precoUnitarioNoMomento);
    const usedQuantity = getPendingQuantity(item);
    return sum.add(unitPrice.mul(usedQuantity));
  }, new Prisma.Decimal(0));
}

export function appendReturnNote(
  currentNotes: string | null,
  note: string | null | undefined,
): string | null {
  if (!note || note.trim() === "") {
    return currentNotes;
  }

  return `${currentNotes || ""}\n[Devolução] ${note}`.trim();
}
