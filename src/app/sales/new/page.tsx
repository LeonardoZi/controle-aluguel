"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/actions/customers";
import { getProducts } from "@/actions/products";
import { createSale } from "@/actions/sales";
import { getUsers } from "@/actions/users";

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  currentStock: number;
  precoUnitario: number | Decimal;
  unit: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SaleItem {
  id: string;
  produtoId: string;
  produto: Product;
  quantidadeRetirada: number;
  precoUnitario: number;
  subtotal: number;
}

export default function NewSale() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [userId, setUserId] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [stockWarning, setStockWarning] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersResult, productsResult, usersResult] =
          await Promise.all([getCustomers(), getProducts(), getUsers()]);

        if (customersResult.error) throw new Error(customersResult.error);
        if (productsResult.error) throw new Error(productsResult.error);
        if (usersResult.error) throw new Error(usersResult.error);

        setCustomers(customersResult.customers || []);
        setProducts(productsResult.products || []);
        setUsers(usersResult.users || []);

        if (usersResult.users && usersResult.users.length > 0) {
          setUserId(usersResult.users[0].id);
        }

        const defaultReturnDate = new Date();
        defaultReturnDate.setDate(defaultReturnDate.getDate() + 7);
        setDataDevolucaoPrevista(
          defaultReturnDate.toISOString().split("T")[0]
        );
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Ocorreu um erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        setUnitPrice(Number(product.precoUnitario || 0));

        if (product.currentStock <= 0) {
          setStockWarning(`Atenção: Produto sem estoque disponível!`);
        } else if (product.currentStock < quantity) {
          setStockWarning(
            `Atenção: Apenas ${product.currentStock} ${product.unit} disponíveis!`
          );
        } else {
          setStockWarning("");
        }
      } else {
        setUnitPrice(0);
        setStockWarning("");
      }
    } else {
      setUnitPrice(0);
      setStockWarning("");
    }
  }, [selectedProductId, quantity, products]);

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0 || unitPrice <= 0) {
      setError("Selecione um produto, quantidade e preço válidos.");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      setError("Produto não encontrado.");
      return;
    }

    if (product.currentStock < quantity) {
      setError(
        `Quantidade excede o estoque disponível (${product.currentStock} ${product.unit}).`
      );
      return;
    }

    const existingItemIndex = items.findIndex(
      (item) => item.produtoId === selectedProductId
    );

    if (existingItemIndex >= 0) {
      const existingItem = items[existingItemIndex];
      const totalQuantity = existingItem.quantidadeRetirada + quantity;

      if (product.currentStock < totalQuantity) {
        setError(
          `Quantidade total excede o estoque disponível (${product.currentStock} ${product.unit}).`
        );
        return;
      }

      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantidadeRetirada: totalQuantity,
        precoUnitario: unitPrice,
        subtotal: totalQuantity * unitPrice,
      };
      setItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        id: Date.now().toString(),
        produtoId: selectedProductId,
        produto: product,
        quantidadeRetirada: quantity,
        precoUnitario: unitPrice,
        subtotal: quantity * unitPrice,
      };
      setItems([...items, newItem]);
    }

    setSelectedProductId("");
    setQuantity(1);
    setUnitPrice(0);
    setError("");
    setStockWarning("");
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const formatCurrency = (value: number | Decimal) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      setError("Selecione um cliente.");
      return;
    }

    if (!userId) {
      setError("Selecione um usuário.");
      return;
    }

    if (!dataDevolucaoPrevista) {
      setError("Defina o prazo de devolução.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um item à venda.");
      return;
    }

    setSubmitting(true);
    try {
      const saleData = {
        customerId,
        userId,
        dataDevolucaoPrevista: new Date(dataDevolucaoPrevista),
        notes: notes || undefined,
        items: items.map((item) => ({
          produtoId: item.produtoId,
          quantidadeRetirada: item.quantidadeRetirada,
          precoUnitarioNoMomento: item.precoUnitario,
        })),
      };

      const result = await createSale(saleData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.sale) {
        throw new Error("Venda criada, mas nenhuma informação foi retornada.");
      }

      router.push(`/sales`);
    } catch (err: unknown) {
      console.error("Erro ao submeter formulário:", err);
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro ao criar a venda."
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center mb-6">
        Nova Venda
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Informações da Venda
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              >
                <option value="">Selecione um cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário <span className="text-red-500">*</span>
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
                Prazo de Devolução <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataDevolucaoPrevista}
                onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Informações adicionais sobre a venda..."
              />
            </div>
          </div>
        </div>

        {/* Add Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Adicionar Produtos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produto
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Selecione um produto</option>
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.currentStock <= 0}
                  >
                    {product.name} - {product.currentStock} {product.unit} em
                    estoque - {formatCurrency(product.precoUnitario)}/
                    {product.unit}
                  </option>
                ))}
              </select>
              {stockWarning && (
                <p className="mt-1 text-sm text-yellow-600">{stockWarning}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddItem}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Adicionar Produto
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Produtos da Venda ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum produto adicionado à venda.
            </div>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Un.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.produto.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.produto.description}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        {item.quantidadeRetirada} {item.produto.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        {formatCurrency(item.precoUnitario)}/{item.produto.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remover
                        </button>
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
                      Total Estimado (se tudo for usado):
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold">
                      {formatCurrency(calculateTotal())}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}


        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/sales">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            {submitting ? "Salvando..." : "Finalizar Venda"}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateString));
}
