"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

// Tipos
interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  sellingPrice?: number | Decimal;
}

interface SaleItem {
  id: string; // ID temporário para manipulação na interface
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Página de Nova Venda
export default function NewSale() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estado do formulário
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("DINHEIRO");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  // Estados para adicionar produtos
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [stockWarning, setStockWarning] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar clientes e produtos do backend
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers").then((res) => res.json()),
          fetch("/api/products").then((res) => res.json()),
        ]);

        if (customersRes.error) throw new Error(customersRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        setCustomers(customersRes.customers || []);
        setProducts(productsRes.products || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Ocorreu um erro ao carregar clientes e produtos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Atualiza o preço unitário quando um produto é selecionado
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        setUnitPrice(Number(product.sellingPrice || 0));

        // Verificar estoque
        if (product.currentStock <= 0) {
          setStockWarning(`Atenção: Produto sem estoque disponível!`);
        } else if (product.currentStock < quantity) {
          setStockWarning(
            `Atenção: Apenas ${product.currentStock} unidades disponíveis!`
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

  // Adicionar item à venda
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

    // Verificar estoque
    if (product.currentStock < quantity) {
      setError(
        `Quantidade excede o estoque disponível (${product.currentStock} unidades).`
      );
      return;
    }

    // Verificar se o produto já está no pedido
    const existingItemIndex = items.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingItemIndex >= 0) {
      // Verificar estoque total
      const existingItem = items[existingItemIndex];
      const totalQuantity = existingItem.quantity + quantity;

      if (product.currentStock < totalQuantity) {
        setError(
          `Quantidade total excede o estoque disponível (${product.currentStock} unidades).`
        );
        return;
      }

      // Atualizar item existente
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: totalQuantity,
        unitPrice: unitPrice,
        subtotal: totalQuantity * unitPrice,
      };
      setItems(updatedItems);
    } else {
      // Adicionar novo item
      const newItem: SaleItem = {
        id: Date.now().toString(), // ID temporário
        productId: selectedProductId,
        product,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      };
      setItems([...items, newItem]);
    }

    // Resetar campos
    setSelectedProductId("");
    setQuantity(1);
    setUnitPrice(0);
    setError("");
    setStockWarning("");
  };

  // Remover item da venda
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  // Calcular total da venda
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Formatar valor como moeda
  const formatCurrency = (value: number | Decimal) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      setError("Selecione um cliente.");
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
        paymentMethod,
        paymentStatus,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar venda");
      }

      // Redirecionar para a página da venda criada
      router.push(`/sales/${result.sale.id}`);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/sales" className="text-blue-600 hover:underline">
            ← Voltar para vendas
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Nova Venda</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informações básicas */}
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
                Método de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="BOLETO">Boleto</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
                <option value="PRAZO">A Prazo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status do Pagamento
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="PARTIAL">Parcial</option>
              </select>
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

        {/* Adicionar Itens */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Adicionar Itens
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
                    {product.name} ({product.sku}) - {product.currentStock} em
                    estoque
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
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
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
              Adicionar Item
            </button>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Itens da Venda ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum item adicionado à venda.
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
                      Total da Venda:
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

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Link
            href="/sales"
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
          >
            Cancelar
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
