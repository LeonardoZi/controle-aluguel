"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { Button } from "@/components/ui/button";
import { getSaleById } from "@/actions/sales";
import { processReturn } from "@/actions/sales";
import { getUsers } from "@/actions/users";

// Tipos locais que você já tinha
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
  customer: {
    id: string;
    name: string;
  };
  dataRetirada: string | Date;
  dataDevolucaoPrevista: string | Date;
  status: string;
  totalAmount: Decimal | number | null;
  notes?: string | null;
  itens: SaleItem[];
}

interface User {
  id: string;
  name: string;
}

interface ReturnItem {
  itemId: string;
  produto: Product;
  quantidadeRetirada: number;
  quantidadeDevolvida: number;
  quantidadePendente: number;
  quantidadeADevolver: number;
  precoUnitario: number;
}

export default function ProcessReturnPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [saleResult, usersResult] = await Promise.all([
          getSaleById(saleId),
          getUsers(),
        ]);

        if (saleResult.error) throw new Error(saleResult.error);
        if (usersResult.error) throw new Error(usersResult.error);

        if (!saleResult.sale) {
          throw new Error("Venda não encontrada");
        }

        setSale(saleResult.sale as Sale);
        setUsers(usersResult.users || []);

        if (usersResult.users && usersResult.users.length > 0) {
          setUserId(usersResult.users[0].id);
        }

        const items = saleResult.sale.itens
          .filter(item => !!item.produto)
          .map((item) => {
            const quantidadeDevolvida = item.quantidadeDevolvida || 0;
            const quantidadePendente = item.quantidadeRetirada - quantidadeDevolvida;
            
            return {
              itemId: item.id,
              produto: item.produto,
              quantidadeRetirada: item.quantidadeRetirada,
              quantidadeDevolvida,
              quantidadePendente,
              quantidadeADevolver: 0,
              precoUnitario: Number(item.precoUnitarioNoMomento),
            };
          });
        
        // AQUI ESTÁ A CORREÇÃO SIMPLES:
        // Dizemos ao TypeScript para tratar o array 'items' como o tipo 'ReturnItem[]'
        setReturnItems(items as ReturnItem[]);

      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar dados."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [saleId]);

  const handleQuantityChange = (itemId: string, quantidade: number) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              quantidadeADevolver: Math.min(
                Math.max(0, quantidade),
                item.quantidadePendente
              ),
            }
          : item
      )
    );
  };

  const handleReturnAll = (itemId: string) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? { ...item, quantidadeADevolver: item.quantidadePendente }
          : item
      )
    );
  };

  const calculateRefund = () => {
    return returnItems.reduce((sum, item) => {
      return sum + item.quantidadeADevolver * item.precoUnitario;
    }, 0);
  };

  const calculateNewTotal = () => {
    if (!sale) return 0;
    const currentTotal = Number(sale.totalAmount || 0);
    const refund = calculateRefund();
    return currentTotal - refund;
  };

  const formatCurrency = (value: number | Decimal) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError("Selecione um usuário.");
      return;
    }

    const itemsToReturn = returnItems.filter(
      (item) => item.quantidadeADevolver > 0
    );

    if (itemsToReturn.length === 0) {
      setError("Selecione pelo menos um item para devolver.");
      return;
    }

    setSubmitting(true);
    try {
      const returnData = {
        saleId,
        userId,
        items: itemsToReturn.map((item) => ({
          itemId: item.itemId,
          quantidadeDevolvida: item.quantidadeADevolver,
        })),
        notes: notes || undefined,
      };

      const result = await processReturn(returnData);

      if (result.error) {
        throw new Error(result.error);
      }

      router.push(`/sales`);
    } catch (err: unknown) {
      console.error("Erro ao processar devolução:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao processar a devolução."
      );
    } finally {
      setSubmitting(false);
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Venda não encontrada
        </div>
        <Link
          href="/sales"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          ← Voltar para vendas
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center mb-6">
        Processar Devolução
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Informações da Venda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-500">Cliente:</span>
            <p className="font-medium">{sale.customer.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Data Retirada:</span>
            <p className="font-medium">{formatDate(sale.dataRetirada)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Prazo Devolução:</span>
            <p className="font-medium">
              {formatDate(sale.dataDevolucaoPrevista)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário Responsável <span className="text-red-500">*</span>
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Motivo da devolução, condições dos produtos, etc..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Produtos para Devolução
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
                    Já Devolvido
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendente
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devolver Agora
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reembolso
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returnItems.map((item) => (
                  <tr key={item.itemId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.produto.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(item.precoUnitario)}/{item.produto.unit}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {item.quantidadeRetirada} {item.produto.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {item.quantidadeDevolvida} {item.produto.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-orange-600">
                      {item.quantidadePendente} {item.produto.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <input
                        type="number"
                        min="0"
                        max={item.quantidadePendente}
                        step="0.01"
                        value={item.quantidadeADevolver}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.itemId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                        disabled={item.quantidadePendente === 0}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(
                        item.quantidadeADevolver * item.precoUnitario
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleReturnAll(item.itemId)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                        disabled={item.quantidadePendente === 0}
                      >
                        Devolver Tudo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right text-sm font-medium"
                  >
                    Total a Reembolsar:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                    {formatCurrency(calculateRefund())}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-blue-50">
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right text-sm font-medium"
                  >
                    Novo Valor Total da Venda:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                    {formatCurrency(calculateNewTotal())}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
          <p className="text-sm">
            <strong>Informação:</strong> Ao processar a devolução, os produtos
            retornarão ao estoque e o valor total da venda será recalculado
            considerando apenas a quantidade efetivamente utilizada pelo
            cliente.
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/sales">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <button
            type="submit"
            disabled={
              submitting ||
              returnItems.every((item) => item.quantidadeADevolver === 0)
            }
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            {submitting ? "Processando..." : "Processar Devolução"}
          </button>
        </div>
      </form>
    </div>
  );
}