"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCustomerById,
  deleteCustomer,
  getCustomerSales,
  updateCustomer,
} from "@/actions/customers";
import { CustomerType, Sale } from "@prisma/client";

// Definição de interfaces
interface CustomerData {
  id: string;
  name: string;
  type: CustomerType;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface SaleWithDetails extends Sale {
  customer: CustomerData | null;
  items: Array<{
    id: string;
    productId: string;
    product: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

// Alternativa mais simples e direta que resolve o problema:
type CustomerResponse = {
  customer?: CustomerData;
  error?: string;
};

type SalesResponse = {
  sales?: SaleWithDetails[];
  error?: string;
};

// ADICIONAR: Tipo para atualização de cliente
interface CustomerUpdateData {
  name?: string;
  type?: CustomerType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
  isActive?: boolean;
}

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CustomerData>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      const result = (await getCustomerById(id)) as CustomerResponse;
      if (result.error) {
        setError(result.error);
      } else if (result.customer) {
        setCustomer(result.customer as CustomerData);
        setFormData(result.customer as CustomerData);

        // Buscar as vendas do cliente com tipagem correta
        const salesResult = (await getCustomerSales(id)) as SalesResponse;
        if (salesResult.sales) {
          setSales(salesResult.sales as SaleWithDetails[]);
        }
      }
      setLoading(false);
    };

    fetchCustomerData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Tratamento especial para o campo isActive que precisa ser boolean
    if (name === "isActive") {
      setFormData({
        ...formData,
        [name]: value === "true", // Converte a string 'true'/'false' para boolean
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converter null para undefined para evitar erros de tipo
    const updateData: CustomerUpdateData = {};

    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.type !== undefined) updateData.type = formData.type;
    if (formData.email !== undefined && formData.email !== null)
      updateData.email = formData.email;
    if (formData.phone !== undefined && formData.phone !== null)
      updateData.phone = formData.phone;
    if (formData.address !== undefined && formData.address !== null)
      updateData.address = formData.address;
    if (formData.city !== undefined && formData.city !== null)
      updateData.city = formData.city;
    if (formData.state !== undefined && formData.state !== null)
      updateData.state = formData.state;
    if (formData.postalCode !== undefined && formData.postalCode !== null)
      updateData.postalCode = formData.postalCode;
    if (formData.taxId !== undefined && formData.taxId !== null)
      updateData.taxId = formData.taxId;
    if (formData.isActive !== undefined)
      updateData.isActive = formData.isActive;

    const result = (await updateCustomer(id, updateData)) as CustomerResponse;
    if (result.error) {
      setError(result.error);
    } else if (result.customer) {
      setCustomer(result.customer as CustomerData);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      setIsDeleting(true);
      const result = await deleteCustomer(id);
      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
      } else {
        router.push("/customers");
      }
    }
  };

  const formatDate = (dateValue: string | Date): string => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <p className="text-gray-500">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Link
            href="/customers"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Voltar para lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <p className="text-gray-500">Cliente não encontrado.</p>
          <Link
            href="/customers"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Voltar para lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link
            href="/customers"
            className="text-blue-600 hover:underline mr-4"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Detalhes do Cliente
          </h1>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="type"
                  value={formData.type || "PERSON"}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="PERSON">Pessoa Física</option>
                  <option value="COMPANY">Pessoa Jurídica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="isActive"
                  value={
                    formData.isActive !== undefined
                      ? formData.isActive.toString()
                      : "true"
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Informações Básicas
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Nome:</span>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <p className="font-medium">
                    {customer.type === "PERSON"
                      ? "Pessoa Física"
                      : "Pessoa Jurídica"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CPF/CNPJ:</span>
                  <p className="font-medium">{customer.taxId || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{customer.email || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Telefone:</span>
                  <p className="font-medium">{customer.phone || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <p className="font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        customer.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {customer.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Endereço</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Endereço:</span>
                  <p className="font-medium">{customer.address || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Cidade:</span>
                  <p className="font-medium">{customer.city || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estado:</span>
                  <p className="font-medium">{customer.state || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CEP:</span>
                  <p className="font-medium">{customer.postalCode || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Data de Cadastro:
                  </span>
                  <p className="font-medium">
                    {formatDate(customer.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Histórico de Vendas</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {sales.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-gray-500">
              Este cliente ainda não possui vendas registradas.
            </p>
            <Link
              href={`/sales/new?customerId=${id}`}
              className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              Registrar uma venda para este cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forma de Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(sale.saleDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(sale.totalAmount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {sale.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.status === "COMPLETED"
                          ? "Concluída"
                          : sale.status === "PENDING"
                          ? "Pendente"
                          : "Cancelada"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
        )}
      </div>
    </div>
  );
}
