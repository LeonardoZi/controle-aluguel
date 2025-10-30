"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { getSaleById, cancelSale, completeSale } from "@/actions/sales";

type SaleStatus = "ATIVO" | "ATRASADO" | "CONCLUIDO" | "CANCELADO";

interface Product {
  id: string;
  name: string;
  unit: string;
  precoUnitario: number | Decimal;
}

interface SaleItem {
  id: string;
  produtoId: string;
  produto: Product | undefined;
  quantidadeRetirada: number;
  quantidadeDevolvida: number | null;
  precoUnitarioNoMomento: number | Decimal;
}

interface Sale {
  id: string;
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  dataRetirada: string | Date;
  dataDevolucaoPrevista: string | Date;
  status: SaleStatus;
  totalAmount: Decimal | number | null;
  notes?: string | null;
  itens: SaleItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function SaleDetailsPage() {
  const params = useParams();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true);
      try {
        const result = await getSaleById(saleId);

        if (result.error) {
          throw new Error(result.error);
        }

        setSale(result.sale || null);
      } catch (err) {
        console.error("Erro ao buscar venda:", err);
        setError("Ocorreu um erro ao carregar a venda.");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [saleId]);

  const formatCurrency = (value: Decimal | number | null) => {
    if (value === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };


  const formatDateShort = (date?: string | Date) => {
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

  const handleCancelSale = async () => {
    if (
      !confirm(
        "Tem certeza que deseja cancelar esta venda? Todos os produtos não devolvidos retornarão ao estoque."
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const result = await cancelSale(saleId);

      if (result.error) {
        throw new Error(result.error);
      }

      alert("Venda cancelada com sucesso!");
      window.location.reload();
    } catch (err) {
      console.error("Erro ao cancelar venda:", err);
      alert(
        err instanceof Error ? err.message : "Erro ao cancelar venda"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteSale = async () => {
    if (
      !confirm(
        "Tem certeza que deseja concluir esta venda? O valor final será calculado com base nos produtos efetivamente utilizados."
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const result = await completeSale(saleId);

      if (result.error) {
        throw new Error(result.error);
      }

      alert("Venda concluída com sucesso!");
      window.location.reload();
    } catch (err) {
      console.error("Erro ao concluir venda:", err);
      alert(
        err instanceof Error ? err.message : "Erro ao concluir venda"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || "Venda não encontrada"}
        </div>
        <Link href="/sales" className="text-blue-600 hover:underline">
          ← Voltar para vendas
        </Link>
      </div>
    );
  }

  const isOverdue =
    new Date(sale.dataDevolucaoPrevista) < new Date() &&
    (sale.status === "ATIVO" || sale.status === "ATRASADO");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link href="/sales" className="text-blue-600 hover:underline">
          ← Voltar para vendas
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Detalhes da Venda #{sale.id.substring(0, 8)}
        </h1>
        <div></div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Informações da Venda
          </h2>
          <span
            className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              getStatusLabel(sale.status).color
            }`}
          >
            {getStatusLabel(sale.status).label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <span className="text-sm text-gray-500">Cliente:</span>
            <p className="font-medium">{sale.customer.name}</p>
            {sale.customer.phone && (
              <p className="text-sm text-gray-600">{sale.customer.phone}</p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-500">Data de Retirada:</span>
            <p className="font-medium">{formatDateShort(sale.dataRetirada)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Prazo de Devolução:</span>
            <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
              {formatDateShort(sale.dataDevolucaoPrevista)}
              {isOverdue && <span className="ml-2 text-xs">(VENCIDO)</span>}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Vendedor:</span>
            <p className="font-medium">{sale.user.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Valor Atual:</span>
            <p className="font-medium text-lg text-green-600">
              {formatCurrency(sale.totalAmount)}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Criado em:</span>
            <p className="font-medium text-sm">{formatDateShort(sale.createdAt)}</p>
          </div>
        </div>

        {sale.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Observações:</span>
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
              {sale.notes}
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Produtos ({sale.itens.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retirado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devolvido
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilizado
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
              {sale.itens.map((item) => {
                const quantidadeUtilizada =
                  item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
                const subtotal =
                  quantidadeUtilizada * Number(item.precoUnitarioNoMomento);

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.produto ? item.produto.name : <span className="text-gray-400">Produto removido</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {item.quantidadeRetirada} {item.produto ? item.produto.unit : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-green-600">
                      {item.quantidadeDevolvida || 0} {item.produto ? item.produto.unit : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold">
                      {quantidadeUtilizada} {item.produto ? item.produto.unit : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      {formatCurrency(item.precoUnitarioNoMomento)}/
                      {item.produto ? item.produto.unit : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right text-sm font-medium"
                >
                  Total:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                  {formatCurrency(sale.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        {(sale.status === "ATIVO" || sale.status === "ATRASADO") && (
          <>
            <Link
              href={`/sales/${sale.id}/return`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
            >
              Processar Devolução
            </Link>
            <button
              onClick={handleCompleteSale}
              disabled={processing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
            >
              {processing ? "Processando..." : "Concluir Venda"}
            </button>
            <button
              onClick={handleCancelSale}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
            >
              {processing ? "Processando..." : "Cancelar Venda"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}