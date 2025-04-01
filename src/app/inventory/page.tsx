"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProducts, getLowStockProducts } from "@/actions/products";
import { DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import React, { ReactNode } from "react";

// Tipo para os dados de produto com índice dinâmico
type ProductData = Record<string, unknown>;

// Tipo para as colunas da tabela
interface DataTableColumnType<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => ReactNode;
  sortable?: boolean;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const result = showLowStock
          ? await getLowStockProducts()
          : await getProducts({
              query: searchTerm,
              lowStock: false,
            });

        if (result.error) {
          setError(result.error);
        } else {
          setProducts(result.products || []);
        }
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        setError("Ocorreu um erro ao carregar os produtos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm, showLowStock]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const toggleLowStockFilter = () => {
    setShowLowStock(!showLowStock);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função auxiliar para obter o nome da categoria com segurança
  const getCategoryName = (category: unknown): string => {
    if (
      category &&
      typeof category === "object" &&
      "name" in category &&
      typeof category.name === "string"
    ) {
      return category.name;
    }
    return "-";
  };

  const columns: DataTableColumnType<ProductData>[] = [
    {
      header: "SKU",
      accessorKey: "sku",
      sortable: true,
    },
    {
      header: "Produto",
      accessorKey: "name",
      sortable: true,
    },
    {
      header: "Categoria",
      accessorKey: "category",
      cell: (product: ProductData): ReactNode =>
        getCategoryName(product.category),
    },
    {
      header: "Estoque",
      accessorKey: "currentStock",
      sortable: true,
      cell: (product: ProductData): ReactNode => (
        <span
          className={
            Number(product.currentStock) <= Number(product.minimumStock)
              ? "text-red-600 font-medium"
              : ""
          }
        >
          {String(product.currentStock)} {String(product.unit || "")}
        </span>
      ),
    },
    {
      header: "Preço",
      accessorKey: "sellingPrice",
      sortable: true,
      cell: (product: ProductData): ReactNode =>
        formatCurrency(Number(product.sellingPrice)),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
        <Link href="/inventory/new">
          <Button>Novo Produto</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou descrição..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showLowStock ? "default" : "outline"}
            onClick={toggleLowStockFilter}
          >
            Mostrar baixo estoque
          </Button>
        </div>

        {error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <DataTable
            data={products}
            columns={columns}
            searchable={false}
            pagination={true}
            itemsPerPage={15}
            onRowClick={(product) => {
              if (product.id && typeof product.id === "string") {
                window.location.href = `/inventory/${product.id}`;
              }
            }}
          />
        )}
      </div>
    </div>
  );
}