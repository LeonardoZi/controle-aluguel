"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

interface Supplier {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  price?: Decimal | number;
}

interface PurchaseOrder {
  id: string;
  orderDate: string | Date;
  status: string;
  totalAmount: Decimal | number;
  items: {
    id: string;
    quantity: number;
  }[];
}

export default function SupplierDetails({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "products" | "purchases">(
    "info"
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSupplierData = async () => {
      setLoading(true);
      try {
        // Buscar dados do fornecedor
        const response = await fetch(`/api/suppliers/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar dados do fornecedor");
        }

        setSupplier(data.supplier);

        // Buscar produtos deste fornecedor
        const productsResponse = await fetch(`/api/suppliers/${id}/products`);
        const productsData = await productsResponse.json();

        if (productsResponse.ok) {
          setProducts(productsData.products || []);
        }

        // Buscar histórico de compras deste fornecedor
        const purchasesResponse = await fetch(`/api/suppliers/${id}/purchases`);
        const purchasesData = await purchasesResponse.json();

        if (purchasesResponse.ok) {
          setPurchases(purchasesData.purchases || []);
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Ocorreu um erro ao carregar os dados do fornecedor.");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
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

  const handleDelete = async () => {
    if (!deleteConfirmation || !supplier) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir fornecedor");
      }

      // Redirecionar para a lista de fornecedores
      window.location.href = "/suppliers";
    } catch (err) {
      console.error("Erro ao excluir fornecedor:", err);
      setError("Ocorreu um erro ao excluir o fornecedor.");
      setDeleteConfirmation(false);
    } finally {
      setDeleting(false);
    }
  };

  const toggleDeleteConfirmation = () => {
    setDeleteConfirmation(!deleteConfirmation);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando dados do fornecedor...</p>
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
        <Link href="/suppliers" className="text-blue-600 hover:underline">
          Voltar para lista de fornecedores
        </Link>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Fornecedor não encontrado.</p>
          <Link
            href="/suppliers"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Voltar para lista de fornecedores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com navegação e ações */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/suppliers" className="text-blue-600 hover:underline">
            ← Voltar para fornecedores
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            {supplier.companyName}
          </h1>
          <p className="text-gray-500">
            {supplier.isActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ativo
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Inativo
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/suppliers/${id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Editar
          </Link>
          <button
            onClick={toggleDeleteConfirmation}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {deleteConfirmation && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="mb-2">
            Tem certeza que deseja excluir este fornecedor? Esta ação não pode
            ser desfeita.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={toggleDeleteConfirmation}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              {deleting ? "Excluindo..." : "Confirmar Exclusão"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs de navegação */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("info")}
          className={`py-2 px-4 mr-2 ${
            activeTab === "info"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Informações
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`py-2 px-4 mr-2 ${
            activeTab === "products"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Produtos ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={`py-2 px-4 ${
            activeTab === "purchases"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Compras ({purchases.length})
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Informações do Fornecedor */}
        {activeTab === "info" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Dados do Fornecedor
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Informações de Contato
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Empresa:</span>
                    <p className="font-medium">{supplier.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Contato:</span>
                    <p className="font-medium">{supplier.contactName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="font-medium">{supplier.email || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Telefone:</span>
                    <p className="font-medium">{supplier.phone || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">CNPJ/CPF:</span>
                    <p className="font-medium">{supplier.taxId || "-"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Endereço
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Endereço:</span>
                    <p className="font-medium">{supplier.address || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Cidade:</span>
                    <p className="font-medium">{supplier.city || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Estado:</span>
                    <p className="font-medium">{supplier.state || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">CEP:</span>
                    <p className="font-medium">{supplier.postalCode || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">País:</span>
                    <p className="font-medium">
                      {supplier.country || "Brasil"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {supplier.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Observações
                </h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                  {supplier.notes}
                </p>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
              <p>Cadastrado em: {formatDate(supplier.createdAt)}</p>
              <p>Última atualização: {formatDate(supplier.updatedAt)}</p>
            </div>
          </div>
        )}

        {/* Produtos do Fornecedor */}
        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Produtos Fornecidos
              </h2>
              <Link
                href={`/products/new?supplierId=${id}`}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Adicionar Produto
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded border border-gray-200">
                <p className="text-gray-500">
                  Este fornecedor ainda não possui produtos cadastrados.
                </p>
                <Link
                  href={`/products/new?supplierId=${id}`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Cadastrar um produto
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                          <span
                            className={`${
                              product.currentStock <= 0
                                ? "text-red-600"
                                : product.currentStock <= 10
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {product.price ? formatCurrency(product.price) : "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <Link
                            href={`/products/${product.id}`}
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
            )}
          </div>
        )}

        {/* Histórico de Compras */}
        {activeTab === "purchases" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Histórico de Compras
              </h2>
              <Link
                href={`/purchases/new?supplierId=${id}`}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Nova Compra
              </Link>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded border border-gray-200">
                <p className="text-gray-500">
                  Nenhuma compra registrada para este fornecedor.
                </p>
                <Link
                  href={`/purchases/new?supplierId=${id}`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Registrar uma compra
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Itens
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{purchase.id.substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {formatDate(purchase.orderDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              purchase.status === "RECEIVED"
                                ? "bg-green-100 text-green-800"
                                : purchase.status === "PARTIALLY_RECEIVED"
                                ? "bg-purple-100 text-purple-800"
                                : purchase.status === "ORDERED"
                                ? "bg-indigo-100 text-indigo-800"
                                : purchase.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : purchase.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {purchase.status === "RECEIVED"
                              ? "Recebido"
                              : purchase.status === "PARTIALLY_RECEIVED"
                              ? "Parcial"
                              : purchase.status === "ORDERED"
                              ? "Enviado"
                              : purchase.status === "APPROVED"
                              ? "Aprovado"
                              : purchase.status === "CANCELLED"
                              ? "Cancelado"
                              : "Pendente"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {purchase.items.length}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {formatCurrency(purchase.totalAmount)}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
