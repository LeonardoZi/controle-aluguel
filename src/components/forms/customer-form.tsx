"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useForm } from "@/hooks/use-form";
import { cn } from "@/lib/utils";
import { customerSchema, type CustomerFormValues } from "@/validations/schema";

export type { CustomerFormValues };

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
    taxId: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    isActive: true,
    ...initialData,
  };

  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [localCep, setLocalCep] = useState(defaultValues.postalCode || "");

  const form = useForm<CustomerFormValues>({
    initialValues: defaultValues,
    validationSchema: customerSchema,
    onSubmit,
  });

  const searchCep = useCallback(
    async (cep: string) => {
      const cepNumbers = cep.replace(/\D/g, "");

      if (cepNumbers.length !== 8) {
        setCepError(null);
        return;
      }

      setIsFetchingCep(true);
      setCepError(null);

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepNumbers}/json/`,
        );
        const data = await response.json();

        if (data.erro) {
          setCepError("CEP não encontrado");
          return;
        }

        form.setValue("postalCode", cep);
        form.setValue("address", data.logradouro || "");
        form.setValue("neighborhood", data.bairro || "");
        form.setValue("city", data.localidade || "");
        form.setValue("state", data.uf || "");
        setCepError(null);
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        setCepError("Erro ao buscar CEP. Tente novamente");
      } finally {
        setIsFetchingCep(false);
      }
    },
    [form],
  );

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalCep(value);
    form.setValue("postalCode", value);

    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 8) {
      void searchCep(value);
    }
  };

  const handleFieldChange =
    (field: Exclude<keyof CustomerFormValues, "isActive" | "postalCode">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      form.setValue(field, e.target.value);
    };

  const fieldError = (field: keyof CustomerFormValues) =>
    form.touched[field] && form.errors[field] ? String(form.errors[field]) : "";

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Básicas</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Nome Completo / Razão Social *
            </label>
            <Input
              id="name"
              name="name"
              value={form.values.name}
              onChange={handleFieldChange("name")}
              onBlur={form.handleBlur}
              placeholder="Digite o nome completo"
              className={cn(fieldError("name") && "border-red-500")}
            />
            {fieldError("name") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("name")}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.values.email ?? ""}
              onChange={handleFieldChange("email")}
              onBlur={form.handleBlur}
              placeholder="email@exemplo.com"
              className={cn(fieldError("email") && "border-red-500")}
            />
            {fieldError("email") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("email")}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="taxId" className="mb-1 block text-sm font-medium">
              CPF/CNPJ
            </label>
            <Input
              id="taxId"
              name="taxId"
              value={form.values.taxId ?? ""}
              onChange={handleFieldChange("taxId")}
              onBlur={form.handleBlur}
              placeholder="000.000.000-00"
              className={cn(fieldError("taxId") && "border-red-500")}
            />
            {fieldError("taxId") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("taxId")}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Telefone
            </label>
            <Input
              id="phone"
              name="phone"
              value={form.values.phone ?? ""}
              onChange={handleFieldChange("phone")}
              onBlur={form.handleBlur}
              placeholder="(00) 00000-0000"
              className={cn(fieldError("phone") && "border-red-500")}
            />
            {fieldError("phone") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("phone")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>

        <div>
          <label
            htmlFor="postalCode"
            className="mb-1 block text-sm font-medium"
          >
            CEP
          </label>
          <Input
            id="postalCode"
            name="postalCode"
            type="text"
            inputMode="numeric"
            value={localCep}
            onChange={handleCepChange}
            onBlur={(e) => {
              form.handleBlur(e);
              form.setValue("postalCode", localCep);
            }}
            placeholder="00000-000"
            disabled={isFetchingCep}
            maxLength={9}
            className={cn(fieldError("postalCode") && "border-red-500")}
          />
          {isFetchingCep && (
            <p className="mt-1 text-sm text-blue-500">Buscando endereço...</p>
          )}
          {cepError && <p className="mt-1 text-sm text-red-500">{cepError}</p>}
          {!cepError && fieldError("postalCode") && (
            <p className="mt-1 text-sm text-red-500">
              {fieldError("postalCode")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium">
              Rua/Avenida
            </label>
            <Input
              id="address"
              name="address"
              value={form.values.address ?? ""}
              onChange={handleFieldChange("address")}
              onBlur={form.handleBlur}
              placeholder="Nome da rua"
              className={cn(fieldError("address") && "border-red-500")}
            />
            {fieldError("address") && (
              <p className="mt-1 text-sm text-red-500">
                {fieldError("address")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="number"
                className="mb-1 block text-sm font-medium"
              >
                Número
              </label>
              <Input
                id="number"
                name="number"
                value={form.values.number ?? ""}
                onChange={handleFieldChange("number")}
                onBlur={form.handleBlur}
                placeholder="Número"
                className={cn(fieldError("number") && "border-red-500")}
              />
              {fieldError("number") && (
                <p className="mt-1 text-sm text-red-500">
                  {fieldError("number")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="complement"
                className="mb-1 block text-sm font-medium"
              >
                Complemento
              </label>
              <Input
                id="complement"
                name="complement"
                value={form.values.complement ?? ""}
                onChange={handleFieldChange("complement")}
                onBlur={form.handleBlur}
                placeholder="Apto, bloco, etc."
                className={cn(fieldError("complement") && "border-red-500")}
              />
              {fieldError("complement") && (
                <p className="mt-1 text-sm text-red-500">
                  {fieldError("complement")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="neighborhood"
              className="mb-1 block text-sm font-medium"
            >
              Bairro
            </label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={form.values.neighborhood ?? ""}
              onChange={handleFieldChange("neighborhood")}
              onBlur={form.handleBlur}
              placeholder="Bairro"
              className={cn(fieldError("neighborhood") && "border-red-500")}
            />
            {fieldError("neighborhood") && (
              <p className="mt-1 text-sm text-red-500">
                {fieldError("neighborhood")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium">
                Cidade
              </label>
              <Input
                id="city"
                name="city"
                value={form.values.city ?? ""}
                onChange={handleFieldChange("city")}
                onBlur={form.handleBlur}
                placeholder="Cidade"
                className={cn(fieldError("city") && "border-red-500")}
              />
              {fieldError("city") && (
                <p className="mt-1 text-sm text-red-500">
                  {fieldError("city")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="mb-1 block text-sm font-medium">
                Estado
              </label>
              <Input
                id="state"
                name="state"
                value={form.values.state ?? ""}
                onChange={handleFieldChange("state")}
                onBlur={form.handleBlur}
                placeholder="UF"
                maxLength={2}
                className={cn(fieldError("state") && "border-red-500")}
              />
              {fieldError("state") && (
                <p className="mt-1 text-sm text-red-500">
                  {fieldError("state")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          name="isActive"
          checked={form.values.isActive}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Cliente ativo
        </label>
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
