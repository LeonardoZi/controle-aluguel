"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSalesReport } from "@/actions/reports";
import { getLowStockProducts } from "@/actions/products";
import { getPurchaseOrders } from "@/actions/purchases";
import {
  CustomerType,
  PurchaseStatus,
  Sale as PrismaSale,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Definir interfaces para os dados
interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  category?: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  type: CustomerType;
}

interface Sale extends PrismaSale {
  customer: Customer | null;
}

interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  receivedQuantity?: number;
  unitPrice: Decimal | number;
  total: Decimal | number;
  product: {
    name: string;
    id: string;
    sku: string;
  };
}

interface PurchaseOrder {
  id: string;
  orderDate: Date;
  status: PurchaseStatus;
  totalAmount: Decimal | number;
  supplier: {
    companyName: string;
  };
  user?: {
    name: string;
    id: string;
    email: string;
  };
  items?: PurchaseItem[];
}

interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  sales: Sale[];
  salesByDate: Array<{ date: string; total: number; count: number }>;
  salesByPaymentMethod: Array<{ method: string; total: number; count: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export default function DashboardPage() {
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Definir o intervalo de datas (últimos 30 dias)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Buscar dados de vendas
      const salesResult = await getSalesReport(startDate, endDate);
      if (salesResult.error) {
        setError(salesResult.error);
      } else {
        setSalesData(salesResult as SalesReport);
      }

      // Buscar produtos com estoque baixo
      const productsResult = await getLowStockProducts();
      if (productsResult.products) {
        setLowStockProducts(productsResult.products as Product[]);
      }

      // Buscar pedidos pendentes
      const ordersResult = await getPurchaseOrders({ status: "PENDING" });
      if (ordersResult.purchases) {
        setPendingOrders(ordersResult.purchases as PurchaseOrder[]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError("Ocorreu um erro ao carregar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateValue: string | Date): string => {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-blue-600 hover:underline flex-1 mt-5 mb-6">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center flex-1">Dashboard</h1>
        <div className="flex-1"></div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Carregando dados do dashboard...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={fetchDashboardData} className="ml-2 underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">Vendas (30 dias)</h2>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {salesData?.totalSales || 0}
                </span>
                <span className="text-xl text-green-600 font-medium">
                  {formatCurrency(salesData?.totalRevenue || 0)}
                </span>
              </div>
              <Link
                href="/sales"
                className="text-blue-600 text-sm mt-4 inline-block hover:underline"
              >
                Ver todas as vendas →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">
                Produtos com Estoque Baixo
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {lowStockProducts.length}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    lowStockProducts.length > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {lowStockProducts.length > 0
                    ? "Atenção Necessária"
                    : "Tudo em Ordem"}
                </span>
              </div>
              <Link
                href="/inventory?lowStock=true"
                className="text-blue-600 text-sm mt-4 inline-block hover:underline"
              >
                Ver produtos com estoque baixo →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">Pedidos Pendentes</h2>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {pendingOrders.length}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    pendingOrders.length > 0
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {pendingOrders.length > 0
                    ? "Em Andamento"
                    : "Nenhum Pendente"}
                </span>
              </div>
              <Link
                href="/purchases"
                className="text-blue-600 text-sm mt-4 inline-block hover:underline"
              >
                Ver todos os pedidos →
              </Link>
            </div>
          </div>

          {/* Gráficos e Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimas Vendas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Últimas Vendas</h2>

              {salesData?.sales && salesData.sales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesData.sales.slice(0, 5).map((sale: Sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {formatDate(sale.saleDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {sale.customer
                                ? sale.customer.name
                                : "Cliente não identificado"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(Number(sale.totalAmount))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    Nenhuma venda registrada nos últimos 30 dias.
                  </p>
                </div>
              )}

            </div>

            {/* Produtos com Estoque Baixo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">
                Produtos com Estoque Baixo
              </h2>

              {lowStockProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mínimo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockProducts.slice(0, 5).map((product: Product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.sku}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span
                              className={`text-sm font-medium ${
                                product.currentStock === 0
                                  ? "text-red-600"
                                  : product.currentStock <=
                                    product.minimumStock / 2
                                  ? "text-amber-600"
                                  : "text-amber-500"
                              }`}
                            >
                              {product.currentStock}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-500">
                              {product.minimumStock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    Todos os produtos possuem estoque adequado.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Links Rápidos */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/inventory/new"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center"
              >
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Novo Produto</span>
              </Link>

              <Link
                href="/sales/new"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center"
              >
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Nova Venda</span>
              </Link>

              <Link
                href="/reports/sales"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center"
              >
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3v18h18"></path>
                    <path d="M18 17V9"></path>
                    <path d="M13 17V5"></path>
                    <path d="M8 17v-3"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Relatórios</span>
              </Link>

              <Link
                href="/customers"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center"
              >
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6"></path>
                    <path d="M23 11h-6"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Clientes</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
