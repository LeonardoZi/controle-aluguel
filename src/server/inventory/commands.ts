import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import type { CreateProductInput, UpdateProductInput } from "@/validations/schema";
import type { ProductDto } from "@/server/contracts/v1/inventory";
import { toProductDto } from "@/server/inventory/mappers";

export async function createProductCommand(
  payload: CreateProductInput,
): Promise<{ product?: ProductDto; error?: string }> {
  try {
    const product = await prisma.product.create({
      data: {
        name: payload.name,
        description: payload.description,
        precoUnitario: new Decimal(payload.precoUnitario),
        currentStock: payload.currentStock,
        unit: payload.unit || "un",
      },
    });

    return {
      product: toProductDto(product),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao criar produto",
    };
  }
}

export async function updateProductCommand(
  id: string,
  payload: UpdateProductInput,
): Promise<{ product?: ProductDto; error?: string }> {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return { error: "Produto não encontrado" };
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
        ...(payload.precoUnitario !== undefined
          ? { precoUnitario: new Decimal(payload.precoUnitario) }
          : {}),
        ...(payload.currentStock !== undefined
          ? { currentStock: payload.currentStock }
          : {}),
        ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
      },
    });

    return {
      product: toProductDto(product),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao atualizar produto",
    };
  }
}

export async function adjustStockCommand(
  id: string,
  quantity: number,
): Promise<{ success?: true; newStock?: number; error?: string }> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { error: "Produto não encontrado" };
    }

    const newStock = product.currentStock + quantity;

    if (newStock < 0) {
      return { error: "Estoque não pode ser negativo" };
    }

    await prisma.product.update({
      where: { id },
      data: { currentStock: newStock },
    });

    return {
      success: true,
      newStock,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao ajustar estoque",
    };
  }
}

export async function deleteProductCommand(
  id: string,
): Promise<{ success?: true; error?: string }> {
  try {
    const salesCount = await prisma.itensVenda.count({
      where: { produtoId: id },
    });

    if (salesCount > 0) {
      return {
        error: `Não é possível excluir este produto pois ele está associado a ${salesCount} venda(s).`,
      };
    }

    await prisma.product.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao deletar produto",
    };
  }
}
