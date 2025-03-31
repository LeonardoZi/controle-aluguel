"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PurchaseStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Tipo para item de pedido (na criação)
type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number | Decimal;
};

// Buscar todos os pedidos de compra
export async function getPurchaseOrders(options?: {
  status?: PurchaseStatus;
  supplierId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { status, supplierId, startDate, endDate } = options || {};

    const purchases = await prisma.purchaseOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(supplierId ? { supplierId } : {}),
        ...(startDate || endDate
          ? {
              orderDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        supplier: true,
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
      orderBy: { orderDate: "desc" },
    });

    return { purchases };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return { error: "Falha ao buscar pedidos de compra" };
  }
}

// Buscar um pedido de compra pelo ID
export async function getPurchaseOrderById(id: string) {
  try {
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
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

    if (!purchase) {
      return { error: "Pedido não encontrado" };
    }

    return { purchase };
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return { error: "Falha ao buscar pedido de compra" };
  }
}

// Criar um novo pedido de compra
export async function createPurchaseOrder(data: {
  supplierId: string;
  userId: string;
  expectedDelivery?: Date;
  notes?: string;
  items: PurchaseItemInput[];
}) {
  try {
    // Calcular o valor total
    const totalAmount = data.items.reduce((sum, item) => {
      const itemTotal = new Decimal(item.unitPrice.toString()).mul(
        item.quantity
      );
      return sum.add(itemTotal);
    }, new Decimal(0));

    // Criar o pedido em uma transação
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Criar o pedido
      const order = await tx.purchaseOrder.create({
        data: {
          supplierId: data.supplierId,
          userId: data.userId,
          expectedDelivery: data.expectedDelivery,
          notes: data.notes,
          totalAmount,
          status: "PENDING",
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice.toString()),
              total: new Decimal(item.unitPrice.toString()).mul(item.quantity),
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      return order;
    });

    revalidatePath("/purchases");
    return { purchaseOrder };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return { error: "Falha ao criar pedido de compra" };
  }
}

// Atualizar o status de um pedido
export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseStatus
) {
  try {
    const purchase = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${id}`);
    return { purchase };
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    return { error: "Falha ao atualizar status do pedido" };
  }
}

// Receber um pedido de compra (parcial ou completo)
export async function receivePurchaseOrder(
  id: string,
  data: {
    userId: string;
    items: {
      purchaseItemId: string;
      receivedQuantity: number;
    }[];
    notes?: string;
  }
) {
  try {
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      return { error: "Pedido não encontrado" };
    }

    if (purchase.status === "CANCELLED") {
      return { error: "Não é possível receber um pedido cancelado" };
    }

    // Validar quantidades recebidas
    for (const receivedItem of data.items) {
      const purchaseItem = purchase.items.find(
        (item) => item.id === receivedItem.purchaseItemId
      );

      if (!purchaseItem) {
        return {
          error: `Item ${receivedItem.purchaseItemId} não pertence a este pedido`,
        };
      }

      if (receivedItem.receivedQuantity < 0) {
        return { error: "A quantidade recebida não pode ser negativa" };
      }

      const newTotalReceived =
        purchaseItem.receivedQuantity + receivedItem.receivedQuantity;
      if (newTotalReceived > purchaseItem.quantity) {
        return {
          error: `Quantidade recebida excede a quantidade pedida para o produto ${purchaseItem.product.name}`,
        };
      }
    }

    // Processar o recebimento em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar cada item com a quantidade recebida
      for (const receivedItem of data.items) {
        if (receivedItem.receivedQuantity <= 0) continue;

        const purchaseItem = purchase.items.find(
          (item) => item.id === receivedItem.purchaseItemId
        )!;

        // Atualizar a quantidade recebida do item
        await tx.purchaseItem.update({
          where: { id: receivedItem.purchaseItemId },
          data: {
            receivedQuantity: { increment: receivedItem.receivedQuantity },
          },
        });

        // Atualizar o estoque do produto
        await tx.product.update({
          where: { id: purchaseItem.productId },
          data: {
            currentStock: { increment: receivedItem.receivedQuantity },
          },
        });

        // Registrar o movimento de estoque
        await tx.stockMovement.create({
          data: {
            productId: purchaseItem.productId,
            quantity: receivedItem.receivedQuantity,
            type: "PURCHASE",
            reference: purchase.id,
            userId: data.userId,
            notes: `Recebimento do pedido #${purchase.id}${
              data.notes ? ` - ${data.notes}` : ""
            }`,
          },
        });
      }

      // Verificar se todos os itens foram recebidos completamente
      const updatedPurchase = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      const allItemsReceived = updatedPurchase!.items.every(
        (item) => item.receivedQuantity >= item.quantity
      );

      const anyItemReceived = updatedPurchase!.items.some(
        (item) => item.receivedQuantity > 0
      );

      // Atualizar o status do pedido
      let newStatus: PurchaseStatus = purchase.status;
      if (allItemsReceived) {
        newStatus = "RECEIVED";
      } else if (anyItemReceived && purchase.status !== "RECEIVED") {
        newStatus = "PARTIALLY_RECEIVED";
      }

      // Atualizar o pedido
      const finalPurchase = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          actualDelivery: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          supplier: true,
        },
      });

      return finalPurchase;
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${id}`);
    revalidatePath("/inventory");

    return { purchase: result };
  } catch (error) {
    console.error("Error receiving purchase:", error);
    return { error: "Falha ao receber pedido" };
  }
}

// Cancelar um pedido de compra
export async function cancelPurchaseOrder(id: string) {
  try {
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!purchase) {
      return { error: "Pedido não encontrado" };
    }

    if (["RECEIVED", "PARTIALLY_RECEIVED"].includes(purchase.status)) {
      return { error: "Não é possível cancelar um pedido que já foi recebido" };
    }

    const updatedPurchase = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${id}`);

    return { purchase: updatedPurchase };
  } catch (error) {
    console.error("Error canceling purchase:", error);
    return { error: "Falha ao cancelar pedido" };
  }
}
