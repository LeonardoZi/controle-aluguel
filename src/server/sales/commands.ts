import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateSaleInput, ProcessReturnInput } from "@/validations/schema";
import {
  appendReturnNote,
  calculateTotalAmount,
  getPendingQuantity,
} from "@/server/sales/domain";
import { toSaleDetailsDto } from "@/server/sales/mappers";
import type { SaleDetailsDto } from "@/server/contracts/v1/sales";

interface AggregatedSaleItem {
  produtoId: string;
  quantidadeRetirada: number;
  precoUnitarioNoMomento?: number;
}

function aggregateSaleItems(
  items: CreateSaleInput["items"],
): AggregatedSaleItem[] {
  const map = new Map<string, AggregatedSaleItem>();

  for (const item of items) {
    const existing = map.get(item.produtoId);

    if (!existing) {
      map.set(item.produtoId, {
        produtoId: item.produtoId,
        quantidadeRetirada: item.quantidadeRetirada,
        precoUnitarioNoMomento: item.precoUnitarioNoMomento,
      });
      continue;
    }

    existing.quantidadeRetirada += item.quantidadeRetirada;

    if (item.precoUnitarioNoMomento !== undefined) {
      existing.precoUnitarioNoMomento = item.precoUnitarioNoMomento;
    }
  }

  return Array.from(map.values());
}

export async function createSaleCommand(
  payload: CreateSaleInput,
): Promise<{ sale?: SaleDetailsDto; error?: string }> {
  if (!payload.items.length) {
    return { error: "A venda precisa ter pelo menos um item" };
  }

  const aggregatedItems = aggregateSaleItems(payload.items);

  try {
    const createdSale = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const productIds = aggregatedItems.map((item) => item.produtoId);

        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        const productsById = new Map(
          products.map((product) => [product.id, product]),
        );

        for (const item of aggregatedItems) {
          const product = productsById.get(item.produtoId);

          if (!product) {
            throw new Error(`Produto com ID ${item.produtoId} não encontrado`);
          }

          const updated = await tx.product.updateMany({
            where: {
              id: item.produtoId,
              currentStock: {
                gte: item.quantidadeRetirada,
              },
            },
            data: {
              currentStock: {
                decrement: item.quantidadeRetirada,
              },
            },
          });

          if (updated.count !== 1) {
            throw new Error(
              `Estoque insuficiente para o produto: ${product.name}. Disponível: ${product.currentStock}, Solicitado: ${item.quantidadeRetirada}`,
            );
          }
        }

        const saleItems = aggregatedItems.map((item) => {
          const product = productsById.get(item.produtoId);
          const unitPrice = item.precoUnitarioNoMomento
            ? new Prisma.Decimal(item.precoUnitarioNoMomento)
            : product!.precoUnitario;

          return {
            produtoId: item.produtoId,
            quantidadeRetirada: item.quantidadeRetirada,
            quantidadeDevolvida: 0,
            precoUnitarioNoMomento: unitPrice,
          };
        });

        const totalAmount = calculateTotalAmount(saleItems);

        return tx.sale.create({
          data: {
            customerId: payload.customerId,
            userId: payload.userId,
            dataRetirada: new Date(),
            dataDevolucaoPrevista: payload.dataDevolucaoPrevista,
            status: "ATIVO",
            totalAmount,
            notes: payload.notes,
            itens: {
              create: saleItems,
            },
          },
          include: {
            customer: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            itens: {
              include: {
                produto: true,
              },
            },
          },
        });
      },
    );

    return {
      sale: toSaleDetailsDto(createdSale),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao criar venda",
    };
  }
}

export async function processReturnCommand(
  payload: ProcessReturnInput,
): Promise<{ sale?: SaleDetailsDto; error?: string }> {
  try {
    const updatedSale = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const sale = await tx.sale.findUnique({
          where: { id: payload.saleId },
          include: {
            itens: {
              include: {
                produto: true,
              },
            },
            customer: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!sale) {
          throw new Error("Venda não encontrada");
        }

        if (sale.status === "CONCLUIDO" || sale.status === "CANCELADO") {
          throw new Error("Não é possível processar devolução para esta venda");
        }

        for (const returnItem of payload.items) {
          const saleItem = sale.itens.find(
            (item) => item.id === returnItem.itemId,
          );

          if (!saleItem) {
            throw new Error(
              `Item ${returnItem.itemId} não encontrado na venda`,
            );
          }

          const currentlyReturned = saleItem.quantidadeDevolvida || 0;
          const totalReturned =
            currentlyReturned + returnItem.quantidadeDevolvida;

          if (totalReturned > saleItem.quantidadeRetirada) {
            throw new Error(
              `Quantidade devolvida excede a quantidade retirada para o produto ${saleItem.produto.name}`,
            );
          }
        }

        for (const returnItem of payload.items) {
          const saleItem = sale.itens.find(
            (item) => item.id === returnItem.itemId,
          );

          if (!saleItem) {
            continue;
          }

          await tx.itensVenda.update({
            where: { id: returnItem.itemId },
            data: {
              quantidadeDevolvida: {
                increment: returnItem.quantidadeDevolvida,
              },
            },
          });

          await tx.product.update({
            where: { id: saleItem.produtoId },
            data: {
              currentStock: {
                increment: returnItem.quantidadeDevolvida,
              },
            },
          });
        }

        const updatedItems = await tx.itensVenda.findMany({
          where: { saleId: payload.saleId },
        });

        const totalAmount = updatedItems.reduce((sum, item) => {
          const usedQty =
            item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
          return sum + usedQty * Number(item.precoUnitarioNoMomento);
        }, 0);

        return tx.sale.update({
          where: { id: payload.saleId },
          data: {
            totalAmount,
            status: "CONCLUIDO",
            notes: appendReturnNote(sale.notes, payload.notes),
          },
          include: {
            customer: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            itens: {
              include: {
                produto: true,
              },
            },
          },
        });
      },
    );

    return {
      sale: toSaleDetailsDto(updatedSale),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao processar devolução",
    };
  }
}

export async function cancelSaleCommand(
  id: string,
): Promise<{ success?: true; error?: string }> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          itens: true,
        },
      });

      if (!sale) {
        throw new Error("Venda não encontrada");
      }

      if (sale.status === "CANCELADO") {
        throw new Error("Venda já está cancelada");
      }

      if (sale.status === "CONCLUIDO") {
        throw new Error("Não é possível cancelar uma venda concluída");
      }

      await tx.sale.update({
        where: { id },
        data: {
          status: "CANCELADO",
          totalAmount: new Prisma.Decimal(0),
        },
      });

      for (const item of sale.itens) {
        const quantityToReturn = getPendingQuantity(item);

        if (quantityToReturn <= 0) {
          continue;
        }

        await tx.product.update({
          where: { id: item.produtoId },
          data: {
            currentStock: {
              increment: quantityToReturn,
            },
          },
        });

        await tx.itensVenda.update({
          where: { id: item.id },
          data: {
            quantidadeDevolvida: item.quantidadeRetirada,
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao cancelar venda",
    };
  }
}

export async function completeSaleCommand(
  id: string,
): Promise<{ success?: true; error?: string }> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sale.findUnique({
        where: { id },
      });

      if (!sale) {
        throw new Error("Venda não encontrada");
      }

      if (sale.status === "CANCELADO") {
        throw new Error("Não é possível concluir uma venda cancelada");
      }

      if (sale.status === "CONCLUIDO") {
        throw new Error("Venda já está concluída");
      }

      const updatedItems = await tx.itensVenda.findMany({
        where: { saleId: id },
      });

      const totalAmount = calculateTotalAmount(updatedItems);

      await tx.sale.update({
        where: { id },
        data: {
          status: "CONCLUIDO",
          totalAmount,
        },
      });
    });

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao concluir venda",
    };
  }
}
