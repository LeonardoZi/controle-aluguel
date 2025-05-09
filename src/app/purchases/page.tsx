"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { PurchaseStatus } from "@prisma/client";

interface Supplier {
  id: string;
  companyName: string;
}

interface User {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier: Supplier;
  userId: string;
  user: User;
  orderDate: string | Date;
  expectedDelivery?: string | Date;
  actualDelivery?: string | Date;
  status: PurchaseStatus;
  totalAmount: Decimal | number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/purchases");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar pedidos de compra");
        }

        setPurchases(data.purchases || []);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
        setError("Ocorreu um erro ao carregar os pedidos de compra.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
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

  const getStatusLabel = (status: PurchaseStatus) => {
    const statusMap: Record<PurchaseStatus, { label: string; color: string }> =
      {
        PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
        APPROVED: { label: "Aprovado", color: "bg-blue-100 text-blue-800" },
        ORDERED: {
          label: "Pedido Enviado",
          color: "bg-indigo-100 text-indigo-800",
        },
        PARTIALLY_RECEIVED: {
          label: "Recebido Parcialmente",
          color: "bg-purple-100 text-purple-800",
        },
        RECEIVED: { label: "Recebido", color: "bg-green-100 text-green-800" },
        CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
      };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      searchTerm === "" ||
      purchase.supplier.companyName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "" || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando pedidos de compra...</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Pedidos de Compra</h1>

        <Link
          href="/purchases/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Novo Pedido
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Buscar por fornecedor ou ID..."
            />
          </div>

          <div className="w-full md:w-64">
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
              <option value="APPROVED">Aprovado</option>
              <option value="ORDERED">Pedido Enviado</option>
              <option value="PARTIALLY_RECEIVED">Recebido Parcialmente</option>
              <option value="RECEIVED">Recebido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchTerm || statusFilter
              ? "Nenhum pedido encontrado com os filtros aplicados."
              : "Não há pedidos de compra registrados."}
          </p>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
              }}
              className="text-blue-600 hover:underline mt-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID/Fornecedor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previsão
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{purchase.id.substring(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {purchase.supplier.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {formatDate(purchase.orderDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {formatDate(purchase.expectedDelivery)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusLabel(purchase.status).color
                        }`}
                      >
                        {getStatusLabel(purchase.status).label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link
                        href={`/purchases/${purchase.id}`}
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
    </div>
  );
}
