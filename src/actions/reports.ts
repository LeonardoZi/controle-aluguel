"use server";

import { prisma } from "@/lib/prisma";
import type { Sale } from "@prisma/client";
import type {
  Customer,
  SaleItem,
  Product,
  Category,
  Supplier,
} from "@prisma/client";
import { MovementType } from "@prisma/client";
import { PurchaseStatus, SaleStatus } from "@prisma/client";

type SaleWithRelations = Sale & {
  customer: Customer | null;
  items: (SaleItem & { product: Product })[];
};

// Adicione este tipo para produtos com relações
type ProductWithRelations = Product & {
  category: Category;
  supplier: Supplier | null;
};

// Relatório de vendas por período
export async function getSalesReport(options?: {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  status?: SaleStatus;
}) {
  try {
    const { startDate, endDate, customerId, status } = options || {};

    const sales = await prisma.sale.findMany({
      where: {
        ...(startDate || endDate
          ? {
              saleDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(customerId ? { customerId } : {}),
        ...(status ? { status } : {}),
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
    console.error("Error fetching sales report:", error);
    return { error: "Falha ao buscar relatório de vendas" };
  }
}

/**
 * Agrupa vendas por data para análise de tendências
 * @param sales Lista de vendas a serem agrupadas
 * @returns Array de objetos com data, total e contagem de vendas
 */
export function groupSalesByDate(sales: SaleWithRelations[]) {
  const salesByDate: { [date: string]: { total: number; count: number } } = {};

  sales.forEach((sale) => {
    const dateStr = sale.saleDate.toISOString().split("T")[0];

    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = { total: 0, count: 0 };
    }

    salesByDate[dateStr].total += Number(sale.totalAmount);
    salesByDate[dateStr].count += 1;
  });

  return Object.entries(salesByDate).map(([date, data]) => ({
    date,
    total: data.total,
    count: data.count,
  }));
}

/**
 * Agrupa vendas por método de pagamento para análise financeira
 * @param sales Lista de vendas a serem agrupadas
 * @returns Array de objetos com método, total e contagem de vendas
 */
export function groupSalesByPaymentMethod(sales: SaleWithRelations[]) {
  const salesByMethod: { [method: string]: { total: number; count: number } } =
    {};

  sales.forEach((sale) => {
    const method = sale.paymentMethod;

    if (!salesByMethod[method]) {
      salesByMethod[method] = { total: 0, count: 0 };
    }

    salesByMethod[method].total += Number(sale.totalAmount);
    salesByMethod[method].count += 1;
  });

  return Object.entries(salesByMethod).map(([method, data]) => ({
    method,
    total: data.total,
    count: data.count,
  }));
}

/**
 * Busca os produtos mais vendidos em um período específico
 * @param startDate Data inicial para análise
 * @param endDate Data final para análise
 * @returns Array dos produtos mais vendidos com detalhes
 */
export async function getTopSellingProducts(startDate: Date, endDate: Date) {
  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
      },
    },
    _sum: {
      quantity: true,
      total: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 10,
  });

  const productsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, sku: true },
      });

      return {
        productId: item.productId,
        name: product?.name || "Produto não encontrado",
        sku: product?.sku || "",
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.total) || 0,
      };
    })
  );

  return productsWithDetails;
}

// Relatório de estoque
export async function getInventoryReport() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    // Enhance product data with additional report-specific info
    const enhancedProducts = products.map((product) => {
      const lastMovement = product.stockMovements?.[0];

      return {
        ...product,
        lastMovementDate: lastMovement?.createdAt,
        minStock: product.minimumStock,
        maxStock: product.minimumStock ? product.minimumStock * 3 : undefined, // Example fallback
        costPrice: product.purchasePrice,
        stockValue: product.purchasePrice.mul(product.currentStock),
      };
    });

    return { products: enhancedProducts };
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    return { error: "Falha ao buscar relatório de inventário" };
  }
}

/**
 * Agrupa produtos por categoria para análise de distribuição de estoque
 * @param products Lista de produtos com relações a serem agrupados
 * @returns Array de objetos com categoria, contagem e valor total
 */
export async function groupProductsByCategory(
  products: ProductWithRelations[]
) {
  const productsByCategory: {
    [category: string]: { count: number; value: number };
  } = {};

  products.forEach((product) => {
    const categoryName = product.category.name;

    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = { count: 0, value: 0 };
    }

    productsByCategory[categoryName].count += 1;
    productsByCategory[categoryName].value +=
      Number(product.purchasePrice) * product.currentStock;
  });

  return Object.entries(productsByCategory).map(([category, data]) => ({
    category,
    count: data.count,
    value: data.value,
  }));
}

// Relatório de movimentação de estoque
export async function getStockMovementReport(
  startDate: Date,
  endDate: Date,
  productId?: string,
  type?: string
) {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(productId ? { productId } : {}),
        ...(type ? { type: type as MovementType } : {}),
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Agrupar movimentos por tipo
    const movementsByType: {
      [type: string]: { quantity: number; count: number };
    } = {};

    movements.forEach((movement) => {
      const type = movement.type;

      if (!movementsByType[type]) {
        movementsByType[type] = { quantity: 0, count: 0 };
      }

      movementsByType[type].quantity += movement.quantity;
      movementsByType[type].count += 1;
    });

    const movementSummary = Object.entries(movementsByType).map(
      ([type, data]) => ({
        type,
        quantity: data.quantity,
        count: data.count,
      })
    );

    return {
      movements,
      movementSummary,
    };
  } catch (error) {
    console.error("Error generating stock movement report:", error);
    return { error: "Falha ao gerar relatório de movimentação de estoque" };
  }
}

// Get purchases data for reports
export async function getPurchasesReport(options?: {
  startDate?: Date;
  endDate?: Date;
  supplierId?: string;
  status?: PurchaseStatus;
}) {
  try {
    const { startDate, endDate, supplierId, status } = options || {};

    const purchases = await prisma.purchaseOrder.findMany({
      where: {
        ...(startDate || endDate
          ? {
              orderDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(supplierId ? { supplierId } : {}),
        ...(status ? { status } : {}),
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
    console.error("Error fetching purchases report:", error);
    return { error: "Falha ao buscar relatório de compras" };
  }
}
