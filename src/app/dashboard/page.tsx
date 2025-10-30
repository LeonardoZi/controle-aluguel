"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSales, getSalesSummary, updateOverdueSales } from "@/actions/sales";
import { getLowStockProducts } from "@/actions/products";

interface Product {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  precoUnitario: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface RentalItem {
  id: string;
  produtoId: string;
  quantidadeRetirada: number;
  quantidadeDevolvida: number | null;
  precoUnitarioNoMomento: number;
  produto: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Rental {
  id: string;
  customerId: string;
  userId: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  status: "ATIVO" | "ATRASADO" | "CONCLUIDO" | "CANCELADO";
  totalAmount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  user: {
    id: string;
    name: string;
    email: string;
  };
  itens: RentalItem[];
}

interface DashboardSummary {
  totalSales: number;
  activeSales: number;
  overdueSales: number;
  completedSales: number;
  totalRevenue: number;
  pendingReturns: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentRentals, setRecentRentals] = useState<Rental[]>([]);
  const [overdueRentals, setOverdueRentals] = useState<Rental[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      await updateOverdueSales();

      const summaryResult = await getSalesSummary({ startDate, endDate });
      if (summaryResult.error) {
        setError(summaryResult.error);
      } else if (summaryResult.summary) {
        setSummary(summaryResult.summary);
      }

      const recentResult = await getSales({ startDate, endDate });
      if (recentResult.sales) {
        setRecentRentals(recentResult.sales as Rental[]);
      }

      const overdueResult = await getSales({ status: "ATRASADO" });
      if (overdueResult.sales) {
        setOverdueRentals(overdueResult.sales as Rental[]);
      }

      const productsResult = await getLowStockProducts();
      if (productsResult.products) {
        setLowStockProducts(productsResult.products as Product[]);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      ATIVO: "bg-blue-100 text-blue-800",
      ATRASADO: "bg-red-100 text-red-800",
      CONCLUIDO: "bg-green-100 text-green-800",
      CANCELADO: "bg-gray-100 text-gray-800",
    };
    const labels = {
      ATIVO: "Ativo",
      ATRASADO: "Atrasado",
      CONCLUIDO: "Concluído",
      CANCELADO: "Cancelado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:underline flex-1 mt-5 mb-6"
        >
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center flex-1">
          Dashboard - Sistema de Locação
        </h1>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                Locações Ativas
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">
                  {summary?.activeSales || 0}
                </span>
              </div>
              <Link
                href="/sales?status=ATIVO"
                className="text-blue-600 text-sm mt-4 inline-block hover:underline"
              >
                Ver locações ativas →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                Locações Atrasadas
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-red-600">
                  {summary?.overdueSales || 0}
                </span>
              </div>
              <Link
                href="/sales?status=ATRASADO"
                className="text-blue-600 text-sm mt-4 inline-block hover:underline"
              >
                Ver locações atrasadas →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                Receita (30 dias)
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.totalRevenue || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {summary?.completedSales || 0} locações concluídas
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                Estoque Baixo
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-amber-600">
                  {lowStockProducts.length}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    lowStockProducts.length > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {lowStockProducts.length > 0 ? "Atenção" : "OK"}
                </span>
              </div>
              <Link
                href="/inventory"
                className="text-blue-600 text-sm mt-4 inline-block hover:underline"
              >
                Ver inventário →
              </Link>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Rentals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Locações Recentes</h2>

              {recentRentals && recentRentals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Retirada
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentRentals.slice(0, 5).map((rental) => (
                        <tr key={rental.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              href={`/sales/${rental.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {rental.customer.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {formatDate(rental.dataRetirada)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(rental.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(rental.totalAmount || 0)}
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
                    Nenhuma locação registrada nos últimos 30 dias.
                  </p>
                </div>
              )}
            </div>

            {/* Overdue Rentals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-red-600">
                Locações Atrasadas
              </h2>

              {overdueRentals && overdueRentals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Devolução
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {overdueRentals.slice(0, 5).map((rental) => (
                        <tr key={rental.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              href={`/sales/${rental.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {rental.customer.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-red-600 font-medium">
                              {formatDate(rental.dataDevolucaoPrevista)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(rental.totalAmount || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-green-600">
                    ✓ Nenhuma locação atrasada
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          {lowStockProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">
                Produtos com Estoque Baixo
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque Atual
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidade
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço Unit.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/inventory/${product.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span
                            className={`text-sm font-medium ${
                              product.currentStock === 0
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-500">
                            {product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(product.precoUnitario)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/sales/new"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center transition-shadow"
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
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Nova Locação</span>
              </Link>

              <Link
                href="/inventory/new"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center transition-shadow"
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </div>
                <span className="text-sm font-medium">Novo Produto</span>
              </Link>

              <Link
                href="/customers/new"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center transition-shadow"
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
                <span className="text-sm font-medium">Novo Cliente</span>
              </Link>

              <Link
                href="/sales"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md flex flex-col items-center justify-center text-center transition-shadow"
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <span className="text-sm font-medium">Ver Locações</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
