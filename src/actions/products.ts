"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

// Get products with optional filters
export async function getProducts(options?: {
  query?: string;
  lowStock?: boolean;
}) {
  try {
    const { query, lowStock } = options || {};

    const products = await prisma.product.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(lowStock === true
          ? { currentStock: { lte: 10 } }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    // Serialize Decimal objects to numbers
    const serializedProducts = products.map((product) => ({
      ...product,
      precoUnitario: Number(product.precoUnitario),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

    return { products: serializedProducts };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { error: "Falha ao buscar produtos" };
  }
}

// Get a single product by ID
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        itensDeVenda: {
          include: {
            sale: {
              include: {
                customer: true,
              },
            },
          },
          orderBy: {
            sale: {
              dataRetirada: "desc",
            },
          },
          take: 10,
        },
      },
    });

    if (!product) {
      return { error: "Produto não encontrado" };
    }

    // Serialize Decimal objects
    const serializedProduct = {
      ...product,
      precoUnitario: Number(product.precoUnitario),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      itensDeVenda: product.itensDeVenda.map((item) => ({
        ...item,
        precoUnitarioNoMomento: Number(item.precoUnitarioNoMomento),
        sale: {
          ...item.sale,
          totalAmount: item.sale.totalAmount ? Number(item.sale.totalAmount) : null,
          dataRetirada: item.sale.dataRetirada.toISOString(),
          dataDevolucaoPrevista: item.sale.dataDevolucaoPrevista.toISOString(),
          createdAt: item.sale.createdAt.toISOString(),
          updatedAt: item.sale.updatedAt.toISOString(),
          customer: {
            ...item.sale.customer,
            createdAt: item.sale.customer.createdAt.toISOString(),
            updatedAt: item.sale.customer.updatedAt.toISOString(),
          },
        },
      })),
    };

    return { product: serializedProduct };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { error: "Falha ao buscar produto" };
  }
}

// Create a new product
export async function createProduct(data: {
  name: string;
  description?: string;
  precoUnitario: number;
  currentStock?: number;
  unit?: string;
}) {
  try {
    // Validate required fields
    if (!data.name) {
      return { error: "Nome é obrigatório" };
    }

    if (!data.precoUnitario || data.precoUnitario <= 0) {
      return { error: "Preço unitário deve ser maior que zero" };
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        precoUnitario: new Decimal(data.precoUnitario),
        currentStock: data.currentStock || 0,
        unit: data.unit || "un",
      },
    });

    const serializedProduct = {
      ...product,
      precoUnitario: Number(product.precoUnitario),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    revalidatePath("/inventory");
    return { product: serializedProduct };
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: "Falha ao criar produto" };
  }
}

// Update a product
export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    precoUnitario?: number | Decimal;
    currentStock?: number;
    unit?: string;
  }
) {
  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return { error: "Produto não encontrado" };
    }

    // Update the product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.precoUnitario !== undefined
          ? { precoUnitario: new Decimal(data.precoUnitario.toString()) }
          : {}),
        ...(data.currentStock !== undefined ? { currentStock: data.currentStock } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
      },
    });

    const serializedProduct = {
      ...product,
      precoUnitario: Number(product.precoUnitario),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { product: serializedProduct };
  } catch (error) {
    console.error("Error updating product:", error);
    return { error: "Falha ao atualizar produto" };
  }
}

// Adjust product stock
export async function adjustStock(
  id: string,
  quantity: number,
  notes: string
) {
  try {
    // Get current product
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { error: "Produto não encontrado" };
    }

    // Calculate new stock
    const newStock = product.currentStock + quantity;

    if (newStock < 0) {
      return { error: "Estoque não pode ser negativo" };
    }

    // Update stock
    await prisma.product.update({
      where: { id },
      data: { currentStock: newStock },
    });

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { success: true, newStock };
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return { error: "Falha ao ajustar estoque" };
  }
}

// Delete a product (hard delete since we simplified the schema)
export async function deleteProduct(id: string) {
  try {
    // Check if product is used in any sales
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

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: "Falha ao deletar produto" };
  }
}

// Get low stock products report
export async function getLowStockProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        currentStock: {
          lte: 10,
        },
      },
      orderBy: [
        {
          currentStock: "asc",
        },
      ],
    });

    // Serialize Decimal objects
    const serializedProducts = products.map((product) => ({
      ...product,
      precoUnitario: Number(product.precoUnitario),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

    return { products: serializedProducts };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return { error: "Failed to fetch low stock products" };
  }
}
