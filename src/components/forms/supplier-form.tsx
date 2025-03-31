// Formulário de Fornecedor
"use client";

import { z } from "zod";
import { useForm } from "@/hooks/use-form";
import { cn } from "@/lib/utils";

// Componentes UI básicos
const Button = ({
  children,
  className,
  variant = "default",
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}) => (
  <button
    type={type}
    className={cn(
      "px-4 py-2 rounded font-medium",
      variant === "default"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "border border-gray-300 hover:bg-gray-100",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);

const Input = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  type = "text",
}: {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) => (
  <input
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    className={cn("w-full px-3 py-2 border rounded", className)}
    type={type}
  />
);

const Textarea = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  rows = 3,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) => (
  <textarea
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    className={cn("w-full px-3 py-2 border rounded", className)}
    rows={rows}
  />
);

const Checkbox = ({
  id,
  name,
  checked,
  onCheckedChange,
}: {
  id: string;
  name: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <input
    type="checkbox"
    id={id}
    name={name}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="h-4 w-4"
  />
);

// Schema de validação
const supplierSchema = z.object({
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
  cnpj: z
    .string()
    .min(14, "CNPJ deve ter 14 dígitos")
    .max(18, "CNPJ não pode exceder 18 caracteres"),
  contactName: z
    .string()
    .min(3, "Nome do contato deve ter pelo menos 3 caracteres")
    .max(100, "Nome do contato não pode exceder 100 caracteres"),
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
  paymentTerms: z
    .string()
    .max(200, "Termos de pagamento não podem exceder 200 caracteres")
    .optional(),
  notes: z
    .string()
    .max(500, "Observações não podem exceder 500 caracteres")
    .optional(),
  website: z.string().url("Website inválido").optional().or(z.literal("")),
  isActive: z.boolean(),
});

// Tipo derivado do schema
type SupplierFormValues = z.infer<typeof supplierSchema>;

// Props do componente
interface SupplierFormProps {
  initialData?: Partial<SupplierFormValues>;
  onSubmit: (data: SupplierFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function SupplierForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SupplierFormProps) {
  // Valores iniciais do formulário
  const defaultValues: SupplierFormValues = {
    name: "",
    email: "",
    phone: "",
    cnpj: "",
    contactName: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
    paymentTerms: "",
    notes: "",
    website: "",
    isActive:
      initialData?.isActive !== undefined ? !!initialData.isActive : true,
  };

  // Hook de formulário
  const form = useForm<SupplierFormValues>({
    initialValues: defaultValues,
    validationSchema: supplierSchema,
    onSubmit,
  });

  // Função auxiliar para obter valor de forma segura
  const getValue = (path: string): string => {
    if (path.startsWith("address.")) {
      const field = path.split(".")[1] as keyof typeof form.values.address;
      return form.values.address[field] || "";
    }
    return "";
  };

  // Função auxiliar para verificar toque e erro
  const hasError = (path: string): boolean => {
    if (path.startsWith("address.")) {
      const field = path.split(".")[1] as keyof typeof form.values.address;
      return !!(
        form.touched.address &&
        form.touched.address[field] &&
        form.errors.address &&
        form.errors.address[field]
      );
    }
    return false;
  };

  // Função para obter mensagem de erro
  const getErrorMessage = (path: string): string => {
    if (path.startsWith("address.")) {
      const field = path.split(".")[1] as keyof typeof form.values.address;
      return form.errors.address?.[field] || "";
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
              Nome/Razão Social *
            </label>
            <Input
              id="name"
              name="name"
              value={form.values.name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Nome do fornecedor"
              className={
                form.touched.name && form.errors.name ? "border-red-500" : ""
              }
            />
            {form.touched.name && form.errors.name && (
              <p className="mt-1 text-sm text-red-500">{form.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium mb-1">
              CNPJ *
            </label>
            <Input
              id="cnpj"
              name="cnpj"
              value={form.values.cnpj}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="00.000.000/0001-00"
              className={
                form.touched.cnpj && form.errors.cnpj ? "border-red-500" : ""
              }
            />
            {form.touched.cnpj && form.errors.cnpj && (
              <p className="mt-1 text-sm text-red-500">{form.errors.cnpj}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contactName"
              className="block text-sm font-medium mb-1"
            >
              Nome do Contato *
            </label>
            <Input
              id="contactName"
              name="contactName"
              value={form.values.contactName}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Nome da pessoa de contato"
              className={
                form.touched.contactName && form.errors.contactName
                  ? "border-red-500"
                  : ""
              }
            />
            {form.touched.contactName && form.errors.contactName && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.contactName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1">
              Website
            </label>
            <Input
              id="website"
              name="website"
              value={form.values.website || ""}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="https://exemplo.com"
              className={
                form.touched.website && form.errors.website
                  ? "border-red-500"
                  : ""
              }
            />
            {form.touched.website && form.errors.website && (
              <p className="mt-1 text-sm text-red-500">{form.errors.website}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="contato@empresa.com"
              className={
                form.touched.email && form.errors.email ? "border-red-500" : ""
              }
            />
            {form.touched.email && form.errors.email && (
              <p className="mt-1 text-sm text-red-500">{form.errors.email}</p>
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
              className={
                form.touched.phone && form.errors.phone ? "border-red-500" : ""
              }
            />
            {form.touched.phone && form.errors.phone && (
              <p className="mt-1 text-sm text-red-500">{form.errors.phone}</p>
            )}
          </div>
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
              value={getValue("address.street")}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Nome da rua"
              className={hasError("address.street") ? "border-red-500" : ""}
            />
            {hasError("address.street") && (
              <p className="mt-1 text-sm text-red-500">
                {getErrorMessage("address.street")}
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
                value={getValue("address.number")}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Número"
                className={hasError("address.number") ? "border-red-500" : ""}
              />
              {hasError("address.number") && (
                <p className="mt-1 text-sm text-red-500">
                  {getErrorMessage("address.number")}
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
                value={getValue("address.complement")}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Sala, Andar, etc."
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
              value={getValue("address.neighborhood")}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Bairro"
              className={
                hasError("address.neighborhood") ? "border-red-500" : ""
              }
            />
            {hasError("address.neighborhood") && (
              <p className="mt-1 text-sm text-red-500">
                {getErrorMessage("address.neighborhood")}
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
              value={getValue("address.zipCode")}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="00000-000"
              className={hasError("address.zipCode") ? "border-red-500" : ""}
            />
            {hasError("address.zipCode") && (
              <p className="mt-1 text-sm text-red-500">
                {getErrorMessage("address.zipCode")}
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
              value={getValue("address.city")}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Cidade"
              className={hasError("address.city") ? "border-red-500" : ""}
            />
            {hasError("address.city") && (
              <p className="mt-1 text-sm text-red-500">
                {getErrorMessage("address.city")}
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
              value={getValue("address.state")}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="UF"
              className={hasError("address.state") ? "border-red-500" : ""}
            />
            {hasError("address.state") && (
              <p className="mt-1 text-sm text-red-500">
                {getErrorMessage("address.state")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Termos e Observações */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Termos e Observações</h3>

        <div>
          <label
            htmlFor="paymentTerms"
            className="block text-sm font-medium mb-1"
          >
            Termos de Pagamento
          </label>
          <Textarea
            id="paymentTerms"
            name="paymentTerms"
            value={form.values.paymentTerms || ""}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            placeholder="Prazo de pagamento, condições, etc."
            rows={2}
            className={
              form.touched.paymentTerms && form.errors.paymentTerms
                ? "border-red-500"
                : ""
            }
          />
          {form.touched.paymentTerms && form.errors.paymentTerms && (
            <p className="mt-1 text-sm text-red-500">
              {form.errors.paymentTerms}
            </p>
          )}
        </div>

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
            placeholder="Observações adicionais sobre o fornecedor"
            rows={3}
            className={
              form.touched.notes && form.errors.notes ? "border-red-500" : ""
            }
          />
          {form.touched.notes && form.errors.notes && (
            <p className="mt-1 text-sm text-red-500">{form.errors.notes}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            name="isActive"
            checked={!!form.values.isActive}
            onCheckedChange={(checked) => form.setValue("isActive", !!checked)}
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Fornecedor ativo
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
          {isLoading ? "Salvando..." : "Salvar Fornecedor"}
        </Button>
      </div>
    </form>
  );
}
