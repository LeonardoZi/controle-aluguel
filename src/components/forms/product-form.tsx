"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "@/hooks/use-form";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

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
  min,
  step,
}: {
  id: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  min?: string;
  step?: string;
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
    min={min}
    step={step}
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

const Select = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  className,
  children,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLSelectElement>) => void;
  className?: string;
  children: React.ReactNode;
}) => (
  <select
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    className={cn("w-full px-3 py-2 border rounded", className)}
  >
    {children}
  </select>
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

const productSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome não pode exceder 100 caracteres"),
  sku: z
    .string()
    .min(3, "SKU deve ter pelo menos 3 caracteres")
    .max(20, "SKU não pode exceder 20 caracteres"),
  description: z
    .string()
    .max(500, "Descrição não pode exceder 500 caracteres")
    .optional(),
  price: z.coerce
    .number()
    .min(0.01, "Preço deve ser maior que zero")
    .max(99999.99, "Preço não pode exceder 99.999,99"),
  cost: z.coerce
    .number()
    .min(0, "Custo não pode ser negativo")
    .max(99999.99, "Custo não pode exceder 99.999,99"),
  stock: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .min(0, "Estoque não pode ser negativo"),
  stockThreshold: z.coerce
    .number()
    .int("Limite de estoque deve ser um número inteiro")
    .min(0, "Limite de estoque não pode ser negativo"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  supplierId: z.string().min(1, "Selecione um fornecedor"),
  imageUrl: z
    .string()
    .url("URL de imagem inválida")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(50, "Localização não pode exceder 50 caracteres")
    .optional(),
  isActive: z.boolean(),
  featured: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormValues>;
  onSubmit: (data: ProductFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  categories: Category[];
  suppliers: Supplier[];
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  categories,
  suppliers,
}: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const defaultValues: ProductFormValues = {
    name: "",
    sku: "",
    description: "",
    price: 0,
    cost: 0,
    stock: 0,
    stockThreshold: 5,
    categoryId: "",
    supplierId: "",
    imageUrl: "",
    location: "",
    isActive:
      initialData?.isActive !== undefined ? !!initialData.isActive : true,
    featured:
      initialData?.featured !== undefined ? !!initialData.featured : false,
  };

  const form = useForm<ProductFormValues>({
    initialValues: defaultValues,
    validationSchema: productSchema,
    onSubmit,
  });

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("imageUrl", url);
    setImagePreview(url || null);
  };

  const calculateProfit = () => {
    const price = form.values.price;
    const cost = form.values.cost;

    if (!price || !cost || cost === 0) return "N/A";

    const profitMargin = ((price - cost) / price) * 100;
    return `${profitMargin.toFixed(2)}%`;
  };

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Básicas</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome do Produto *
            </label>
            <Input
              id="name"
              name="name"
              value={form.values.name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Digite o nome do produto"
              className={
                form.touched.name && form.errors.name ? "border-red-500" : ""
              }
            />
            {form.touched.name && form.errors.name && (
              <p className="mt-1 text-sm text-red-500">{form.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              SKU / Código *
            </label>
            <Input
              id="sku"
              name="sku"
              value={form.values.sku}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Código único do produto"
              className={
                form.touched.sku && form.errors.sku ? "border-red-500" : ""
              }
            />
            {form.touched.sku && form.errors.sku && (
              <p className="mt-1 text-sm text-red-500">{form.errors.sku}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Descrição
          </label>
          <Textarea
            id="description"
            name="description"
            value={form.values.description || ""}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            placeholder="Descrição detalhada do produto"
            rows={3}
            className={
              form.touched.description && form.errors.description
                ? "border-red-500"
                : ""
            }
          />
          {form.touched.description && form.errors.description && (
            <p className="mt-1 text-sm text-red-500">
              {form.errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium mb-1"
            >
              Categoria *
            </label>
            <Select
              id="categoryId"
              name="categoryId"
              value={form.values.categoryId}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={
                form.touched.categoryId && form.errors.categoryId
                  ? "border-red-500"
                  : ""
              }
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {form.touched.categoryId && form.errors.categoryId && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.categoryId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="supplierId"
              className="block text-sm font-medium mb-1"
            >
              Fornecedor *
            </label>
            <Select
              id="supplierId"
              name="supplierId"
              value={form.values.supplierId}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={
                form.touched.supplierId && form.errors.supplierId
                  ? "border-red-500"
                  : ""
              }
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
            {form.touched.supplierId && form.errors.supplierId && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.supplierId}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Preços e Estoque</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Preço de Venda (R$) *
            </label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.values.price}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="0,00"
              className={
                form.touched.price && form.errors.price ? "border-red-500" : ""
              }
            />
            {form.touched.price && form.errors.price && (
              <p className="mt-1 text-sm text-red-500">{form.errors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="cost" className="block text-sm font-medium mb-1">
              Custo (R$) *
            </label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              value={form.values.cost}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="0,00"
              className={
                form.touched.cost && form.errors.cost ? "border-red-500" : ""
              }
            />
            {form.touched.cost && form.errors.cost && (
              <p className="mt-1 text-sm text-red-500">{form.errors.cost}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Margem de Lucro
            </label>
            <div className="h-10 px-3 py-2 rounded-md border bg-gray-50 flex items-center">
              {calculateProfit()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="stock" className="block text-sm font-medium mb-1">
              Quantidade em Estoque *
            </label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.values.stock}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="0"
              className={
                form.touched.stock && form.errors.stock ? "border-red-500" : ""
              }
            />
            {form.touched.stock && form.errors.stock && (
              <p className="mt-1 text-sm text-red-500">{form.errors.stock}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="stockThreshold"
              className="block text-sm font-medium mb-1"
            >
              Estoque Mínimo *
            </label>
            <Input
              id="stockThreshold"
              name="stockThreshold"
              type="number"
              min="0"
              step="1"
              value={form.values.stockThreshold}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="0"
              className={
                form.touched.stockThreshold && form.errors.stockThreshold
                  ? "border-red-500"
                  : ""
              }
            />
            {form.touched.stockThreshold && form.errors.stockThreshold && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.stockThreshold}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium mb-1"
            >
              Localização no Estoque
            </label>
            <Input
              id="location"
              name="location"
              value={form.values.location || ""}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Prateleira/Setor"
              className={
                form.touched.location && form.errors.location
                  ? "border-red-500"
                  : ""
              }
            />
            {form.touched.location && form.errors.location && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Imagem e Configurações</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium mb-1"
            >
              URL da Imagem
            </label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={form.values.imageUrl || ""}
              onChange={handleImageUrlChange}
              onBlur={form.handleBlur}
              placeholder="https://exemplo.com/imagem.jpg"
              className={
                form.touched.imageUrl && form.errors.imageUrl
                  ? "border-red-500"
                  : ""
              }
            />
            {form.touched.imageUrl && form.errors.imageUrl && (
              <p className="mt-1 text-sm text-red-500">
                {form.errors.imageUrl}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center border rounded-md h-40 bg-gray-50">
            {imagePreview ? (
              <div className="h-full w-full relative">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-contain"
                  onError={() => setImagePreview(null)}
                />
              </div>
            ) : (
              <span className="text-gray-400">Preview da imagem</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              name="isActive"
              checked={!!form.values.isActive}
              onCheckedChange={(checked) =>
                form.setValue("isActive", !!checked)
              }
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Produto ativo
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              name="featured"
              checked={!!form.values.featured}
              onCheckedChange={(checked) =>
                form.setValue("featured", !!checked)
              }
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Produto em destaque
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </form>
  );
}
