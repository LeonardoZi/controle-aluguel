import type { Prisma, Product } from "@prisma/client";
import {
  productDetailsSchema,
  productListSchema,
  productSchema,
  type ProductDetailsDto,
  type ProductDto,
} from "@/server/contracts/v1/inventory";

export function toProductDto(
  product: Product,
): ProductDto {
  return productSchema.parse({
    id: product.id,
    name: product.name,
    description: product.description,
    precoUnitario: Number(product.precoUnitario),
    currentStock: product.currentStock,
    unit: product.unit,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  });
}

export function toProductListDto(
  products: Product[],
): ProductDto[] {
  return productListSchema.parse(products.map((product) => toProductDto(product)));
}

type ProductWithSalesHistory = Prisma.ProductGetPayload<{
  include: {
    itensDeVenda: {
      include: {
        sale: {
          include: {
            customer: true;
          };
        };
      };
      orderBy: {
        sale: {
          dataRetirada: "desc";
        };
      };
      take: 10;
    };
  };
}>;

export function toProductDetailsDto(
  product: ProductWithSalesHistory,
): ProductDetailsDto {
  return productDetailsSchema.parse({
    ...toProductDto(product),
    itensDeVenda: product.itensDeVenda.map(
      (item: ProductWithSalesHistory["itensDeVenda"][number]) => ({
        id: item.id,
        saleId: item.saleId,
        produtoId: item.produtoId,
        quantidadeRetirada: item.quantidadeRetirada,
        quantidadeDevolvida: item.quantidadeDevolvida,
        precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
        sale: {
          id: item.sale.id,
          dataRetirada: item.sale.dataRetirada.toISOString(),
          dataDevolucaoPrevista: item.sale.dataDevolucaoPrevista.toISOString(),
          status: item.sale.status,
          totalAmount: item.sale.totalAmount ? Number(item.sale.totalAmount) : null,
          createdAt: item.sale.createdAt.toISOString(),
          updatedAt: item.sale.updatedAt.toISOString(),
          customer: {
            id: item.sale.customer.id,
            name: item.sale.customer.name,
            email: item.sale.customer.email,
            phone: item.sale.customer.phone,
          },
        },
      }),
    ),
  });
}
