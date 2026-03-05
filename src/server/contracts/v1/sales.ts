import { z } from "zod";
import {
  currencyNumberSchema,
  isoDateTimeSchema,
  nullableCurrencyNumberSchema,
} from "./shared";

export const saleStatusSchema = z.enum([
  "ATIVO",
  "ATRASADO",
  "CONCLUIDO",
  "CANCELADO",
]);

export type SaleStatus = z.infer<typeof saleStatusSchema>;

export const saleUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const saleCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export const saleItemProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  precoUnitario: currencyNumberSchema,
});

export const saleItemSchema = z.object({
  id: z.string(),
  produtoId: z.string(),
  quantidadeRetirada: z.number().int(),
  quantidadeDevolvida: z.number().int().nullable(),
  precoUnitarioNoMomento: currencyNumberSchema,
  produto: saleItemProductSchema,
});

export const saleDetailsSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  userId: z.string(),
  dataRetirada: isoDateTimeSchema,
  dataDevolucaoPrevista: isoDateTimeSchema,
  status: saleStatusSchema,
  totalAmount: nullableCurrencyNumberSchema,
  notes: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  customer: saleCustomerSchema,
  user: saleUserSchema,
  itens: z.array(saleItemSchema),
});

export const saleListSchema = z.array(saleDetailsSchema);

export const salesSummarySchema = z.object({
  totalSales: z.number().int().nonnegative(),
  activeSales: z.number().int().nonnegative(),
  overdueSales: z.number().int().nonnegative(),
  completedSales: z.number().int().nonnegative(),
  totalRevenue: currencyNumberSchema,
  pendingReturns: z.number().int().nonnegative(),
});

export type SaleDetailsDto = z.infer<typeof saleDetailsSchema>;
export type SalesSummaryDto = z.infer<typeof salesSummarySchema>;
