import {
  Product,
  Sale,
  ItensVenda,
  Customer,
  User,
} from "@prisma/client";

// Re-export Prisma types
export type { Product, Sale, ItensVenda, Customer, User };

export type SerializedProduct = Omit<Product, 'createdAt' | 'updatedAt' | 'precoUnitario'> & {
  createdAt: string;
  updatedAt: string;
  precoUnitario: number;
};

export type ClientReturnItem = Omit<ItensVenda, 'produto'> & {
  produto: SerializedProduct;
  quantidadePendente: number;
  quantidadeADevolver: number;
};

export interface SaleWithDetails extends Sale {
  customer: Customer;
  user: User;
  itens: (ItensVenda & { produto: Product })[];
}