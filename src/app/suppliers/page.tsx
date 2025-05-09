"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Supplier {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  isActive: boolean;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("companyName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/suppliers");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar fornecedores");
        }

        setSuppliers(data.suppliers || []);
      } catch (err) {
        console.error("Erro ao buscar fornecedores:", err);
        setError("Ocorreu um erro ao carregar os fornecedores.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Aplica filtros e ordenação na lista de fornecedores
  const filteredSuppliers = suppliers
    .filter((supplier) => {
      // Filtro por texto
      const searchMatch =
        searchTerm === "" ||
        supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.contactName &&
          supplier.contactName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (supplier.email &&
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por status ativo/inativo
      const activeMatch =
        activeFilter === "all" ||
        (activeFilter === "active" && supplier.isActive) ||
        (activeFilter === "inactive" && !supplier.isActive);

      return searchMatch && activeMatch;
    })
    .sort((a, b) => {
      // Ordenação
      const fieldA = a[sortField as keyof Supplier] || "";
      const fieldB = b[sortField as keyof Supplier] || "";

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc"
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }

      return 0;
    });

  const toggleSortDirection = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Link href="/" className="text-blue-600 hover:underline mr-4">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>

        <Link
          href="/suppliers/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Novo Fornecedor
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros e busca */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Nome, contato ou email..."
            />
          </div>

          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Fornecedores */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchTerm || activeFilter !== "all"
              ? "Nenhum fornecedor encontrado com os filtros aplicados."
              : "Não há fornecedores cadastrados."}
          </p>
          {(searchTerm || activeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("all");
              }}
              className="text-blue-600 hover:underline mt-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortDirection("companyName")}
                  >
                    <div className="flex items-center">
                      Fornecedor
                      {sortField === "companyName" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contactName || "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {supplier.email && (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="hover:underline"
                          >
                            {supplier.email}
                          </a>
                        )}
                        {supplier.phone && supplier.email && " • "}
                        {supplier.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {supplier.city ? (
                        <>
                          {supplier.city}
                          {supplier.state && `, ${supplier.state}`}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {supplier.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detalhes
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/suppliers/${supplier.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      {suppliers.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredSuppliers.length} de {suppliers.length}{" "}
          fornecedores
          {filteredSuppliers.length > 0 && (
            <> • {suppliers.filter((s) => s.isActive).length} ativos</>
          )}
        </div>
      )}
    </div>
  );
}
