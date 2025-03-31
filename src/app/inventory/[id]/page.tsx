"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProductById, updateProduct, adjustStock } from "@/actions/products";
import { Decimal } from "@prisma/client/runtime/library";

interface PriceHistory {
  id: string;
  purchasePrice: Decimal | number;
  sellingPrice: Decimal | number;
  effectiveDate: string | Date;
  notes?: string;
}

interface StockMovement {
  id: string;
  quantity: number;
  type: string;
  reference?: string;
  notes?: string;
  createdAt: string | Date;
  user: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  companyName: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  purchasePrice: Decimal | number;
  sellingPrice: Decimal | number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  location?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: Category;
  supplier?: Supplier;
  priceHistory?: PriceHistory[];
  stockMovements?: StockMovement[];
}

export default function ProductDetails({ params }: { params: { id: string } }) {
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const result = await getProductById(id);
      if (result.error) {
        setError(result.error);
      } else if (result.product) {
        setProduct(result.product as Product);
        setEditForm(result.product as Product);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleEditFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const updateData = {
      name: editForm.name,
      description: editForm.description,
      purchasePrice: Number(editForm.purchasePrice),
      sellingPrice: Number(editForm.sellingPrice),
      minimumStock: Number(editForm.minimumStock),
      unit: editForm.unit,
      location: editForm.location,
      barcode: editForm.barcode,
      isActive: editForm.isActive,
    };

    const result = await updateProduct(id, updateData);
    if (result.error) {
      setError(result.error);
    } else {
      // Buscar os dados completos do produto após atualização
      const refreshResult = await getProductById(id);
      if (refreshResult.product) {
        setProduct(refreshResult.product as Product);
      }
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentQuantity === 0) {
      setError("A quantidade de ajuste não pode ser zero");
      return;
    }

    if (!adjustmentReason.trim()) {
      setError("É necessário informar o motivo do ajuste");
      return;
    }

    setSubmitting(true);
    const result = await adjustStock(
      id,
      adjustmentQuantity,
      adjustmentReason,
      "user_id_here"
    ); // Aqui precisaria do ID do usuário atual

    if (result.error) {
      setError(result.error);
    } else {
      // Recarregar o produto após o ajuste
      const refreshResult = await getProductById(id);
      if (refreshResult.product) {
        setProduct(refreshResult.product as Product);
      }
      setAdjustmentQuantity(0);
      setAdjustmentReason("");
    }
    setSubmitting(false);
  };

  const formatCurrency = (value: Decimal | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando informações do produto...</p>
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
        <Link href="/inventory" className="text-blue-600 hover:underline">
          Voltar para inventário
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Produto não encontrado.</p>
          <Link
            href="/inventory"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Voltar para inventário
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header e navegação */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/inventory" className="text-blue-600 hover:underline">
            ← Voltar para inventário
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Detalhes do Produto
          </h1>
        </div>

        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Editar Produto
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Informações do produto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        {isEditing ? (
          // Formulário de edição
          <form onSubmit={handleUpdateProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-500"
                  value={editForm.sku}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  O SKU não pode ser alterado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={editForm.description || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Compra *
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={Number(editForm.purchasePrice || 0)}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Venda *
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={Number(editForm.sellingPrice || 0)}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Mínimo *
                </label>
                <input
                  type="number"
                  name="minimumStock"
                  value={Number(editForm.minimumStock || 0)}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade *
                </label>
                <input
                  type="text"
                  name="unit"
                  value={editForm.unit || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={editForm.barcode || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="isActive"
                  value={editForm.isActive ? "true" : "false"}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                disabled={submitting}
              >
                {submitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        ) : (
          // Visualização de detalhes
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Informações Básicas
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">SKU:</span>
                  <p className="font-medium">{product.sku}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Nome:</span>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Descrição:</span>
                  <p className="font-medium">{product.description || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Categoria:</span>
                  <p className="font-medium">{product.category.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fornecedor:</span>
                  <p className="font-medium">
                    {product.supplier ? product.supplier.companyName : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <p className="font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Informações de Estoque e Preço
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Estoque Atual:</span>
                  <p
                    className={`font-medium ${
                      product.currentStock <= product.minimumStock
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {product.currentStock} {product.unit}
                    {product.currentStock <= product.minimumStock && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        Estoque Baixo
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estoque Mínimo:</span>
                  <p className="font-medium">
                    {product.minimumStock} {product.unit}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Preço de Compra:
                  </span>
                  <p className="font-medium">
                    {formatCurrency(product.purchasePrice)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Preço de Venda:</span>
                  <p className="font-medium">
                    {formatCurrency(product.sellingPrice)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Localização:</span>
                  <p className="font-medium">{product.location || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Código de Barras:
                  </span>
                  <p className="font-medium">{product.barcode || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ajuste de Estoque */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Ajuste de Estoque
        </h2>
        <form
          onSubmit={handleStockAdjustment}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade (+ entrada, - saída)
            </label>
            <input
              type="number"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <input
              type="text"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Ex: Contagem física, Dano, Devolução..."
            />
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
              disabled={submitting}
            >
              {submitting ? "Processando..." : "Ajustar Estoque"}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico de Preços */}
      {product.priceHistory && product.priceHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Histórico de Preços
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço de Compra
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço de Venda
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {product.priceHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(history.effectiveDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(history.purchasePrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(history.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {history.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movimentações de Estoque */}
      {product.stockMovements && product.stockMovements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Movimentações de Estoque
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {product.stockMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {movement.type}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                        movement.quantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {movement.quantity > 0
                        ? `+${movement.quantity}`
                        : movement.quantity}{" "}
                      {product.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {movement.user.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {movement.notes || "-"}
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
