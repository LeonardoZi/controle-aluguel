import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 10;
const UPCOMING_EXPIRATIONS_LIMIT = 10;

export interface HomeStats {
  totalProducts: number;
  totalCustomers: number;
  activeSales: number;
  overdueSales: number;
  monthRevenue: number;
  lowStockCount: number;
}

export interface UpcomingExpiration {
  id: string;
  dataDevolucaoPrevista: Date;
  customer: {
    name: string;
  };
}

const emptyStats: HomeStats = {
  totalProducts: 0,
  totalCustomers: 0,
  activeSales: 0,
  overdueSales: 0,
  monthRevenue: 0,
  lowStockCount: 0,
};

export async function getUpcomingExpirations(): Promise<UpcomingExpiration[]> {
  try {
    return await prisma.sale.findMany({
      where: {
        status: { in: ["ATIVO", "ATRASADO"] },
      },
      select: {
        id: true,
        dataDevolucaoPrevista: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dataDevolucaoPrevista: "asc",
      },
      take: UPCOMING_EXPIRATIONS_LIMIT,
    });
  } catch (error) {
    console.error("Error fetching upcoming expirations:", error);
    return [];
  }
}

export async function getHomeStats(): Promise<HomeStats> {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      totalCustomers,
      activeSales,
      overdueSales,
      monthRevenue,
      lowStockCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.customer.count({
        where: { isActive: true },
      }),
      prisma.sale.count({
        where: {
          status: { in: ["ATIVO", "ATRASADO"] },
        },
      }),
      prisma.sale.count({
        where: {
          status: "ATRASADO",
        },
      }),
      prisma.sale.aggregate({
        where: {
          status: "CONCLUIDO",
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.product.count({
        where: {
          currentStock: {
            lte: LOW_STOCK_THRESHOLD,
          },
        },
      }),
    ]);

    return {
      totalProducts,
      totalCustomers,
      activeSales,
      overdueSales,
      monthRevenue: Number(monthRevenue._sum?.totalAmount || 0),
      lowStockCount,
    };
  } catch (error) {
    console.error("Error fetching home statistics:", error);
    return emptyStats;
  }
}

export async function getHomeOverview() {
  const [stats, upcomingExpirations] = await Promise.all([
    getHomeStats(),
    getUpcomingExpirations(),
  ]);

  return {
    stats,
    upcomingExpirations,
  };
}
