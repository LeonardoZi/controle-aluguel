"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
} from "@/actions/purchases";
import { Decimal } from "@prisma/client/runtime/library";
import { PurchaseStatus } from "@prisma/client";

interface Supplier {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

interface PurchaseItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  receivedQuantity: number;
  unitPrice: Decimal | number;
  total: Decimal | number;
}

interface User {
  id: string;
  name: string;
  email: string;
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
  items: PurchaseItem[];
}

export default function PurchaseDetails({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [purchase, setPurchase] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receivingItems, setReceivingItems] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});
  const [receiveNotes, setReceiveNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      setLoading(true);
      try {
        const result = await getPurchaseOrderById(id);
        if (result.error) {
          setError(result.error);
        } else if (result.purchase) {
          setPurchase(result.purchase as PurchaseOrder);

          // Initialize receive quantities
          const quantities: Record<string, number> = {};
          result.purchase.items.forEach((item) => {
            const remaining = item.quantity - item.receivedQuantity;
            quantities[item.id] = remaining > 0 ? remaining : 0;
          });
          setReceiveQuantities(quantities);
        }
      } catch (err) {
        console.error("Error fetching purchase order:", err);
        setError("Ocorreu um erro ao buscar os dados do pedido.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
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

  const handleStatusChange = async (newStatus: PurchaseStatus) => {
    if (!purchase) return;

    if (
      !confirm(
        `Deseja alterar o status para ${getStatusLabel(newStatus).label}?`
      )
    ) {
      return;
    }

    setStatusUpdating(true);
    try {
      const result = await updatePurchaseOrderStatus(id, newStatus);
      if (result.error) {
        setError(result.error);
      } else if (result.purchase) {
        setPurchase(result.purchase as PurchaseOrder);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Ocorreu um erro ao atualizar o status do pedido.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleReceivingItems = () => {
    setReceivingItems(true);
  };

  const cancelReceiving = () => {
    setReceivingItems(false);

    // Reset quantities to remaining
    if (purchase) {
      const quantities: Record<string, number> = {};
      purchase.items.forEach((item) => {
        const remaining = item.quantity - item.receivedQuantity;
        quantities[item.id] = remaining > 0 ? remaining : 0;
      });
      setReceiveQuantities(quantities);
    }

    setReceiveNotes("");
  };

  const handleQuantityChange = (itemId: string, value: number) => {
    setReceiveQuantities((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchase) return;

    // Check if any items are selected for receiving
    const hasItemsToReceive = Object.values(receiveQuantities).some(
      (qty) => qty > 0
    );
    if (!hasItemsToReceive) {
      setError("Selecione pelo menos um item para receber.");
      return;
    }

    setSubmitting(true);
    try {
      const itemsToReceive = Object.entries(receiveQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([purchaseItemId, receivedQuantity]) => ({
          purchaseItemId,
          receivedQuantity,
        }));

      const result = await receivePurchaseOrder(id, {
        userId: "current_user", // ideally this would be the actual user ID
        items: itemsToReceive,
        notes: receiveNotes,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.purchase) {
        setPurchase(result.purchase as unknown as PurchaseOrder);
        setReceivingItems(false);
        setReceiveNotes("");
      }
    } catch (err) {
      console.error("Error receiving items:", err);
      setError("Ocorreu um erro ao processar o recebimento dos itens.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando detalhes do pedido...</p>
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
        <Link href="/purchases" className="text-blue-600 hover:underline">
          Voltar para lista de pedidos
        </Link>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Pedido não encontrado.</p>
          <Link
            href="/purchases"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Voltar para lista de pedidos
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
          <Link href="/purchases" className="text-blue-600 hover:underline">
            ← Voltar para pedidos
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Pedido #{purchase.id.substring(0, 8)}
          </h1>
        </div>

        <div className="flex space-x-2">
          {purchase.status !== "RECEIVED" &&
            purchase.status !== "CANCELLED" && (
              <div className="flex gap-2">
                {purchase.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange("APPROVED")}
                    disabled={statusUpdating}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    {statusUpdating ? "Processando..." : "Aprovar Pedido"}
                  </button>
                )}

                {["PENDING", "APPROVED"].includes(purchase.status) && (
                  <button
                    onClick={() => handleStatusChange("ORDERED")}
                    disabled={statusUpdating}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
                  >
                    {statusUpdating ? "Processando..." : "Marcar como Enviado"}
                  </button>
                )}

                {["ORDERED", "PARTIALLY_RECEIVED"].includes(
                  purchase.status
                ) && (
                  <button
                    onClick={handleReceivingItems}
                    disabled={statusUpdating || receivingItems}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    {statusUpdating ? "Processando..." : "Receber Itens"}
                  </button>
                )}

                {["PENDING", "APPROVED", "ORDERED"].includes(
                  purchase.status
                ) && (
                  <button
                    onClick={() => handleStatusChange("CANCELLED")}
                    disabled={statusUpdating}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    {statusUpdating ? "Processando..." : "Cancelar Pedido"}
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
              Informações do Pedido
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="font-medium">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      getStatusLabel(purchase.status).color
                    }`}
                  >
                    {getStatusLabel(purchase.status).label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data do Pedido:</span>
                <p className="font-medium">{formatDate(purchase.orderDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Previsão de Entrega:
                </span>
                <p className="font-medium">
                  {formatDate(purchase.expectedDelivery)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Data de Recebimento:
                </span>
                <p className="font-medium">
                  {formatDate(purchase.actualDelivery)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Valor Total:</span>
                <p className="font-medium">
                  {formatCurrency(purchase.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Observações:</span>
                <p className="font-medium">{purchase.notes || "-"}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Informações do Fornecedor
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Fornecedor:</span>
                <p className="font-medium">{purchase.supplier.companyName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Contato:</span>
                <p className="font-medium">
                  {purchase.supplier.contactName || "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{purchase.supplier.email || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Telefone:</span>
                <p className="font-medium">{purchase.supplier.phone || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Responsável pelo Pedido:
                </span>
                <p className="font-medium">{purchase.user.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Itens do Pedido
        </h2>

        {receivingItems ? (
          <form onSubmit={handleReceiveSubmit}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd. Pedida
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd. Recebida
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receber Agora
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Un.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchase.items.map((item) => {
                    const remaining = item.quantity - item.receivedQuantity;
                    return (
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
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {item.receivedQuantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={receiveQuantities[item.id] || 0}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                Number(e.target.value)
                              )
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            disabled={remaining <= 0}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Informações adicionais sobre o recebimento..."
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelReceiving}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                {submitting ? "Processando..." : "Confirmar Recebimento"}
              </button>
            </div>
          </form>
        ) : (
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recebido
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Un.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchase.items.map((item) => (
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
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {item.receivedQuantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {item.receivedQuantity === 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Pendente
                        </span>
                      ) : item.receivedQuantity < item.quantity ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          Parcial
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Completo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-sm font-medium"
                  >
                    Total do Pedido:
                  </td>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm font-bold"
                  >
                    {formatCurrency(purchase.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
