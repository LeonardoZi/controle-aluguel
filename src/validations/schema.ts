import { z } from "zod";

/**
 * Schema para validação de produto
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  sku: z
    .string()
    .min(2, "SKU deve ter no mínimo 2 caracteres")
    .max(50, "SKU deve ter no máximo 50 caracteres"),
  description: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .nullish(),
  currentStock: z
    .number()
    .nonnegative("Estoque não pode ser negativo")
    .default(0),
  minStock: z
    .number()
    .nonnegative("Estoque mínimo não pode ser negativo")
    .nullish(),
  maxStock: z
    .number()
    .nonnegative("Estoque máximo não pode ser negativo")
    .nullish(),
  costPrice: z
    .number()
    .nonnegative("Preço de custo não pode ser negativo")
    .nullish(),
  sellingPrice: z
    .number()
    .nonnegative("Preço de venda não pode ser negativo")
    .nullish(),
  isActive: z.boolean().default(true),
  supplierId: z.string().nullish(),
  categoryId: z.string().nullish(),
  barcode: z
    .string()
    .max(50, "Código de barras deve ter no máximo 50 caracteres")
    .nullish(),
});

/**
 * Schema para validação de cliente
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email inválido").nullish(),
  phone: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .nullish(),
  document: z
    .string()
    .max(20, "CPF/CNPJ deve ter no máximo 20 caracteres")
    .nullish(),
  address: z
    .string()
    .max(200, "Endereço deve ter no máximo 200 caracteres")
    .nullish(),
  city: z
    .string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .nullish(),
  state: z
    .string()
    .max(50, "Estado deve ter no máximo 50 caracteres")
    .nullish(),
  postalCode: z
    .string()
    .max(20, "CEP deve ter no máximo 20 caracteres")
    .nullish(),
  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .nullish(),
  isActive: z.boolean().default(true),
});

/**
 * Schema para validação de fornecedor
 */
export const supplierSchema = z.object({
  companyName: z
    .string()
    .min(3, "Nome da empresa deve ter no mínimo 3 caracteres")
    .max(100, "Nome da empresa deve ter no máximo 100 caracteres"),
  contactName: z
    .string()
    .max(100, "Nome do contato deve ter no máximo 100 caracteres")
    .nullish(),
  email: z.string().email("Email inválido").nullish(),
  phone: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .nullish(),
  taxId: z.string().max(30, "CNPJ deve ter no máximo 30 caracteres").nullish(),
  address: z
    .string()
    .max(200, "Endereço deve ter no máximo 200 caracteres")
    .nullish(),
  city: z
    .string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .nullish(),
  state: z
    .string()
    .max(50, "Estado deve ter no máximo 50 caracteres")
    .nullish(),
  postalCode: z
    .string()
    .max(20, "CEP deve ter no máximo 20 caracteres")
    .nullish(),
  country: z
    .string()
    .max(50, "País deve ter no máximo 50 caracteres")
    .default("Brasil"),
  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .nullish(),
  isActive: z.boolean().default(true),
});

/**
 * Schema para validação de venda
 */
export const saleSchema = z.object({
  customerId: z.string(),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .nullish(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive("Quantidade deve ser maior que zero"),
        unitPrice: z
          .number()
          .positive("Preço unitário deve ser maior que zero"),
      })
    )
    .min(1, "Adicione pelo menos um item"),
});

/**
 * Schema para validação de pedido de compra
 */
export const purchaseOrderSchema = z.object({
  supplierId: z.string(),
  expectedDelivery: z.string().nullish(),
  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .nullish(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive("Quantidade deve ser maior que zero"),
        unitPrice: z
          .number()
          .nonnegative("Preço unitário não pode ser negativo"),
      })
    )
    .min(1, "Adicione pelo menos um item"),
});
