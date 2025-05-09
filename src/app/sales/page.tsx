"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

// Tipos
type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

interface Customer {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  customerId: string;
  customer: Customer;
  orderDate: string | Date;
  status: OrderStatus;
  totalAmount: Decimal | number;
  paymentMethod: string;
  paymentStatus: string;
  items: {
    id: string;
    quantity: number;
  }[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/sales");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar vendas");
        }

        setSales(data.sales || []);
      } catch (err) {
        console.error("Erro ao buscar vendas:", err);
        setError("Ocorreu um erro ao carregar as vendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const formatCurrency = (value: Decimal | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const getStatusLabel = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string }> = {
      PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      PROCESSING: {
        label: "Em Processamento",
        color: "bg-blue-100 text-blue-800",
      },
      SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
      DELIVERED: { label: "Entregue", color: "bg-purple-100 text-purple-800" },
      COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      PAID: { label: "Pago", color: "bg-green-100 text-green-800" },
      PARTIAL: { label: "Parcial", color: "bg-blue-100 text-blue-800" },
      REFUNDED: { label: "Reembolsado", color: "bg-red-100 text-red-800" },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  const filteredSales = sales.filter((sale) => {
    // Filtro de texto (cliente ou ID)
    const matchesSearch =
      searchTerm === "" ||
      sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de status
    const matchesStatus = statusFilter === "" || sale.status === statusFilter;

    // Filtro de status de pagamento
    const matchesPaymentStatus =
      paymentStatusFilter === "" || sale.paymentStatus === paymentStatusFilter;

    // Filtro de data inicial
    const saleDate = new Date(sale.orderDate);
    const matchesStartDate = !startDate || saleDate >= new Date(startDate);

    // Filtro de data final
    const matchesEndDate =
      !endDate || saleDate <= new Date(`${endDate}T23:59:59`);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPaymentStatus &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPaymentStatusFilter("");
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
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>

        <Link
          href="/sales/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nova Venda
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <option value="PENDING">Pendente</option>
              <option value="PROCESSING">Em Processamento</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pagamento
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="PARTIAL">Parcial</option>
              <option value="REFUNDED">Reembolsado</option>
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

        {(searchTerm ||
          statusFilter ||
          paymentStatusFilter ||
          startDate ||
          endDate) && (
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

      {/* Lista de Vendas */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchTerm ||
            statusFilter ||
            paymentStatusFilter ||
            startDate ||
            endDate
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
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{sale.id.substring(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.customer.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {formatDate(sale.orderDate)}
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
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getPaymentStatusLabel(sale.paymentStatus).color
                        }`}
                      >
                        {getPaymentStatusLabel(sale.paymentStatus).label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {sale.items.length} item(ns)
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumo */}
      {filteredSales.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-sm text-gray-500">Total de Vendas:</span>
              <p className="text-lg font-semibold">{filteredSales.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Valor Total:</span>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  filteredSales.reduce(
                    (sum, sale) => sum + Number(sale.totalAmount),
                    0
                  )
                )}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Média por Venda:</span>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  filteredSales.length > 0
                    ? filteredSales.reduce(
                        (sum, sale) => sum + Number(sale.totalAmount),
                        0
                      ) / filteredSales.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
