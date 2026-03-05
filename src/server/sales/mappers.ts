import type { Prisma } from "@prisma/client";
import { saleDetailsSchema, type SaleDetailsDto } from "../contracts/v1/sales";
import { deriveSaleStatus } from "./domain";

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    customer: true;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    itens: {
      include: {
        produto: true;
      };
    };
  };
}>;

export function toSaleDetailsDto(
  sale: SaleWithRelations,
  now: Date = new Date(),
): SaleDetailsDto {
  return saleDetailsSchema.parse({
    id: sale.id,
    customerId: sale.customerId,
    userId: sale.userId,
    dataRetirada: sale.dataRetirada.toISOString(),
    dataDevolucaoPrevista: sale.dataDevolucaoPrevista.toISOString(),
    status: deriveSaleStatus(
      sale.status,
      sale.dataDevolucaoPrevista,
      now,
    ),
    totalAmount: sale.totalAmount ? Number(sale.totalAmount) : null,
    notes: sale.notes,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    customer: {
      id: sale.customer.id,
      name: sale.customer.name,
      email: sale.customer.email,
      phone: sale.customer.phone,
    },
    user: {
      id: sale.user.id,
      name: sale.user.name,
      email: sale.user.email,
    },
    itens: sale.itens.map((item) => ({
      id: item.id,
      produtoId: item.produtoId,
      quantidadeRetirada: item.quantidadeRetirada,
      quantidadeDevolvida: item.quantidadeDevolvida,
      precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
      produto: {
        id: item.produto.id,
        name: item.produto.name,
        unit: item.produto.unit,
        precoUnitario: Number(item.produto.precoUnitario),
      },
    })),
  });
}

export function toSaleDetailsListDto(
  sales: SaleWithRelations[],
  now: Date = new Date(),
): SaleDetailsDto[] {
  return sales.map((sale) => toSaleDetailsDto(sale, now));
}
