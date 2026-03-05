"use server";

import { revalidatePath } from "next/cache";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/validations/schema";
import {
  adjustStockCommand,
  createProductCommand,
  deleteProductCommand,
  updateProductCommand,
} from "@/server/inventory/commands";
import {
  findProductById,
  listLowStockProducts,
  listProducts,
} from "@/server/inventory/queries";

export async function getProducts(options?: {
  query?: string;
  lowStock?: boolean;
}) {
  try {
    const products = await listProducts(options || {});
    return { products };
  } catch {
    return { error: "Falha ao buscar produtos" };
  }
}

export async function getProductById(id: string) {
  try {
    const product = await findProductById(id);

    if (!product) {
      return { error: "Produto não encontrado" };
    }

    return { product };
  } catch {
    return { error: "Falha ao buscar produto" };
  }
}

export async function createProduct(data: CreateProductInput) {
  const parsed = createProductSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
  }

  const result = await createProductCommand(parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { product: result.product };
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const parsed = updateProductSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
  }

  const result = await updateProductCommand(id, parsed.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { product: result.product };
}

export async function adjustStock(id: string, quantity: number) {
  const result = await adjustStockCommand(id, quantity);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true, newStock: result.newStock };
}

export async function deleteProduct(id: string) {
  const result = await deleteProductCommand(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}

export async function getLowStockProducts() {
  try {
    const products = await listLowStockProducts();
    return { products };
  } catch {
    return { error: "Falha ao buscar produtos com estoque baixo" };
  }
}
