import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  saleDetailsSchema,
  saleListSchema,
  salesSummarySchema,
  type SaleDetailsDto,
  type SaleStatus,
  type SalesSummaryDto,
} from "@/server/contracts/v1/sales";
import { UPCOMING_EXPIRATIONS_LIMIT } from "@/server/shared/constants";
import { countPendingReturns } from "@/server/sales/domain";
import { toSaleDetailsDto, toSaleDetailsListDto } from "@/server/sales/mappers";

export interface ListSalesFilters {
  status?: SaleStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  isOverdue?: boolean;
  limit?: number;
}

function buildSalesWhere(filters: ListSalesFilters): Prisma.SaleWhereInput {
  const { status, customerId, startDate, endDate, isOverdue } = filters;
  const now = new Date();

  const where: Prisma.SaleWhereInput = {
    ...(customerId ? { customerId } : {}),
    ...(startDate || endDate
      ? {
          dataRetirada: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };

  if (isOverdue) {
    where.dataDevolucaoPrevista = { lt: now };
    where.status = { in: ["ATIVO", "ATRASADO"] };
    return where;
  }

  if (!status) {
    return where;
  }

  if (status === "ATRASADO") {
    where.OR = [
      { status: "ATRASADO" },
      { status: "ATIVO", dataDevolucaoPrevista: { lt: now } },
    ];
    return where;
  }

  where.status = status;
  return where;
}

function defaultSaleInclude() {
  return {
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
  } as const;
}

export async function listSales(
  filters: ListSalesFilters = {},
): Promise<SaleDetailsDto[]> {
  const where = buildSalesWhere(filters);

  const sales = await prisma.sale.findMany({
    where,
    include: defaultSaleInclude(),
    orderBy: { dataRetirada: "desc" },
    ...(filters.limit ? { take: filters.limit } : {}),
  });

  return saleListSchema.parse(toSaleDetailsListDto(sales));
}

export async function findSaleById(id: string): Promise<SaleDetailsDto | null> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: defaultSaleInclude(),
  });

  if (!sale) {
    return null;
  }

  return saleDetailsSchema.parse(toSaleDetailsDto(sale));
}

export interface SalesSummaryFilters {
  startDate?: Date;
  endDate?: Date;
}

export async function getSalesSummaryReadModel(
  filters: SalesSummaryFilters = {},
): Promise<SalesSummaryDto> {
  const { startDate, endDate } = filters;
  const now = new Date();

  const baseWhere: Prisma.SaleWhereInput = {
    ...(startDate || endDate
      ? {
          dataRetirada: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };

  const [
    totalSales,
    activeSales,
    overdueSales,
    completedSales,
    totalRevenue,
    openSales,
  ] = await Promise.all([
    prisma.sale.count({ where: baseWhere }),
    prisma.sale.count({
      where: {
        ...baseWhere,
        status: "ATIVO",
        dataDevolucaoPrevista: { gte: now },
      },
    }),
    prisma.sale.count({
      where: {
        ...baseWhere,
        OR: [
          { status: "ATRASADO" },
          { status: "ATIVO", dataDevolucaoPrevista: { lt: now } },
        ],
      },
    }),
    prisma.sale.count({
      where: { ...baseWhere, status: "CONCLUIDO" },
    }),
    prisma.sale.aggregate({
      where: {
        ...baseWhere,
        status: { in: ["ATIVO", "ATRASADO", "CONCLUIDO"] },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        ...baseWhere,
        status: { in: ["ATIVO", "ATRASADO"] },
      },
      select: {
        itens: {
          select: {
            quantidadeRetirada: true,
            quantidadeDevolvida: true,
          },
        },
      },
    }),
  ]);

  return salesSummarySchema.parse({
    totalSales,
    activeSales,
    overdueSales,
    completedSales,
    totalRevenue: totalRevenue._sum.totalAmount
      ? Number(totalRevenue._sum.totalAmount)
      : 0,
    pendingReturns: countPendingReturns(openSales),
  });
}

export interface UpcomingExpirationDto {
  id: string;
  dataDevolucaoPrevista: Date;
  customer: {
    name: string;
  };
}

export async function listUpcomingExpirations(
  limit: number = UPCOMING_EXPIRATIONS_LIMIT,
): Promise<UpcomingExpirationDto[]> {
  return prisma.sale.findMany({
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
    take: limit,
  });
}
