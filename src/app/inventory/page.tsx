"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { getProducts, deleteProduct } from "@/actions/products";

// Types
interface Product {
  id: string;
  name: string;
  description?: string | null;
  precoUnitario: Decimal | number;
  currentStock: number;
  unit: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await getProducts({
          query: searchTerm || undefined,
          lowStock: lowStockFilter || undefined,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setProducts(result.products || []);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        setError("Ocorreu um erro ao carregar os produtos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm, lowStockFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      return;
    }

    try {
      const result = await deleteProduct(id);

      if (result.error) {
        throw new Error(result.error);
      }

      alert("Produto excluído com sucesso!");
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert(
        err instanceof Error ? err.message : "Erro ao excluir produto"
      );
    }
  };

  const formatCurrency = (value: Decimal | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Link href="/" className="text-blue-600 hover:underline mr-4">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>

        <Link
          href="/inventory/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Novo Produto
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Nome ou descrição..."
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Apenas estoque baixo (≤10)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchTerm || lowStockFilter
              ? "Nenhum produto encontrado com os filtros aplicados."
              : "Não há produtos cadastrados."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${
                      product.currentStock <= 10 ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-gray-500">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`text-sm font-semibold ${
                          product.currentStock <= 10
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {product.unit}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(product.precoUnitario)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link
                        href={`/inventory/${product.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-sm text-gray-500">Total de Produtos:</span>
              <p className="text-lg font-semibold">{products.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Estoque Total:</span>
              <p className="text-lg font-semibold">
                {products.reduce((sum, p) => sum + p.currentStock, 0)} itens
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Estoque Baixo:</span>
              <p className="text-lg font-semibold text-red-600">
                {products.filter((p) => p.currentStock <= 10).length} produtos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}