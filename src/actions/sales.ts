"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod, SaleStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Tipo para item de venda (na criação)
type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number | Decimal;
  discount?: number | Decimal;
};

// Buscar todas as vendas
export async function getSales(options?: {
  status?: SaleStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { status, customerId, startDate, endDate } = options || {};

    const sales = await prisma.sale.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(startDate || endDate
          ? {
              saleDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
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
    console.error("Error fetching sales:", error);
    return { error: "Falha ao buscar vendas" };
  }
}

// Buscar uma venda pelo ID
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    return { sale };
  } catch (error) {
    console.error("Error fetching sale:", error);
    return { error: "Falha ao buscar venda" };
  }
}

// Criar uma nova venda
export async function createSale(data: {
  customerId?: string;
  userId: string;
  paymentMethod: PaymentMethod;
  discount?: number | Decimal;
  notes?: string;
  items: SaleItemInput[];
}) {
  try {
    // Validar se há itens
    if (!data.items.length) {
      return { error: "A venda precisa ter pelo menos um item" };
    }

    // Buscar todos os produtos para validação
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Verificar estoque
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { error: `Produto com ID ${item.productId} não encontrado` };
      }

      if (product.currentStock < item.quantity) {
        return {
          error: `Estoque insuficiente para o produto: ${product.name}`,
        };
      }
    }

    // Calcular valores da venda
    const itemsWithTotal = data.items.map((item) => {
      const unitPrice = new Decimal(item.unitPrice.toString());
      const discount = item.discount
        ? new Decimal(item.discount.toString())
        : new Decimal(0);
      const total = unitPrice.mul(item.quantity).sub(discount);

      return {
        ...item,
        total,
      };
    });

    const totalAmount = itemsWithTotal.reduce(
      (sum, item) => sum.add(item.total),
      new Decimal(0)
    );

    const discount = data.discount
      ? new Decimal(data.discount.toString())
      : new Decimal(0);
    const finalTotal = totalAmount.sub(discount);

    // Criar a venda em uma transação
    const sale = await prisma.$transaction(async (tx) => {
      // Criar a venda
      const newSale = await tx.sale.create({
        data: {
          customerId: data.customerId,
          userId: data.userId,
          saleDate: new Date(),
          status: "COMPLETED",
          paymentMethod: data.paymentMethod,
          totalAmount: finalTotal,
          discount,
          notes: data.notes,
          items: {
            create: itemsWithTotal.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice.toString()),
              discount: item.discount
                ? new Decimal(item.discount.toString())
                : new Decimal(0),
              total: item.total,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Atualizar estoque dos produtos
      for (const item of data.items) {
        // Atualizar o estoque
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        // Registrar movimentação de estoque
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity, // Saída de estoque (valor negativo)
            type: "SALE",
            reference: newSale.id,
            userId: data.userId,
            notes: `Venda #${newSale.id}`,
          },
        });
      }

      return newSale;
    });

    revalidatePath("/sales");
    return { sale };
  } catch (error) {
    console.error("Error creating sale:", error);
    return { error: "Falha ao criar venda" };
  }
}

// Cancelar uma venda
export async function cancelSale(id: string, userId: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return { error: "Venda não encontrada" };
    }

    if (sale.status === "CANCELLED") {
      return { error: "Venda já está cancelada" };
    }

    // Cancelar a venda e devolver produtos ao estoque em uma transação
    await prisma.$transaction(async (tx) => {
      // Atualizar o status da venda
      await tx.sale.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Devolver produtos ao estoque
      for (const item of sale.items) {
        // Atualizar o estoque
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });

        // Registrar movimentação de estoque (devolução)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity, // Entrada de estoque (valor positivo)
            type: "RETURN",
            reference: sale.id,
            userId,
            notes: `Cancelamento da venda #${sale.id}`,
          },
        });
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
