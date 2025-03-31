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
  email?: string;
  phone?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

interface SaleItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: Decimal | number;
  subtotal: Decimal | number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Sale {
  id: string;
  customerId: string;
  customer: Customer;
  userId: string;
  user: User;
  orderDate: string | Date;
  shipDate?: string | Date;
  deliveryDate?: string | Date;
  status: OrderStatus;
  totalAmount: Decimal | number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: SaleItem[];
}

export default function SaleDetails({ params }: { params: { id: string } }) {
  const { id } = params;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/sales/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar dados da venda");
        }

        setSale(data.sale);
      } catch (err) {
        console.error("Erro ao buscar venda:", err);
        setError("Ocorreu um erro ao carregar os detalhes da venda.");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

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

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!sale) return;

    if (
      !confirm(
        `Deseja alterar o status para ${getStatusLabel(newStatus).label}?`
      )
    ) {
      return;
    }

    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/sales/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar status");
      }

      setSale(data.sale);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setError("Ocorreu um erro ao atualizar o status da venda.");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando detalhes da venda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/sales" className="text-blue-600 hover:underline">
          Voltar para lista de vendas
        </Link>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Venda não encontrada.</p>
          <Link
            href="/sales"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Voltar para lista de vendas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com navegação */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/sales" className="text-blue-600 hover:underline">
            ← Voltar para vendas
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Venda #{sale.id.substring(0, 8)}
          </h1>
        </div>

        <div className="flex space-x-2">
          {sale.status !== "COMPLETED" && sale.status !== "CANCELLED" && (
            <div className="flex gap-2">
              {sale.status === "PENDING" && (
                <button
                  onClick={() => handleStatusChange("PROCESSING")}
                  disabled={statusUpdating}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {statusUpdating ? "Processando..." : "Iniciar Processamento"}
                </button>
              )}

              {sale.status === "PROCESSING" && (
                <button
                  onClick={() => handleStatusChange("SHIPPED")}
                  disabled={statusUpdating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  {statusUpdating ? "Processando..." : "Marcar como Enviado"}
                </button>
              )}

              {sale.status === "SHIPPED" && (
                <button
                  onClick={() => handleStatusChange("DELIVERED")}
                  disabled={statusUpdating}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                >
                  {statusUpdating ? "Processando..." : "Marcar como Entregue"}
                </button>
              )}

              {sale.status === "DELIVERED" && (
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={statusUpdating}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                  {statusUpdating ? "Processando..." : "Concluir Venda"}
                </button>
              )}

              {["PENDING", "PROCESSING", "SHIPPED"].includes(sale.status) && (
                <button
                  onClick={() => handleStatusChange("CANCELLED")}
                  disabled={statusUpdating}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  {statusUpdating ? "Processando..." : "Cancelar Venda"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status e informações básicas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Informações da Venda
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="font-medium">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      getStatusLabel(sale.status).color
                    }`}
                  >
                    {getStatusLabel(sale.status).label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data do Pedido:</span>
                <p className="font-medium">{formatDate(sale.orderDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Envio:</span>
                <p className="font-medium">{formatDate(sale.shipDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Entrega:</span>
                <p className="font-medium">{formatDate(sale.deliveryDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Método de Pagamento:
                </span>
                <p className="font-medium">{sale.paymentMethod || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Status de Pagamento:
                </span>
                <p className="font-medium">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      getPaymentStatusLabel(sale.paymentStatus).color
                    }`}
                  >
                    {getPaymentStatusLabel(sale.paymentStatus).label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Observações:</span>
                <p className="font-medium">{sale.notes || "-"}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Informações do Cliente
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Nome:</span>
                <p className="font-medium">{sale.customer.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{sale.customer.email || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Telefone:</span>
                <p className="font-medium">{sale.customer.phone || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Endereço:</span>
                <p className="font-medium">{sale.customer.address || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Vendedor:</span>
                <p className="font-medium">{sale.user.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Itens da Venda
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Un.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sale.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.product.sku}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right text-sm font-medium"
                >
                  Total da Venda:
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold">
                  {formatCurrency(sale.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Histórico de Atualizações (futura implementação) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Histórico de Atualizações
        </h2>
        <p className="text-sm text-gray-500 italic">
          Criado em {formatDate(sale.createdAt)}
          {sale.updatedAt !== sale.createdAt &&
            ` • Última atualização em ${formatDate(sale.updatedAt)}`}
        </p>
      </div>
    </div>
  );
}
