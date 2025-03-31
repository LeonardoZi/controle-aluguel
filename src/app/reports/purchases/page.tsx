"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { PurchaseStatus } from "@prisma/client";

interface Supplier {
  id: string;
  companyName: string;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier: Supplier;
  orderDate: string | Date;
  expectedDelivery?: string | Date;
  actualDelivery?: string | Date;
  status: PurchaseStatus;
  totalAmount: Decimal | number;
  items: {
    id: string;
    productId: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    receivedQuantity: number;
    unitPrice: Decimal | number;
  }[];
}

interface PurchaseStats {
  totalOrders: number;
  totalValue: number;
  pendingOrders: number;
  pendingValue: number;
  completedOrders: number;
  averageOrderValue: number;
  topSupplier: {
    id: string;
    name: string;
    orders: number;
    value: number;
  } | null;
}

export default function PurchasesReport() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [purchasesRes, suppliersRes] = await Promise.all([
          fetch("/api/reports/purchases").then((res) => res.json()),
          fetch("/api/suppliers").then((res) => res.json()),
        ]);

        if (purchasesRes.error) throw new Error(purchasesRes.error);
        if (suppliersRes.error) throw new Error(suppliersRes.error);

        setPurchases(purchasesRes.purchases || []);
        setSuppliers(suppliersRes.suppliers || []);
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

  // Obter status formatado
  const getStatusLabel = (status: PurchaseStatus) => {
    const statusMap: Record<PurchaseStatus, { label: string; color: string }> =
      {
        PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
        APPROVED: { label: "Aprovado", color: "bg-blue-100 text-blue-800" },
        ORDERED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
        PARTIALLY_RECEIVED: {
          label: "Parcial",
          color: "bg-purple-100 text-purple-800",
        },
        RECEIVED: { label: "Recebido", color: "bg-green-100 text-green-800" },
        CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
      };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  // Filtrar compras baseado nos critérios
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((purchase) => {
        const orderDate = new Date(purchase.orderDate);

        // Filtro de data
        const matchesStartDate = !startDate || orderDate >= new Date(startDate);
        const matchesEndDate =
          !endDate || orderDate <= new Date(`${endDate}T23:59:59`);

        // Filtro de fornecedor
        const matchesSupplier =
          !supplierFilter || purchase.supplierId === supplierFilter;

        // Filtro de status
        const matchesStatus = !statusFilter || purchase.status === statusFilter;

        // Filtro de valor
        const purchaseValue = Number(purchase.totalAmount);
        const matchesMinValue = !minValue || purchaseValue >= Number(minValue);
        const matchesMaxValue = !maxValue || purchaseValue <= Number(maxValue);

        return (
          matchesStartDate &&
          matchesEndDate &&
          matchesSupplier &&
          matchesStatus &&
          matchesMinValue &&
          matchesMaxValue
        );
      })
      .sort((a, b) => {
        // Ordenar por data (mais recente primeiro)
        return (
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
      });
  }, [
    purchases,
    startDate,
    endDate,
    supplierFilter,
    statusFilter,
    minValue,
    maxValue,
  ]);

  // Calcular estatísticas
  const stats: PurchaseStats = useMemo(() => {
    let totalValue = 0;
    let pendingOrders = 0;
    let pendingValue = 0;
    let completedOrders = 0;

    // Para encontrar o top fornecedor
    const supplierStats: Record<
      string,
      { orders: number; value: number; name: string }
    > = {};

    filteredPurchases.forEach((purchase) => {
      const value = Number(purchase.totalAmount);
      totalValue += value;

      // Contar pedidos por status
      if (purchase.status === "RECEIVED") {
        completedOrders++;
      } else if (
        ["PENDING", "APPROVED", "ORDERED", "PARTIALLY_RECEIVED"].includes(
          purchase.status
        )
      ) {
        pendingOrders++;
        pendingValue += value;
      }

      // Estatísticas por fornecedor
      if (!supplierStats[purchase.supplierId]) {
        supplierStats[purchase.supplierId] = {
          orders: 0,
          value: 0,
          name: purchase.supplier.companyName,
        };
      }

      supplierStats[purchase.supplierId].orders += 1;
      supplierStats[purchase.supplierId].value += value;
    });

    // Encontrar o fornecedor com maior valor
    let topSupplier = null;
    let maxValue = 0;

    Object.entries(supplierStats).forEach(([id, stats]) => {
      if (stats.value > maxValue) {
        maxValue = stats.value;
        topSupplier = {
          id,
          name: stats.name,
          orders: stats.orders,
          value: stats.value,
        };
      }
    });

    return {
      totalOrders: filteredPurchases.length,
      totalValue,
      pendingOrders,
      pendingValue,
      completedOrders,
      averageOrderValue: filteredPurchases.length
        ? totalValue / filteredPurchases.length
        : 0,
      topSupplier,
    };
  }, [filteredPurchases]);

  // Exportar para CSV
  const exportCSV = () => {
    if (filteredPurchases.length === 0) return;

    const headers = [
      "ID",
      "Data do Pedido",
      "Fornecedor",
      "Status",
      "Valor Total",
      "Previsão de Entrega",
      "Data de Recebimento",
      "Itens",
    ];

    const rows = filteredPurchases.map((purchase) => [
      purchase.id,
      new Date(purchase.orderDate).toLocaleDateString("pt-BR"),
      purchase.supplier.companyName,
      getStatusLabel(purchase.status).label,
      Number(purchase.totalAmount).toString(),
      purchase.expectedDelivery
        ? new Date(purchase.expectedDelivery).toLocaleDateString("pt-BR")
        : "-",
      purchase.actualDelivery
        ? new Date(purchase.actualDelivery).toLocaleDateString("pt-BR")
        : "-",
      purchase.items.length.toString(),
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
      `relatorio_compras_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSupplierFilter("");
    setStatusFilter("");
    setMinValue("");
    setMaxValue("");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando dados de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Relatório de Compras
          </h1>
          <p className="text-gray-500 mt-1">
            Análise de compras e fornecedores
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredPurchases.length === 0}
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
            Total de Pedidos
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Pedidos Pendentes
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.pendingOrders}{" "}
            <span className="text-sm text-gray-500 font-normal">
              ({formatCurrency(stats.pendingValue)})
            </span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Valor Médio por Pedido
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(stats.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Principal Fornecedor */}
      {stats.topSupplier && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Principal Fornecedor
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {stats.topSupplier.name}
              </p>
              <p className="text-sm text-gray-600">
                {stats.topSupplier.orders} pedidos
              </p>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {formatCurrency(stats.topSupplier.value)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fornecedor
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todos os fornecedores</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
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
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
              <option value="ORDERED">Enviado</option>
              <option value="PARTIALLY_RECEIVED">Parcialmente Recebido</option>
              <option value="RECEIVED">Recebido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Mínimo (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Ex: 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Máximo (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Ex: 1000"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Tabela de Compras */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            Nenhum pedido de compra encontrado com os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido/Fornecedor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrega
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
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {purchase.items.length} itens
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {purchase.actualDelivery
                        ? formatDate(purchase.actualDelivery)
                        : purchase.expectedDelivery
                        ? `Prev: ${formatDate(purchase.expectedDelivery)}`
                        : "-"}
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
