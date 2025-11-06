"use client";

import { z } from "zod";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

export type CustomerFormValues = z.infer<typeof customerSchema>;

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

  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [localCep, setLocalCep] = useState(defaultValues.address.zipCode || "");

  useState(() => {
    if (initialData?.address?.zipCode) {
      setLocalCep(initialData.address.zipCode);
    }
  });

  const form = useForm<CustomerFormValues>({
    initialValues: defaultValues,
    validationSchema: customerSchema as z.ZodType<CustomerFormValues>,
    onSubmit: async (values) => {
      console.log("✅ Form validation passed! Submitting:", values);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("❌ Error in onSubmit:", error);
      }
    },
  });

  const searchCep = useCallback(async (cep: string) => {
    const cepNumbers = cep.replace(/\D/g, "");

    if (cepNumbers.length !== 8) {
      setCepError(null);
      return;
    }

    setIsFetchingCep(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
      } else {
        const updatedAddress = {
          ...form.values.address,
          zipCode: cep,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        };
        form.setValue("address", updatedAddress);
        setLocalCep(cep);
        setCepError(null);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError("Erro ao buscar CEP. Tente novamente");
    } finally {
      setIsFetchingCep(false);
    }
  }, [form]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    setLocalCep(value);
    
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 8) {
      searchCep(value);
    }
  };

  const handleAddressChange = (field: keyof CustomerFormValues["address"]) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      form.setValue("address", {
        ...form.values.address,
        [field]: e.target.value,
      });
    };

  const handleFieldChange = (field: keyof Omit<CustomerFormValues, "address" | "isActive">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      form.setValue(field, e.target.value);
    };

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
      return error !== undefined && error !== null ? String(error) : "";
    }
    return "";
  };

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
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
              onChange={handleFieldChange("name")}
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
              onChange={handleFieldChange("email")}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="document" className="block text-sm font-medium mb-1">
              CPF/CNPJ *
            </label>
            <Input
              id="document"
              name="document"
              value={form.values.document}
              onChange={handleFieldChange("document")}
              onBlur={form.handleBlur}
              placeholder="000.000.000-00"
              className={cn(
                form.touched.document && form.errors.document && "border-red-500"
              )}
            />
            {form.touched.document && form.errors.document && (
              <p className="mt-1 text-sm text-red-500">{form.errors.document}</p>
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
              onChange={handleFieldChange("phone")}
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
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.zipCode" className="block text-sm font-medium mb-1">
              CEP *
            </label>
            <input
              id="address.zipCode"
              name="address.zipCode"
              type="text"
              inputMode="numeric"
              value={localCep || ""}
              onChange={handleCepChange}
              onBlur={(e) => {
                const newAddress = { ...form.values.address };
                newAddress.zipCode = localCep;
                form.setValue("address", newAddress);
                form.handleBlur(e);
              }}
              placeholder="00000-000"
              disabled={isFetchingCep}
              maxLength={9}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                hasAddressFieldError("zipCode") && "border-red-500"
              )}
            />
            {isFetchingCep && (
              <p className="mt-1 text-sm text-blue-500">Buscando endereço...</p>
            )}
            {cepError && (
              <p className="mt-1 text-sm text-red-500">{cepError}</p>
            )}
            {hasAddressFieldError("zipCode") && !cepError && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("zipCode")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.street" className="block text-sm font-medium mb-1">
              Rua/Avenida *
            </label>
            <Input
              id="address.street"
              name="address.street"
              value={form.values.address.street}
              onChange={handleAddressChange("street")}
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
              <label htmlFor="address.number" className="block text-sm font-medium mb-1">
                Número *
              </label>
              <Input
                id="address.number"
                name="address.number"
                value={form.values.address.number}
                onChange={handleAddressChange("number")}
                onBlur={form.handleBlur}
                placeholder="Número"
                className={cn(hasAddressFieldError("number") && "border-red-500")}
              />
              {hasAddressFieldError("number") && (
                <p className="mt-1 text-sm text-red-500">
                  {getAddressFieldError("number")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address.complement" className="block text-sm font-medium mb-1">
                Complemento
              </label>
              <Input
                id="address.complement"
                name="address.complement"
                value={form.values.address.complement}
                onChange={handleAddressChange("complement")}
                onBlur={form.handleBlur}
                placeholder="Apto, Bloco, etc."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.neighborhood" className="block text-sm font-medium mb-1">
              Bairro *
            </label>
            <Input
              id="address.neighborhood"
              name="address.neighborhood"
              value={form.values.address.neighborhood}
              onChange={handleAddressChange("neighborhood")}
              onBlur={form.handleBlur}
              placeholder="Bairro"
              className={cn(hasAddressFieldError("neighborhood") && "border-red-500")}
            />
            {hasAddressFieldError("neighborhood") && (
              <p className="mt-1 text-sm text-red-500">
                {getAddressFieldError("neighborhood")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="address.city" className="block text-sm font-medium mb-1">
                Cidade *
              </label>
              <Input
                id="address.city"
                name="address.city"
                value={form.values.address.city}
                onChange={handleAddressChange("city")}
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
              <label htmlFor="address.state" className="block text-sm font-medium mb-1">
                Estado *
              </label>
              <Input
                id="address.state"
                name="address.state"
                value={form.values.address.state}
                onChange={handleAddressChange("state")}
                onBlur={form.handleBlur}
                placeholder="UF"
                maxLength={2}
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
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Observações
          </label>
          <Textarea
            id="notes"
            name="notes"
            value={form.values.notes || ""}
            onChange={handleFieldChange("notes")}
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