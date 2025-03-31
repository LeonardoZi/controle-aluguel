"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

// Função para buscar produtos com filtros opcionais
export async function getProducts(options?: {
  query?: string;
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
}) {
  try {
    const { query, categoryId, supplierId, lowStock } = options || {};

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
        ...(supplierId ? { supplierId } : {}),
        ...(lowStock
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
  description?: string;
  categoryId: string;
  supplierId?: string;
  purchasePrice: number | Decimal;
  sellingPrice: number | Decimal;
  currentStock: number;
  minimumStock: number;
  unit: string;
  location?: string;
  barcode?: string;
}) {
  try {
    // Verificar se o SKU já existe
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return { error: "SKU já está em uso" };
    }

    // Criar o produto com uma transação para também registrar o histórico de preços
    const product = await prisma.$transaction(async (tx) => {
      // Criar o produto
      const newProduct = await tx.product.create({
        data: {
          ...data,
          purchasePrice: new Decimal(data.purchasePrice.toString()),
          sellingPrice: new Decimal(data.sellingPrice.toString()),
        },
      });

      // Registrar o histórico de preços inicial
      await tx.priceHistory.create({
        data: {
          productId: newProduct.id,
          purchasePrice: new Decimal(data.purchasePrice.toString()),
          sellingPrice: new Decimal(data.sellingPrice.toString()),
          notes: "Preço inicial do produto",
        },
      });

      // Registrar a entrada inicial no estoque, se houver
      if (data.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            quantity: data.currentStock,
            type: "ADJUSTMENT",
            userId: "system", // Idealmente, deveria ser o ID do usuário atual
            notes: "Estoque inicial",
          },
        });
      }

      return newProduct;
    });

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
        supplier: true,
      },
      orderBy: { currentStock: "asc" },
    });

    return { products };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return { error: "Falha ao buscar produtos com baixo estoque" };
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
