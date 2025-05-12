"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { Button } from "@/components/ui/button";
import { getSuppliers } from "@/actions/suppliers";
import { createPurchaseOrder } from "@/actions/purchases";
import { getProducts } from "@/actions/products";

// Tipos
interface Supplier {
  id: string;
  companyName: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  price?: number | Decimal;
}

interface PurchaseItem {
  id: string; // ID temporário para manipulação na interface
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
}

// Página de Nova Compra
export default function NewPurchase() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estado do formulário
  const [supplierId, setSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Estados para adicionar produtos
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar fornecedores e produtos do backend
        const [suppliersResult, productsResult] = await Promise.all([
          getSuppliers(),
          getProducts(),
        ]);

        if (suppliersResult.error) throw new Error(suppliersResult.error);
        if (productsResult.error) throw new Error(productsResult.error);

        setSuppliers(suppliersResult.suppliers || []);
        setProducts(productsResult.products || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Ocorreu um erro ao carregar fornecedores e produtos.");
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
      if (product && product.price) {
        setUnitPrice(Number(product.price));
      } else {
        setUnitPrice(0);
      }
    } else {
      setUnitPrice(0);
    }
  }, [selectedProductId, products]);

  // Adicionar item ao pedido
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

    // Verificar se o produto já está no pedido
    const existingItemIndex = items.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingItemIndex >= 0) {
      // Atualizar item existente
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].unitPrice = unitPrice;
      setItems(updatedItems);
    } else {
      // Adicionar novo item
      const newItem: PurchaseItem = {
        id: Date.now().toString(), // ID temporário
        productId: selectedProductId,
        product,
        quantity,
        unitPrice,
      };
      setItems([...items, newItem]);
    }

    // Resetar campos
    setSelectedProductId("");
    setQuantity(1);
    setUnitPrice(0);
    setError("");
  };

  // Remover item do pedido
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  // Calcular total do pedido
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
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

    if (!supplierId) {
      setError("Selecione um fornecedor.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um item ao pedido.");
      return;
    }

    setSubmitting(true);
    try {
      const purchaseData = {
        supplierId,
        userId: "your-user-id", // You'll need to get this from your auth system
        expectedDelivery: expectedDeliveryDate
          ? new Date(expectedDeliveryDate)
          : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const result = await createPurchaseOrder(purchaseData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Check if purchaseOrder exists before using it
      if (!result.purchaseOrder) {
        throw new Error("Falha ao criar pedido. Nenhum pedido retornado.");
      }

      // Redirecionar para a página do pedido criado
      router.push(`/purchases/${result.purchaseOrder.id}`);
    } catch (err: unknown) {
      console.error("Erro ao submeter formulário:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao criar o pedido de compra."
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Novo Pedido de Compra
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informações básicas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Informações do Pedido
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor <span className="text-red-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previsão de Entrega
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
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
                placeholder="Informações adicionais sobre o pedido..."
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
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
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
            Itens do Pedido ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum item adicionado ao pedido.
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
                        {formatCurrency(item.quantity * item.unitPrice)}
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
                      Total do Pedido:
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
          <Link href="/purchases">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            {submitting ? "Salvando..." : "Criar Pedido"}
          </button>
        </div>
      </form>
    </div>
  );
}
