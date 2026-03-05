import { z } from "zod";
import {
  currencyNumberSchema,
  isoDateTimeSchema,
  nullableCurrencyNumberSchema,
} from "./shared";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  precoUnitario: currencyNumberSchema,
  currentStock: z.number().int(),
  unit: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const productListSchema = z.array(productSchema);

export const productSaleHistorySchema = z.object({
  id: z.string(),
  saleId: z.string(),
  produtoId: z.string(),
  quantidadeRetirada: z.number().int(),
  quantidadeDevolvida: z.number().int().nullable(),
  precoUnitarioNoMomento: currencyNumberSchema,
  sale: z.object({
    id: z.string(),
    dataRetirada: isoDateTimeSchema,
    dataDevolucaoPrevista: isoDateTimeSchema,
    status: z.enum(["ATIVO", "ATRASADO", "CONCLUIDO", "CANCELADO"]),
    totalAmount: nullableCurrencyNumberSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    customer: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
    }),
  }),
});

export const productDetailsSchema = productSchema.extend({
  itensDeVenda: z.array(productSaleHistorySchema),
});

export type ProductDto = z.infer<typeof productSchema>;
export type ProductDetailsDto = z.infer<typeof productDetailsSchema>;
