import { z } from "zod";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
};

const optionalNullableString = (max: number, label: string) =>
  z.preprocess(
    emptyStringToNull,
    z
      .string()
      .max(max, `${label} deve ter no máximo ${max} caracteres`)
      .nullable()
      .optional(),
  );

const optionalPhone = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .regex(/^[0-9()+\-\s]+$/, "Telefone contém caracteres inválidos")
    .nullable()
    .optional(),
);

const optionalPostalCode = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .max(20, "CEP deve ter no máximo 20 caracteres")
    .regex(/^[0-9\-]+$/, "CEP deve conter apenas números e hífen")
    .nullable()
    .optional(),
);

const optionalTaxId = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .max(20, "CPF/CNPJ deve ter no máximo 20 caracteres")
    .regex(/^[0-9./\-]+$/, "CPF/CNPJ contém caracteres inválidos")
    .nullable()
    .optional(),
);

const unitString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}, z.string().max(20, "Unidade deve ter no máximo 20 caracteres").default("un"));

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.preprocess(
    emptyStringToNull,
    z.string().email("Email inválido").max(100).nullable().optional(),
  ),
  phone: optionalPhone,
  taxId: optionalTaxId,
  address: optionalNullableString(200, "Endereço"),
  number: optionalNullableString(20, "Número"),
  complement: optionalNullableString(100, "Complemento"),
  neighborhood: optionalNullableString(100, "Bairro"),
  city: optionalNullableString(100, "Cidade"),
  state: optionalNullableString(50, "Estado"),
  postalCode: optionalPostalCode,
  isActive: z.boolean().default(true),
});

export const createCustomerSchema = customerSchema;

export const updateCustomerSchema = customerSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo informado para atualização",
  });

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: optionalNullableString(1000, "Descrição"),
  precoUnitario: z.coerce
    .number({ invalid_type_error: "Preço unitário deve ser numérico" })
    .positive("Preço unitário deve ser maior que zero"),
  currentStock: z.coerce
    .number({ invalid_type_error: "Estoque deve ser numérico" })
    .int("Estoque deve ser um número inteiro")
    .nonnegative("Estoque não pode ser negativo")
    .default(0),
  unit: unitString,
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo informado para atualização",
  });

export const createSaleSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  userId: z.string().min(1, "Usuário é obrigatório"),
  dataDevolucaoPrevista: z.coerce.date({
    invalid_type_error: "Data de devolução inválida",
  }),
  notes: optionalNullableString(1000, "Observações"),
  items: z
    .array(
      z.object({
        produtoId: z.string().min(1, "Produto é obrigatório"),
        quantidadeRetirada: z.coerce
          .number({ invalid_type_error: "Quantidade inválida" })
          .int("Quantidade deve ser inteira")
          .positive("Quantidade deve ser maior que zero"),
        precoUnitarioNoMomento: z.coerce
          .number({ invalid_type_error: "Preço unitário inválido" })
          .positive("Preço unitário deve ser maior que zero")
          .optional(),
      }),
    )
    .min(1, "Adicione pelo menos um item"),
});

export const processReturnSchema = z.object({
  saleId: z.string().min(1, "Venda é obrigatória"),
  userId: z.string().min(1, "Usuário é obrigatório"),
  notes: optionalNullableString(1000, "Observações"),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Item é obrigatório"),
        quantidadeDevolvida: z.coerce
          .number({ invalid_type_error: "Quantidade inválida" })
          .int("Quantidade deve ser inteira")
          .positive("Quantidade deve ser maior que zero"),
      }),
    )
    .min(1, "Informe ao menos um item para devolução"),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ProcessReturnInput = z.infer<typeof processReturnSchema>;
