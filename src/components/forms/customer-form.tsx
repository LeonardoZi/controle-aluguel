// Formulário de Cliente
"use client";


import { z } from "zod";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Schema de validação
const customerSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome não pode exceder 100 caracteres"),
  email: z
    .string()
    .email("E-mail inválido")
    .max(100, "E-mail não pode exceder 100 caracteres"),
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone não pode exceder 15 caracteres")
    .regex(/^\d+$/, "Telefone deve conter apenas números"),
  document: z
    .string()
    .min(11, "CPF/CNPJ deve ter pelo menos 11 dígitos")
    .max(18, "CPF/CNPJ não pode exceder 18 caracteres"),
  address: z.object({
    street: z.string().min(3, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro é obrigatório"),
    city: z.string().min(2, "Cidade é obrigatória"),
    state: z.string().min(2, "Estado é obrigatório"),
    zipCode: z
      .string()
      .min(8, "CEP deve ter 8 dígitos")
      .max(9, "CEP não pode exceder 9 caracteres"),
  }),
  notes: z
    .string()
    .max(500, "Observações não podem exceder 500 caracteres")
    .optional(),
  isActive: z.boolean().default(true),
});

// Tipo derivado do schema
type CustomerFormValues = z.infer<typeof customerSchema>;

// Props do componente
interface CustomerFormProps {
  initialData?: Partial<CustomerFormValues>;
  onSubmit: (data: CustomerFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CustomerFormProps) {


  // Valores iniciais do formulário
  const defaultValues: CustomerFormValues = {
    name: "",
    email: "",
    phone: "",
    document: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
    notes: "",
    isActive: true,
    ...initialData,
  };

  // Hook de formulário
  const form = useForm<CustomerFormValues>({
    initialValues: defaultValues,
    validationSchema: customerSchema as z.ZodType<CustomerFormValues>,
    onSubmit,
  });



  // Definir um tipo para as chaves do objeto address
  type AddressField = keyof CustomerFormValues["address"];

  const hasAddressFieldError = (field: AddressField): boolean => {
    return !!(
      form.touched.address &&
      typeof form.touched.address === "object" &&
      form.touched.address[field] &&
      form.errors.address &&
      typeof form.errors.address === "object" &&
      form.errors.address[field]
    );
  };

  const getAddressFieldError = (field: AddressField): string => {
    if (form.errors.address && typeof form.errors.address === "object") {
      const error = form.errors.address[field];
      // Verifica se o erro existe e o converte para string de forma segura
      return error !== undefined && error !== null ? String(error) : "";
    }
    return "";
  };

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Básicas</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome Completo / Razão Social *
            </label>
            <Input
              id="name"
              name="name"
              value={form.values.name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.name && form.errors.name}
              placeholder="Digite o nome completo"
              className={cn(
                form.touched.name && form.errors.name && "border-red-500"
              )}
            />
            {form.touched.name && form.errors.name && (
              <p className="mt-1 text-sm text-red-500">{form.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-mail *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="email@exemplo.com"
              className={cn(
                form.touched.email && form.errors.email && "border-red-500"
              )}
            />
            {form.touched.email && form.errors.email && (
              <p className="mt-1 text-sm text-red-500">{form.errors.email}</p>
            )}
          </div>
        </div>



          <div>
            <label
              htmlFor="document"
              className="block text-sm font-medium mb-1"
            >
              {"CPF/CNPJ *"}
            </label>
            <Input
              id="document"
              name="document"
              value={form.values.document}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder={
                true
                  ? "000.000.000-00"
                  : "00.000.000/0001-00"
              }
              className={cn(
                form.touched.document &&
                  form.errors.document &&
                  "border-red-500"
              )}
            />
            {form.touched.document && form.errors.document && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.document}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Telefone *
            </label>
            <Input
              id="phone"
              name="phone"
              value={form.values.phone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="(00) 00000-0000"
              className={cn(
                form.touched.phone && form.errors.phone && "border-red-500"
              )}
            />
            {form.touched.phone && form.errors.phone && (
              <p className="mt-1 text-sm text-red-500">{form.errors.phone}</p>
            )}
          </div>
        </div>
  {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="address.street"
              className="block text-sm font-medium mb-1"
            >
              Rua/Avenida *
            </label>
            <Input
              id="address.street"
              name="address.street"
              value={form.values.address.street}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Nome da rua"
              className={cn(hasAddressFieldError("street") && "border-red-500")}
            />
            {hasAddressFieldError("street") && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("street")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="address.number"
                className="block text-sm font-medium mb-1"
              >
                Número *
              </label>
              <Input
                id="address.number"
                name="address.number"
                value={form.values.address.number}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Número"
                className={cn(
                  hasAddressFieldError("number") && "border-red-500"
                )}
              />
              {hasAddressFieldError("number") && (
                <p className="mt-1 text-sm text-red-500">
                  {getAddressFieldError("number")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="address.complement"
                className="block text-sm font-medium mb-1"
              >
                Complemento
              </label>
              <Input
                id="address.complement"
                name="address.complement"
                value={form.values.address.complement}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Apto, Bloco, etc."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="address.neighborhood"
              className="block text-sm font-medium mb-1"
            >
              Bairro *
            </label>
            <Input
              id="address.neighborhood"
              name="address.neighborhood"
              value={form.values.address.neighborhood}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Bairro"
              className={cn(
                hasAddressFieldError("neighborhood") && "border-red-500"
              )}
            />
            {hasAddressFieldError("neighborhood") && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("neighborhood")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="address.zipCode"
              className="block text-sm font-medium mb-1"
            >
              CEP *
            </label>
            <Input
              id="address.zipCode"
              name="address.zipCode"
              value={form.values.address.zipCode}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="00000-000"
              className={cn(
                hasAddressFieldError("zipCode") && "border-red-500"
              )}
            />
            {hasAddressFieldError("zipCode") && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("zipCode")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="address.city"
              className="block text-sm font-medium mb-1"
            >
              Cidade *
            </label>
            <Input
              id="address.city"
              name="address.city"
              value={form.values.address.city}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Cidade"
              className={cn(hasAddressFieldError("city") && "border-red-500")}
            />
            {hasAddressFieldError("city") && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("city")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="address.state"
              className="block text-sm font-medium mb-1"
            >
              Estado *
            </label>
            <Input
              id="address.state"
              name="address.state"
              value={form.values.address.state}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="UF"
              className={cn(hasAddressFieldError("state") && "border-red-500")}
            />
            {hasAddressFieldError("state") && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("state")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Observações e Status */}
      <div className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Observações
          </label>
          <Textarea
            id="notes"
            name="notes"
            value={form.values.notes || ""}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            placeholder="Informações adicionais sobre o cliente"
            rows={3}
            className={cn(
              form.touched.notes && form.errors.notes && "border-red-500"
            )}
          />
          {form.touched.notes && form.errors.notes && (
            <p className="mt-1 text-sm text-red-500">{form.errors.notes}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            name="isActive"
            checked={form.values.isActive}
            onCheckedChange={(checked) =>
              form.setValue("isActive", checked as boolean)
            }
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Cliente ativo
          </label>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Cliente"}
        </Button>
      </div>
    </form>
  );
}
