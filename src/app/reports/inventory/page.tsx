"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  currentStock: number;
  minStock?: number | null;
  maxStock?: number | null;
  costPrice?: Decimal | number | null;
  sellingPrice?: Decimal | number | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  supplier?: {
    id: string;
    companyName: string;
  } | null;
  lastPurchaseDate?: Date | string | null;
  lastSaleDate?: Date | string | null;
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageValue: number;
  highestValueProduct: {
    id: string;
    name: string;
    value: number;
  };
}

export default function InventoryReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Categorias
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products").then((res) => res.json()),
          fetch("/api/categories").then((res) => res.json()),
        ]);

        if (productsRes.error) throw new Error(productsRes.error);
        if (categoriesRes.error) throw new Error(categoriesRes.error);

        setProducts(productsRes.products || []);
        setCategories(categoriesRes.categories || []);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Ocorreu um erro ao carregar os dados do relatório.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Formatar valor como moeda
  const formatCurrency = (value: Decimal | number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  // Formatar data
  const formatDate = (date?: Date | string | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Filtro de texto
        const matchesSearch =
          searchTerm === "" ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro de categoria
        const matchesCategory =
          !categoryFilter || product.categoryId === categoryFilter;

        // Filtro de estoque
        let matchesStock = true;
        if (
          stockFilter === "low" &&
          product.minStock !== null &&
          product.minStock !== undefined
        ) {
          matchesStock = product.currentStock <= product.minStock;
        } else if (stockFilter === "out") {
          matchesStock = product.currentStock <= 0;
        } else if (
          stockFilter === "excess" &&
          product.maxStock !== null &&
          product.maxStock !== undefined
        ) {
          matchesStock = product.currentStock > product.maxStock;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortBy === "stock") {
          return sortOrder === "asc"
            ? a.currentStock - b.currentStock
            : b.currentStock - a.currentStock;
        } else if (sortBy === "value") {
          const aValue = Number(a.costPrice || 0) * a.currentStock;
          const bValue = Number(b.costPrice || 0) * b.currentStock;
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
  }, [products, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  // Estatísticas do inventário
  const inventoryStats: InventoryStats = useMemo(() => {
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let highestValue = 0;
    let highestValueProduct = { id: "", name: "", value: 0 };

    products.forEach((product) => {
      const productValue =
        Number(product.costPrice || 0) * product.currentStock;
      totalValue += productValue;

      if (product.currentStock <= 0) {
        outOfStockCount++;
      } else if (
        product.minStock !== null &&
        product.minStock !== undefined &&
        product.currentStock <= product.minStock
      ) {
        lowStockCount++;
      }

      if (productValue > highestValue) {
        highestValue = productValue;
        highestValueProduct = {
          id: product.id,
          name: product.name,
          value: productValue,
        };
      }
    });

    return {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      averageValue: products.length > 0 ? totalValue / products.length : 0,
      highestValueProduct,
    };
  }, [products]);

  // Função para exportar CSV
  const exportCSV = () => {
    if (filteredProducts.length === 0) return;

    const headers = [
      "SKU",
      "Nome",
      "Categoria",
      "Estoque Atual",
      "Estoque Mínimo",
      "Estoque Máximo",
      "Custo Unitário",
      "Valor Total",
      "Fornecedor",
      "Última Compra",
      "Última Venda",
    ];

    const rows = filteredProducts.map((product) => [
      product.sku,
      product.name,
      product.category?.name || "-",
      product.currentStock.toString(),
      (product.minStock || "-").toString(),
      (product.maxStock || "-").toString(),
      product.costPrice ? Number(product.costPrice).toString() : "-",
      (Number(product.costPrice || 0) * product.currentStock).toString(),
      product.supplier?.companyName || "-",
      product.lastPurchaseDate
        ? new Date(product.lastPurchaseDate).toLocaleDateString("pt-BR")
        : "-",
      product.lastSaleDate
        ? new Date(product.lastSaleDate).toLocaleDateString("pt-BR")
        : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `relatorio_inventario_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando dados do inventário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/" className="text-blue-600 hover:underline block mb-2">
            ← Voltar
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Relatório de Inventário
          </h1>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredProducts.length === 0}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Total de Produtos
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {inventoryStats.totalProducts}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Valor Total em Estoque
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(inventoryStats.totalValue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Produtos com Estoque Baixo
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {inventoryStats.lowStockCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Produtos sem Estoque
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {inventoryStats.outOfStockCount}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Nome ou SKU..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status de Estoque
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="all">Todos</option>
              <option value="low">Estoque Baixo</option>
              <option value="out">Sem Estoque</option>
              <option value="excess">Estoque Excedente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              >
                <option value="name">Nome</option>
                <option value="stock">Estoque</option>
                <option value="value">Valor</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 border border-gray-300 rounded"
                aria-label="Toggle sort order"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            Nenhum produto encontrado com os filtros aplicados.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("");
              setStockFilter("all");
            }}
            className="text-blue-600 hover:underline mt-2"
          >
            Limpar filtros
          </button>
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
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mín/Máx
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Unit.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Movim.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus =
                    product.currentStock <= 0
                      ? "text-red-600"
                      : product.minStock !== null &&
                        product.minStock !== undefined &&
                        product.currentStock <= product.minStock
                      ? "text-yellow-600"
                      : product.maxStock !== null &&
                        product.maxStock !== undefined &&
                        product.currentStock > product.maxStock
                      ? "text-blue-600"
                      : "text-green-600";

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.sku}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {product.category?.name || "-"}
                      </td>
                      <td
                        className={`px-4 py-4 whitespace-nowrap text-center text-sm font-medium ${stockStatus}`}
                      >
                        {product.currentStock}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {product.minStock !== null &&
                        product.minStock !== undefined
                          ? product.minStock
                          : "-"}
                        /
                        {product.maxStock !== null &&
                        product.maxStock !== undefined
                          ? product.maxStock
                          : "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(
                          Number(product.costPrice || 0) * product.currentStock
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {formatDate(
                          product.lastPurchaseDate || product.lastSaleDate
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
