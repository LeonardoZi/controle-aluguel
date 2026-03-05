import { prisma } from "@/lib/prisma";
import {
  homeOverviewSchema,
  homeStatsSchema,
  type HomeStatsDto,
  type UpcomingExpirationDto,
} from "@/server/contracts/v1/home";
import { LOW_STOCK_THRESHOLD } from "@/server/shared/constants";
import { listUpcomingExpirations } from "@/server/sales/queries";

const emptyStats: HomeStatsDto = {
  totalProducts: 0,
  totalCustomers: 0,
  activeSales: 0,
  overdueSales: 0,
  monthRevenue: 0,
  lowStockCount: 0,
};

export async function getUpcomingExpirations(): Promise<UpcomingExpirationDto[]> {
  try {
    const sales = await listUpcomingExpirations();

    return sales.map((sale) => ({
      id: sale.id,
      dataDevolucaoPrevista: sale.dataDevolucaoPrevista.toISOString(),
      customer: {
        name: sale.customer.name,
      },
    }));
  } catch {
    return [];
  }
}

export async function getHomeStats(): Promise<HomeStatsDto> {
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
          status: "ATIVO",
          dataDevolucaoPrevista: { gte: now },
        },
      }),
      prisma.sale.count({
        where: {
          OR: [
            { status: "ATRASADO" },
            { status: "ATIVO", dataDevolucaoPrevista: { lt: now } },
          ],
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

    return homeStatsSchema.parse({
      totalProducts,
      totalCustomers,
      activeSales,
      overdueSales,
      monthRevenue: Number(monthRevenue._sum?.totalAmount || 0),
      lowStockCount,
    });
  } catch {
    return emptyStats;
  }
}

export async function getHomeOverview() {
  const [stats, upcomingExpirations] = await Promise.all([
    getHomeStats(),
    getUpcomingExpirations(),
  ]);

  return homeOverviewSchema.parse({
    stats,
    upcomingExpirations,
  });
}
