import { prisma } from "@/lib/prisma";
import {
  productDetailsSchema,
  productListSchema,
  type ProductDetailsDto,
  type ProductDto,
} from "@/server/contracts/v1/inventory";
import { LOW_STOCK_THRESHOLD } from "@/server/shared/constants";
import { toProductDetailsDto, toProductListDto } from "@/server/inventory/mappers";

export interface ProductQueryFilters {
  query?: string;
  lowStock?: boolean;
  limit?: number;
}

export async function listProducts(
  filters: ProductQueryFilters = {},
): Promise<ProductDto[]> {
  const products = await prisma.product.findMany({
    where: {
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              {
                description: {
                  contains: filters.query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(filters.lowStock
        ? {
            currentStock: {
              lte: LOW_STOCK_THRESHOLD,
            },
          }
        : {}),
    },
    orderBy: { name: "asc" },
    ...(filters.limit ? { take: filters.limit } : {}),
  });

  return productListSchema.parse(toProductListDto(products));
}

export async function findProductById(
  id: string,
): Promise<ProductDetailsDto | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      itensDeVenda: {
        include: {
          sale: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: {
          sale: {
            dataRetirada: "desc",
          },
        },
        take: 10,
      },
    },
  });

  if (!product) {
    return null;
  }

  return productDetailsSchema.parse(toProductDetailsDto(product));
}

export async function listLowStockProducts(
  limit?: number,
): Promise<ProductDto[]> {
  const products = await prisma.product.findMany({
    where: {
      currentStock: {
        lte: LOW_STOCK_THRESHOLD,
      },
    },
    orderBy: [
      {
        currentStock: "asc",
      },
    ],
    ...(limit ? { take: limit } : {}),
  });

  return productListSchema.parse(toProductListDto(products));
}
