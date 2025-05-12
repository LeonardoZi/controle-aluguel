"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "COMPLETED";

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface SaleItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: Decimal | number;
  subtotal: Decimal | number;
}

interface Sale {
  id: string;
  customerId: string;
  customer: Customer;
  orderDate: string | Date;
  status: OrderStatus;
  totalAmount: Decimal | number;
  paymentMethod: string;
  items: SaleItem[];
}

interface SalesStats {
  totalSales: number;
  totalValue: number;
  averageSaleValue: number;
  topProduct: {
    id: string;
    name: string;
    quantity: number;
    value: number;
  } | null;
  topCustomer: {
    id: string;
    name: string;
    purchases: number;
    value: number;
  } | null;
}

export default function SalesReport() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Agrupamento e visualização
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month" | "none">(
    "none"
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salesRes, customersRes, productsRes] = await Promise.all([
          fetch("../actions/reports/sales").then((res) => res.json()),
          fetch("../actions/customers").then((res) => res.json()),
          fetch("../actions/products").then((res) => res.json()),
        ]);

        if (salesRes.error) throw new Error(salesRes.error);
        if (customersRes.error) throw new Error(customersRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        setSales(salesRes.sales || []);
        setCustomers(customersRes.customers || []);
        setProducts(productsRes.products || []);
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
  const getStatusLabel = (status: OrderStatus) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      PROCESSING: { label: "Processando", color: "bg-blue-100 text-blue-800" },
      SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
      DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
      COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800" },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  // Filtrar vendas baseado nos critérios
  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        const orderDate = new Date(sale.orderDate);

        // Filtro de data
        const matchesStartDate = !startDate || orderDate >= new Date(startDate);
        const matchesEndDate =
          !endDate || orderDate <= new Date(`${endDate}T23:59:59`);

        // Filtro de cliente
        const matchesCustomer =
          !customerFilter || sale.customerId === customerFilter;

        // Filtro de produto
        const matchesProduct =
          !productFilter ||
          sale.items.some((item) => item.productId === productFilter);

        // Filtro de status
        const matchesStatus = !statusFilter || sale.status === statusFilter;

        // Filtro de valor
        const saleValue = Number(sale.totalAmount);
        const matchesMinValue = !minValue || saleValue >= Number(minValue);
        const matchesMaxValue = !maxValue || saleValue <= Number(maxValue);

        return (
          matchesStartDate &&
          matchesEndDate &&
          matchesCustomer &&
          matchesProduct &&
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
    sales,
    startDate,
    endDate,
    customerFilter,
    productFilter,
    statusFilter,
    minValue,
    maxValue,
  ]);

  // Agrupar vendas por períodos
  const groupedSales = useMemo(() => {
    if (groupBy === "none")
      return {
        groups: {} as Record<string, { sales: Sale[]; total: number }>,
        labels: [],
      };

    const groups: Record<string, { sales: Sale[]; total: number }> = {};
    const labels: string[] = [];

    filteredSales.forEach((sale) => {
      const date = new Date(sale.orderDate);
      let groupKey = "";

      if (groupBy === "day") {
        groupKey = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        // Obter o primeiro dia da semana
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar quando o dia é domingo
        const firstDayOfWeek = new Date(date.setDate(diff));
        groupKey = firstDayOfWeek.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        groupKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { sales: [], total: 0 };
        labels.push(groupKey);
      }

      groups[groupKey].sales.push(sale);
      groups[groupKey].total += Number(sale.totalAmount);
    });

    // Ordenar os labels cronologicamente
    labels.sort();

    return { groups, labels };
  }, [filteredSales, groupBy]);

  // Calcular estatísticas
  const stats: SalesStats = useMemo(() => {
    let totalValue = 0;

    // Para encontrar o top cliente e produto
    const customerStats: Record<
      string,
      { purchases: number; value: number; name: string }
    > = {};
    const productStats: Record<
      string,
      { quantity: number; value: number; name: string }
    > = {};

    filteredSales.forEach((sale) => {
      const value = Number(sale.totalAmount);
      totalValue += value;

      // Estatísticas por cliente
      if (!customerStats[sale.customerId]) {
        customerStats[sale.customerId] = {
          purchases: 0,
          value: 0,
          name: sale.customer.name,
        };
      }

      customerStats[sale.customerId].purchases += 1;
      customerStats[sale.customerId].value += value;

      // Estatísticas por produto
      sale.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            quantity: 0,
            value: 0,
            name: item.product.name,
          };
        }

        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].value += Number(item.subtotal);
      });
    });

    // Encontrar o cliente com maior valor
    let topCustomer = null;
    let maxCustomerValue = 0;

    Object.entries(customerStats).forEach(([id, stats]) => {
      if (stats.value > maxCustomerValue) {
        maxCustomerValue = stats.value;
        topCustomer = {
          id,
          name: stats.name,
          purchases: stats.purchases,
          value: stats.value,
        };
      }
    });

    // Encontrar o produto mais vendido
    let topProduct = null;
    let maxProductValue = 0;

    Object.entries(productStats).forEach(([id, stats]) => {
      if (stats.value > maxProductValue) {
        maxProductValue = stats.value;
        topProduct = {
          id,
          name: stats.name,
          quantity: stats.quantity,
          value: stats.value,
        };
      }
    });

    return {
      totalSales: filteredSales.length,
      totalValue,
      averageSaleValue: filteredSales.length
        ? totalValue / filteredSales.length
        : 0,
      topCustomer,
      topProduct,
    };
  }, [filteredSales]);

  // Exportar para CSV
  const exportCSV = () => {
    if (filteredSales.length === 0) return;

    const headers = [
      "ID",
      "Data da Venda",
      "Cliente",
      "Status",
      "Valor Total",
      "Forma de Pagamento",
      "Itens",
    ];

    const rows = filteredSales.map((sale) => [
      sale.id,
      new Date(sale.orderDate).toLocaleDateString("pt-BR"),
      sale.customer.name,
      getStatusLabel(sale.status).label,
      Number(sale.totalAmount).toString(),
      sale.paymentMethod || "-",
      sale.items.length.toString(),
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
      `relatorio_vendas_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCustomerFilter("");
    setProductFilter("");
    setStatusFilter("");
    setMinValue("");
    setMaxValue("");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando dados de vendas...</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Relatório de Vendas
          </h1>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredSales.length === 0}
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
          <h3 className="text-sm font-medium text-gray-500">Total de Vendas</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.totalSales}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Faturamento Total
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(stats.averageSaleValue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Total de Itens Vendidos
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {filteredSales.reduce(
              (sum, sale) =>
                sum +
                sale.items.reduce(
                  (itemSum, item) => itemSum + item.quantity,
                  0
                ),
              0
            )}
          </p>
        </div>
      </div>

      {/* Top Cliente e Produto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {stats.topCustomer && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Principal Cliente
            </h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {stats.topCustomer.name}
                </p>
                <p className="text-sm text-gray-600">
                  {stats.topCustomer.purchases} compras
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(stats.topCustomer.value)}
              </p>
            </div>
          </div>
        )}

        {stats.topProduct && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Produto Mais Vendido
            </h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {stats.topProduct.name}
                </p>
                <p className="text-sm text-gray-600">
                  {stats.topProduct.quantity} unidades vendidas
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(stats.topProduct.value)}
              </p>
            </div>
          </div>
        )}
      </div>

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
              Cliente
            </label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todos os clientes</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produto
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todos os produtos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
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
              <option value="PROCESSING">Processando</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agrupar Por
            </label>
            <select
              value={groupBy}
              onChange={(e) =>
                setGroupBy(e.target.value as "day" | "week" | "month" | "none")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="none">Sem agrupamento</option>
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

      {/* Resultados Agrupados */}
      {groupBy !== "none" && groupedSales.labels.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Vendas Agrupadas por{" "}
            {groupBy === "day" ? "Dia" : groupBy === "week" ? "Semana" : "Mês"}
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Média por Venda
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupedSales.labels.map((label) => {
                  const group = groupedSales.groups[label];
                  const salesCount = group.sales.length;
                  const totalValue = group.total;
                  const averageValue =
                    salesCount > 0 ? totalValue / salesCount : 0;

                  let displayLabel = label;
                  if (groupBy === "day" || groupBy === "week") {
                    displayLabel = new Date(label).toLocaleDateString("pt-BR");
                  } else if (groupBy === "month") {
                    const [year, month] = label.split("-");
                    const date = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      1
                    );
                    displayLabel = date.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    });
                  }

                  return (
                    <tr key={label} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {displayLabel}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {salesCount}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(totalValue)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(averageValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabela de Vendas */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            Nenhuma venda encontrada com os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venda/Cliente
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
                    Pagamento
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
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      itens
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {sale.paymentMethod || "-"}
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
    </div>
  );
}
