"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCustomers } from "@/actions/customers";
import { CustomerType } from "@prisma/client";

// Adicionar interface para o cliente
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
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const { customers, error } = await getCustomers();
      if (error) {
        setError(error);
      } else {
        setCustomers(customers || []);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const { customers, error } = await getCustomers(searchQuery);
    if (error) {
      setError(error);
    } else {
      setCustomers(customers || []);
    }
    setLoading(false);
  };

  const filteredCustomers = searchQuery
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customer.phone && customer.phone.includes(searchQuery))
      )
    : customers;

  const getCustomerTypeLabel = (type: CustomerType) => {
    return type === "PERSON" ? "Pessoa Física" : "Pessoa Jurídica";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <Link
          href="/customers/new"
          className="btn-primary px-4 py-2 rounded-md"
        >
          Novo Cliente
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
          >
            Buscar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Carregando clientes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cidade/UF
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      {customer.taxId && (
                        <div className="text-xs text-gray-500">
                          {customer.taxId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {getCustomerTypeLabel(customer.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {customer.email || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {customer.phone || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {customer.city
                          ? `${customer.city}${
                              customer.state ? `/${customer.state}` : ""
                            }`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
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
