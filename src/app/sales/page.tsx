"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { getSales, updateOverdueSales } from "@/actions/sales";

// Types
type SaleStatus = "ATIVO" | "ATRASADO" | "CONCLUIDO" | "CANCELADO";

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  precoUnitario: number | Decimal;
}

interface SaleItem {
  id: string;
  produtoId: string;
  produto: Product;
  quantidadeRetirada: number;
  quantidadeDevolvida: number | null;
  precoUnitarioNoMomento: number | Decimal;
}

interface Sale {
  id: string;
  customerId: string;
  customer: Customer;
  dataRetirada: string | Date;
  dataDevolucaoPrevista: string | Date;
  status: SaleStatus;
  totalAmount: Decimal | number | null;
  notes?: string | null;
  itens: SaleItem[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        // Update overdue sales first
        await updateOverdueSales();

        const result = await getSales();

        if (result.error) {
          throw new Error(result.error);
        }

        setSales(result.sales || []);
      } catch (err) {
        console.error("Erro ao buscar vendas:", err);
        setError("Ocorreu um erro ao carregar as vendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const formatCurrency = (value: Decimal | number | null) => {
    if (value === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const getStatusLabel = (status: SaleStatus) => {
    const statusMap: Record<SaleStatus, { label: string; color: string }> = {
      ATIVO: { label: "Ativo", color: "bg-blue-100 text-blue-800" },
      ATRASADO: { label: "Atrasado", color: "bg-red-100 text-red-800" },
      CONCLUIDO: { label: "Concluído", color: "bg-green-100 text-green-800" },
      CANCELADO: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  const isOverdue = (dataDevolucaoPrevista: string | Date, status: SaleStatus) => {
    if (status === "CONCLUIDO" || status === "CANCELADO") return false;
    return new Date(dataDevolucaoPrevista) < new Date();
  };

  const calculatePendingReturn = (itens: SaleItem[]) => {
    return itens.reduce((total, item) => {
      const pendente = item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
      return total + pendente;
    }, 0);
  };

  const filteredSales = sales.filter((sale) => {
    // Text filter (customer or ID)
    const matchesSearch =
      searchTerm === "" ||
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "" || sale.status === statusFilter;

    // Start date filter
    const saleDate = new Date(sale.dataRetirada);
    const matchesStartDate = !startDate || saleDate >= new Date(startDate);

    // End date filter
    const matchesEndDate =
      !endDate || saleDate <= new Date(`${endDate}T23:59:59`);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando vendas...</p>
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
        <h1 className="text-2xl font-bold text-gray-800">
          Vendas e Aluguéis
        </h1>

        <Link
          href="/sales/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nova Venda/Aluguel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
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
              placeholder="Cliente ou ID..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {(searchTerm || statusFilter || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchTerm || statusFilter || startDate || endDate
              ? "Nenhuma venda encontrada com os filtros aplicados."
              : "Não há vendas registradas."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID/Cliente
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Retirada
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prazo Devolução
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Atual
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendente Devolução
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => {
                  const pendingReturn = calculatePendingReturn(sale.itens);
                  const overdueStatus = isOverdue(
                    sale.dataDevolucaoPrevista,
                    sale.status
                  );

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-gray-50 ${
                        overdueStatus ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{sale.id.substring(0, 8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.customer?.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {formatDate(sale.dataRetirada)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        <div
                          className={
                            overdueStatus ? "text-red-600 font-semibold" : ""
                          }
                        >
                          {formatDate(sale.dataDevolucaoPrevista)}
                        </div>
                        {overdueStatus && (
                          <div className="text-xs text-red-500">Vencido!</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            getStatusLabel(sale.status).color
                          }`}
                        >
                          {getStatusLabel(sale.status).label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        {pendingReturn > 0 ? (
                          <span className="text-orange-600 font-semibold">
                            {pendingReturn} item(ns)
                          </span>
                        ) : (
                          <span className="text-green-600">Completo</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver Detalhes
                        </Link>
                        {(sale.status === "ATIVO" ||
                          sale.status === "ATRASADO") && (
                          <Link
                            href={`/sales/${sale.id}/return`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Processar Devolução
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {filteredSales.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-sm text-gray-500">Total de Vendas:</span>
              <p className="text-lg font-semibold">{filteredSales.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Vendas Ativas:</span>
              <p className="text-lg font-semibold text-blue-600">
                {
                  filteredSales.filter(
                    (s) => s.status === "ATIVO" || s.status === "ATRASADO"
                  ).length
                }
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Vendas Atrasadas:</span>
              <p className="text-lg font-semibold text-red-600">
                {filteredSales.filter((s) => s.status === "ATRASADO").length}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Receita Total:</span>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  filteredSales.reduce(
                    (sum, sale) => sum + Number(sale.totalAmount || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
