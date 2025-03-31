"use server";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import type { Sale } from "@prisma/client";
import type {
  Customer,
  SaleItem,
  Product,
  Category,
  Supplier,
} from "@prisma/client";
import { MovementType } from "@prisma/client";

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
export async function getSalesReport(startDate: Date, endDate: Date) {
  try {
    // Buscar dados de vendas para o período
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    // Calcular totais
    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, sale) => sum.add(sale.totalAmount),
      new Decimal(0)
    );

    // Agrupar vendas por dia
    const salesByDate = groupSalesByDate(sales);

    // Agrupar vendas por método de pagamento
    const salesByPaymentMethod = groupSalesByPaymentMethod(sales);

    // Top produtos vendidos
    const topProducts = await getTopSellingProducts(startDate, endDate);

    return {
      totalSales,
      totalRevenue: Number(totalRevenue),
      salesByDate,
      salesByPaymentMethod,
      topProducts,
      sales,
    };
  } catch (error) {
    console.error("Error generating sales report:", error);
    return { error: "Falha ao gerar relatório de vendas" };
  }
}

// Agrupar vendas por data
function groupSalesByDate(sales: SaleWithRelations[]) {
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

// Agrupar vendas por método de pagamento
function groupSalesByPaymentMethod(sales: SaleWithRelations[]) {
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

// Top produtos vendidos
async function getTopSellingProducts(startDate: Date, endDate: Date) {
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
    // Buscar todos os produtos ativos
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: "asc" },
    });

    // Calcular estatísticas
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, product) =>
        sum + Number(product.purchasePrice) * product.currentStock,
      0
    );
    const lowStockCount = products.filter(
      (p) => p.currentStock <= p.minimumStock
    ).length;

    // Agrupar produtos por categoria
    const productsByCategory = groupProductsByCategory(products);

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      productsByCategory,
      products,
    };
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return { error: "Falha ao gerar relatório de estoque" };
  }
}

// Agrupar produtos por categoria
function groupProductsByCategory(products: ProductWithRelations[]) {
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
