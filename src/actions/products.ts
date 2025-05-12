"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

// Função para buscar produtos com filtros opcionais
export async function getProducts(options?: {
  query?: string;
  categoryId?: string;
  lowStock?: boolean;
}) {
  try {
    const { query, categoryId, lowStock } = options || {};

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { sku: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(lowStock === true
          ? { currentStock: { lte: prisma.product.fields.minimumStock } }
          : {}),
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: "asc" },
    });

    return { products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { error: "Falha ao buscar produtos" };
  }
}

// Função para buscar um produto pelo ID
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        priceHistory: {
          orderBy: { effectiveDate: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return { error: "Produto não encontrado" };
    }

    return { product };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { error: "Falha ao buscar produto" };
  }
}

// Função para criar um novo produto
export async function createProduct(data: {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  supplierId?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  location?: string;
  barcode?: string;
}) {
  try {
    // Verificar se o SKU já existe
    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingProduct) {
      return { error: "Já existe um produto com este SKU" };
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
      },
    });

    // Registrar a entrada inicial no estoque, se houver
    if (data.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: data.currentStock,
          type: "ADJUSTMENT",
          notes: "Estoque inicial",
          userId: "system", // Idealmente, deveria ser o ID do usuário atual
        },
      });
    }

    revalidatePath("/inventory");
    return { product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: "Falha ao criar produto" };
  }
}

// Função para atualizar um produto
export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    categoryId?: string;
    supplierId?: string;
    purchasePrice?: number | Decimal;
    sellingPrice?: number | Decimal;
    minimumStock?: number;
    unit?: string;
    location?: string;
    barcode?: string;
    isActive?: boolean;
  }
) {
  try {
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return { error: "Produto não encontrado" };
    }

    // Verificar se há alteração de preço
    const priceChange =
      (data.purchasePrice !== undefined &&
        !existingProduct.purchasePrice.equals(
          new Decimal(data.purchasePrice.toString())
        )) ||
      (data.sellingPrice !== undefined &&
        !existingProduct.sellingPrice.equals(
          new Decimal(data.sellingPrice.toString())
        ));

    // Atualizar o produto com uma transação para também atualizar o histórico de preços se necessário
    const product = await prisma.$transaction(async (tx) => {
      // Atualizar o produto
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...data,
          ...(data.purchasePrice
            ? { purchasePrice: new Decimal(data.purchasePrice.toString()) }
            : {}),
          ...(data.sellingPrice
            ? { sellingPrice: new Decimal(data.sellingPrice.toString()) }
            : {}),
        },
      });

      // Registrar o histórico de preços se houver alteração
      if (priceChange) {
        await tx.priceHistory.create({
          data: {
            productId: updatedProduct.id,
            purchasePrice: updatedProduct.purchasePrice,
            sellingPrice: updatedProduct.sellingPrice,
            notes: "Atualização de preço",
          },
        });
      }

      return updatedProduct;
    });

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { product };
  } catch (error) {
    console.error("Error updating product:", error);
    return { error: "Falha ao atualizar produto" };
  }
}

// Função para ajustar o estoque de um produto
export async function adjustStock(
  id: string,
  quantity: number,
  notes: string,
  userId: string
) {
  try {
    // Buscar o produto atual
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { error: "Produto não encontrado" };
    }

    // Calcular o novo estoque
    const newStock = product.currentStock + quantity;

    if (newStock < 0) {
      return { error: "Estoque não pode ser negativo" };
    }

    // Atualizar o estoque e registrar o movimento em uma transação
    await prisma.$transaction([
      // Atualizar o estoque
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock },
      }),

      // Registrar o movimento
      prisma.stockMovement.create({
        data: {
          productId: id,
          quantity,
          type: "ADJUSTMENT",
          userId,
          notes,
        },
      }),
    ]);

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { success: true, newStock };
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return { error: "Falha ao ajustar estoque" };
  }
}

// Função para desativar um produto (soft delete)
export async function deleteProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: "Falha ao deletar produto" };
  }
}

// Função para obter relatório de produtos com baixo estoque
export async function getLowStockProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: { lte: prisma.product.fields.minimumStock },
      },
      include: {
        category: true,
      },
      orderBy: { currentStock: "asc" },
    });

    return { products };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return { error: "Falha ao buscar produtos com estoque baixo" };
  }
}

// Função para buscar todas as categorias
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return { categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { error: "Falha ao buscar categorias" };
  }
}

// Função para criar uma nova categoria
export async function createCategory(data: {
  name: string;
  description?: string;
}) {
  try {
    const category = await prisma.category.create({
      data,
    });

    revalidatePath("/inventory/categories");
    return { success: true, category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { error: "Falha ao criar categoria" };
  }
}

// Função para atualizar uma categoria
export async function updateCategory(
  id: string,
  data: { name: string; description?: string }
) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    revalidatePath("/inventory/categories");
    return { success: true, category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { error: "Falha ao atualizar categoria" };
  }
}

// Função para deletar uma categoria
export async function deleteCategory(id: string) {
  try {
    // Verificar se existem produtos associados a esta categoria
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return {
        error: `Não é possível excluir esta categoria pois existem ${productsCount} produtos associados a ela.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: "Falha ao excluir categoria" };
  }
}
