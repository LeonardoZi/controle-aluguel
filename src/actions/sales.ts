"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";

// Type alias for SaleStatus
type SaleStatus = "ATIVO" | "ATRASADO" | "CONCLUIDO" | "CANCELADO";

// Input type for creating a sale/rental
type CreateSaleItemInput = {
  produtoId: string;
  quantidadeRetirada: number;
  precoUnitarioNoMomento?: number | Decimal;
};

// Get all sales with optional filters
export async function getSales(options?: {
  status?: SaleStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  isOverdue?: boolean;
}) {
  try {
    const { status, customerId, startDate, endDate, isOverdue } = options || {};
    const now = new Date();

    const sales = await prisma.sale.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(startDate || endDate
          ? {
              dataRetirada: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        // Filter for overdue sales
        ...(isOverdue
          ? {
              dataDevolucaoPrevista: { lt: now },
              status: { in: ["ATIVO", "ATRASADO"] },
            }
          : {}),
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
      orderBy: { dataRetirada: "desc" },
    });

    // Serialize Decimal and Date objects
    const serializedSales = sales.map((sale: any) => ({
      ...sale,
      totalAmount: sale.totalAmount ? Number(sale.totalAmount) : null,
      dataRetirada: sale.dataRetirada.toISOString(),
      dataDevolucaoPrevista: sale.dataDevolucaoPrevista.toISOString(),
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      itens: sale.itens.map((item: any) => ({
        ...item,
        precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
        produto: {
          ...item.produto,
          precoUnitario: Number(item.produto.precoUnitario),
          createdAt: item.produto.createdAt.toISOString(),
          updatedAt: item.produto.updatedAt.toISOString(),
        },
      })),
      customer: {
        ...sale.customer,
        createdAt: sale.customer.createdAt.toISOString(),
        updatedAt: sale.customer.updatedAt.toISOString(),
      },
      user: sale.user,
    }));

    return { sales: serializedSales };
  } catch (error) {
    console.error("Error fetching sales:", error);
    return { error: "Failed to fetch sales" };
  }
}

// Get a single sale by ID
export async function getSaleById(id: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
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

    if (!sale) {
      return { error: "Sale not found" };
    }

    // Serialize objects
    const serializedSale = {
      ...sale,
      totalAmount: sale.totalAmount ? Number(sale.totalAmount) : null,
      dataRetirada: sale.dataRetirada.toISOString(),
      dataDevolucaoPrevista: sale.dataDevolucaoPrevista.toISOString(),
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      itens: sale.itens.map((item: any) => ({
        ...item,
        precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
        produto: {
          ...item.produto,
          precoUnitario: Number(item.produto.precoUnitario),
          createdAt: item.produto.createdAt.toISOString(),
          updatedAt: item.produto.updatedAt.toISOString(),
        },
      })),
      customer: {
        ...sale.customer,
        createdAt: sale.customer.createdAt.toISOString(),
        updatedAt: sale.customer.updatedAt.toISOString(),
      },
    };

    return { sale: serializedSale };
  } catch (error) {
    console.error("Error fetching sale:", error);
    return { error: "Failed to fetch sale" };
  }
}

// Create a new sale/rental
export async function createSale(data: {
  customerId: string;
  userId: string;
  dataDevolucaoPrevista: Date | string;
  notes?: string;
  items: CreateSaleItemInput[];
}) {
  try {
    // Validate items
    if (!data.items.length) {
      return { error: "A venda precisa ter pelo menos um item" };
    }

    // Fetch all products for validation
    const productIds = data.items.map((item) => item.produtoId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Verify stock availability
    for (const item of data.items) {
      const product = products.find((p: any) => p.id === item.produtoId);
      if (!product) {
        return { error: `Produto com ID ${item.produtoId} não encontrado` };
      }

      if (product.currentStock < item.quantidadeRetirada) {
        return {
          error: `Estoque insuficiente para o produto: ${product.name}. Disponível: ${product.currentStock}, Solicitado: ${item.quantidadeRetirada}`,
        };
      }
    }

    // Calculate total amount
    const itemsWithPrices = data.items.map((item) => {
      const product = products.find((p: any) => p.id === item.produtoId);
      const precoUnitario = item.precoUnitarioNoMomento
        ? new Decimal(item.precoUnitarioNoMomento.toString())
        : product!.precoUnitario;

      return {
        ...item,
        precoUnitarioNoMomento: precoUnitario,
        subtotal: precoUnitario.mul(item.quantidadeRetirada),
      };
    });

    const totalAmount = itemsWithPrices.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Decimal(0)
    );

    // Create sale in a transaction
    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          customerId: data.customerId,
          userId: data.userId,
          dataRetirada: new Date(),
          dataDevolucaoPrevista: new Date(data.dataDevolucaoPrevista),
          status: "ATIVO",
          totalAmount,
          notes: data.notes,
          itens: {
            create: itemsWithPrices.map((item) => ({
              produtoId: item.produtoId,
              quantidadeRetirada: item.quantidadeRetirada,
              quantidadeDevolvida: 0,
              precoUnitarioNoMomento: item.precoUnitarioNoMomento,
            })),
          },
        },
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

      // Update product stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.produtoId },
          data: { currentStock: { decrement: item.quantidadeRetirada } },
        });
      }

      return newSale;
    });

    // Serialize the sale object
    const serializedSale = {
      ...sale,
      totalAmount: sale.totalAmount ? Number(sale.totalAmount) : null,
      dataRetirada: sale.dataRetirada.toISOString(),
      dataDevolucaoPrevista: sale.dataDevolucaoPrevista.toISOString(),
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      itens: sale.itens.map((item: any) => ({
        ...item,
        precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
        produto: {
          ...item.produto,
          precoUnitario: Number(item.produto.precoUnitario),
          createdAt: item.produto.createdAt.toISOString(),
          updatedAt: item.produto.updatedAt.toISOString(),
        },
      })),
      customer: {
        ...sale.customer,
        createdAt: sale.customer.createdAt.toISOString(),
        updatedAt: sale.customer.updatedAt.toISOString(),
      },
    };

    revalidatePath("/sales");
    return { sale: serializedSale };
  } catch (error) {
    console.error("Error creating sale:", error);
    return { error: "Falha ao criar venda" };
  }
}

// Process product return
export async function processReturn(data: {
  saleId: string;
  userId: string;
  items: {
    itemId: string;
    quantidadeDevolvida: number;
  }[];
  notes?: string;
}) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: {
        itens: {
          include: {
            produto: true,
          },
        },
      },
    });

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    if (sale.status === "CONCLUIDO" || sale.status === "CANCELADO") {
      return { error: "Não é possível processar devolução para esta venda" };
    }

    // Validate return items
    for (const returnItem of data.items) {
      const saleItem = sale.itens.find((item: any) => item.id === returnItem.itemId);
      if (!saleItem) {
        return { error: `Item ${returnItem.itemId} não encontrado na venda` };
      }

      const currentlyReturned = saleItem.quantidadeDevolvida || 0;
      const totalReturned = currentlyReturned + returnItem.quantidadeDevolvida;

      if (totalReturned > saleItem.quantidadeRetirada) {
        return {
          error: `Quantidade devolvida excede a quantidade retirada para o produto ${saleItem.produto.name}`,
        };
      }
    }

    // Process return in a transaction
    const updatedSale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update each item with returned quantity
      for (const returnItem of data.items) {
        const saleItem = sale.itens.find((item: any) => item.id === returnItem.itemId);
        if (!saleItem) continue;

        await tx.itensVenda.update({
          where: { id: returnItem.itemId },
          data: {
            quantidadeDevolvida: {
              increment: returnItem.quantidadeDevolvida,
            },
          },
        });

        // Return products to stock
        await tx.product.update({
          where: { id: saleItem.produtoId },
          data: {
            currentStock: { increment: returnItem.quantidadeDevolvida },
          },
        });
      }

      // Fetch updated items to recalculate total
      const updatedItems = await tx.itensVenda.findMany({
        where: { saleId: data.saleId },
      });

      // Calculate new total based on actual usage (retirada - devolvida)
      const newTotal = updatedItems.reduce((sum: Decimal, item: any) => {
        const quantidadeUsada =
          item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
        const itemTotal = new Decimal(item.precoUnitarioNoMomento).mul(
          quantidadeUsada
        );
        return sum.add(itemTotal);
      }, new Decimal(0));

      // Check if all items are fully returned
      const allReturned = updatedItems.every(
        (item: any) => item.quantidadeDevolvida === item.quantidadeRetirada
      );

      // Update sale status and total
      const updatedSale = await tx.sale.update({
        where: { id: data.saleId },
        data: {
          totalAmount: newTotal,
          status: allReturned ? "CONCLUIDO" : sale.status,
          notes: data.notes
            ? `${sale.notes || ""}\n[Devolução] ${data.notes}`.trim()
            : sale.notes,
        },
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

      return updatedSale;
    });

    // Serialize the updated sale
    const serializedSale = {
      ...updatedSale,
      totalAmount: updatedSale.totalAmount ? Number(updatedSale.totalAmount) : null,
      dataRetirada: updatedSale.dataRetirada.toISOString(),
      dataDevolucaoPrevista: updatedSale.dataDevolucaoPrevista.toISOString(),
      createdAt: updatedSale.createdAt.toISOString(),
      updatedAt: updatedSale.updatedAt.toISOString(),
      itens: updatedSale.itens.map((item: any) => ({
        ...item,
        precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
        produto: {
          ...item.produto,
          precoUnitario: Number(item.produto.precoUnitario),
          createdAt: item.produto.createdAt.toISOString(),
          updatedAt: item.produto.updatedAt.toISOString(),
        },
      })),
      customer: {
        ...updatedSale.customer,
        createdAt: updatedSale.customer.createdAt.toISOString(),
        updatedAt: updatedSale.customer.updatedAt.toISOString(),
      },
    };

    revalidatePath("/sales");
    revalidatePath(`/sales/${data.saleId}`);

    return { sale: serializedSale };
  } catch (error) {
    console.error("Error processing return:", error);
    return { error: "Falha ao processar devolução" };
  }
}

// Cancel a sale
export async function cancelSale(id: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    if (sale.status === "CANCELADO") {
      return { error: "Venda já está cancelada" };
    }

    if (sale.status === "CONCLUIDO") {
      return { error: "Não é possível cancelar uma venda concluída" };
    }

    // Cancel sale and return all products to stock
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update sale status
      await tx.sale.update({
        where: { id },
        data: { status: "CANCELADO", totalAmount: new Decimal(0) },
      });

      // Return all unreturned products to stock
      for (const item of sale.itens) {
        const quantidadeNaoDevolvida =
          item.quantidadeRetirada - (item.quantidadeDevolvida || 0);

        if (quantidadeNaoDevolvida > 0) {
          await tx.product.update({
            where: { id: item.produtoId },
            data: { currentStock: { increment: quantidadeNaoDevolvida } },
          });

          // Mark item as fully returned
          await tx.itensVenda.update({
            where: { id: item.id },
            data: { quantidadeDevolvida: item.quantidadeRetirada },
          });
        }
      }
    });

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error canceling sale:", error);
    return { error: "Falha ao cancelar venda" };
  }
}

// Update overdue sales status (should be run periodically)
export async function updateOverdueSales() {
  try {
    const now = new Date();

    const result = await prisma.sale.updateMany({
      where: {
        dataDevolucaoPrevista: { lt: now },
        status: "ATIVO",
      },
      data: {
        status: "ATRASADO",
      },
    });

    revalidatePath("/sales");
    return { updated: result.count };
  } catch (error) {
    console.error("Error updating overdue sales:", error);
    return { error: "Falha ao atualizar vendas atrasadas" };
  }
}

// Complete a sale manually (mark as finished)
export async function completeSale(id: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    if (sale.status === "CANCELADO") {
      return { error: "Não é possível concluir uma venda cancelada" };
    }

    if (sale.status === "CONCLUIDO") {
      return { error: "Venda já está concluída" };
    }

    // Recalculate total based on actual usage
    const updatedItems = await prisma.itensVenda.findMany({
      where: { saleId: id },
    });

    const finalTotal = updatedItems.reduce((sum: Decimal, item: any) => {
      const quantidadeUsada =
        item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
      const itemTotal = new Decimal(item.precoUnitarioNoMomento).mul(
        quantidadeUsada
      );
      return sum.add(itemTotal);
    }, new Decimal(0));

    await prisma.sale.update({
      where: { id },
      data: {
        status: "CONCLUIDO",
        totalAmount: finalTotal,
      },
    });

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error completing sale:", error);
    return { error: "Falha ao concluir venda" };
  }
}

// Get sales summary/statistics
export async function getSalesSummary(options?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { startDate, endDate } = options || {};

    const whereClause = {
      ...(startDate || endDate
        ? {
            dataRetirada: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [totalSales, activeSales, overdueSales, completedSales, totalRevenue] =
      await Promise.all([
        prisma.sale.count({ where: whereClause }),
        prisma.sale.count({
          where: { ...whereClause, status: "ATIVO" },
        }),
        prisma.sale.count({
          where: {
            ...whereClause,
            status: "ATRASADO",
          },
        }),
        prisma.sale.count({
          where: { ...whereClause, status: "CONCLUIDO" },
        }),
        prisma.sale.aggregate({
          where: { ...whereClause, status: { in: ["ATIVO", "ATRASADO", "CONCLUIDO"] } },
          _sum: { totalAmount: true },
        }),
      ]);

    // Count pending returns (items not fully returned in active/overdue sales)
    const salesWithPendingReturns = await prisma.sale.findMany({
      where: {
        ...whereClause,
        status: { in: ["ATIVO", "ATRASADO"] },
      },
      include: {
        itens: true,
      },
    });

    const pendingReturns = salesWithPendingReturns.reduce((count: number, sale: any) => {
      const hasUnreturnedItems = sale.itens.some(
        (item: any) =>
          (item.quantidadeDevolvida || 0) < item.quantidadeRetirada
      );
      return count + (hasUnreturnedItems ? 1 : 0);
    }, 0);

    return {
      summary: {
        totalSales,
        activeSales,
        overdueSales,
        completedSales,
        totalRevenue: totalRevenue._sum.totalAmount
          ? Number(totalRevenue._sum.totalAmount)
          : 0,
        pendingReturns,
      },
    };
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return { error: "Falha ao buscar resumo de vendas" };
  }
}
