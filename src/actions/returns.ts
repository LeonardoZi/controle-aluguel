// src/actions/returns.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipo para item de devolução
type ReturnItemInput = {
  saleItemId: string;
  quantity: number;
  reason: string;
};

// Processar uma devolução de produto
export async function processReturn(data: {
  saleId: string;
  userId: string; // Usuário que processa a devolução
  items: ReturnItemInput[];
  notes?: string;
}) {
  try {
    // Buscar a venda e seus itens
    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: { items: true },
    });

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    if (sale.status === "CANCELLED") {
      return { error: "Venda já está cancelada" };
    }

    // Verificar se os itens a serem devolvidos existem na venda e têm quantidade suficiente
    for (const returnItem of data.items) {
      const saleItem = sale.items.find(
        (item) => item.id === returnItem.saleItemId
      );

      if (!saleItem) {
        return {
          error: `Item com ID ${returnItem.saleItemId} não encontrado na venda`,
        };
      }

      if (returnItem.quantity > saleItem.quantity) {
        return {
          error: `Quantidade de devolução excede a quantidade vendida para o item ${saleItem.id}`,
        };
      }
    }

    // Processar a devolução em uma transação
    await prisma.$transaction(async (tx) => {
      // Para cada item a ser devolvido
      for (const returnItem of data.items) {
        // Buscar o item da venda
        const saleItem = sale.items.find(
          (item) => item.id === returnItem.saleItemId
        )!;

        // Buscar o produto relacionado
        const product = await tx.product.findUnique({
          where: { id: saleItem.productId },
        });

        if (!product) {
          throw new Error(
            `Produto com ID ${saleItem.productId} não encontrado`
          );
        }

        // Atualizar o estoque do produto
        await tx.product.update({
          where: { id: saleItem.productId },
          data: { currentStock: { increment: returnItem.quantity } },
        });

        // Registrar movimentação de estoque
        await tx.stockMovement.create({
          data: {
            productId: saleItem.productId,
            quantity: returnItem.quantity, // Entrada de estoque (valor positivo)
            type: "RETURN",
            reference: sale.id,
            userId: data.userId,
            notes: `Devolução - Venda #${sale.id} - Motivo: ${returnItem.reason}`,
          },
        });
      }

      // Atualizar o status da venda se todos os itens foram devolvidos
      const allItemsReturned = sale.items.every((saleItem) => {
        const returnItem = data.items.find(
          (item) => item.saleItemId === saleItem.id
        );
        return returnItem && returnItem.quantity === saleItem.quantity;
      });

      if (allItemsReturned) {
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: "CANCELLED",
            notes: sale.notes
              ? `${sale.notes}\nDevolução completa: ${
                  data.notes || "Sem observações"
                }`
              : `Devolução completa: ${data.notes || "Sem observações"}`,
          },
        });
      } else {
        // Se for devolução parcial, apenas atualizar as notas
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            notes: sale.notes
              ? `${sale.notes}\nDevolução parcial: ${
                  data.notes || "Sem observações"
                }`
              : `Devolução parcial: ${data.notes || "Sem observações"}`,
          },
        });
      }
    });

    revalidatePath("/sales");
    revalidatePath(`/sales/${data.saleId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao processar devolução:", error);
    return { error: "Falha ao processar devolução" };
  }
}
