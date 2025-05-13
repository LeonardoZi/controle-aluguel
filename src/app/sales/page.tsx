"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { getSales } from "@/actions/sales";
import { processReturn } from "@/actions/returns";

// Tipos
type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

interface Customer {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  customerId: string | null;
  customer: Customer | null;
  saleDate: string | Date;
  status: OrderStatus;
  totalAmount: Decimal | number;
  paymentMethod: string;
  items: {
    id: string;
    quantity: number;
    productId: string;
    unitPrice: Decimal | number;
    total: Decimal | number;
  }[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const result = await getSales();

        if (result.error) {
          throw new Error(result.error);
        }

        setSales(result.sales || []);
      } catch (err) {
        console.error("Erro ao buscar vendas:", err);
        setError("Ocorreu um erro ao carregar as vendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Controla o dropdown
  const toggleDropdown = (e: React.MouseEvent, saleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdown((prevState) => (prevState === saleId ? null : saleId));
  };

  // Fecha o dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown !== null) {
        setOpenDropdown(null);
      }
    };

    // Adiciona o listener com um pequeno atraso para evitar que ele seja acionado imediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdown]);

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

  const getStatusLabel = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string }> = {
      PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      PROCESSING: {
        label: "Em Processamento",
        color: "bg-blue-100 text-blue-800",
      },
      SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
      DELIVERED: { label: "Entregue", color: "bg-purple-100 text-purple-800" },
      COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  const filteredSales = sales.filter((sale) => {
    // Filtro de texto (cliente ou ID)
    const matchesSearch =
      searchTerm === "" ||
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de status
    const matchesStatus = statusFilter === "" || sale.status === statusFilter;

    // Filtro de data inicial
    const saleDate = new Date(sale.saleDate);
    const matchesStartDate = !startDate || saleDate >= new Date(startDate);

    // Filtro de data final
    const matchesEndDate =
      !endDate || saleDate <= new Date(`${endDate}T23:59:59`);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  const handleOptionClick = async (
    e: React.MouseEvent,
    saleId: string,
    option: string
  ) => {
    e.stopPropagation();
    setOpenDropdown(null);

    // Buscar a venda selecionada
    const selectedSale = sales.find((sale) => sale.id === saleId);
    if (!selectedSale) {
      return;
    }

    if (option === "Devolução") {
      // Exibir diálogo de confirmação
      if (
        confirm(
          `Deseja processar uma devolução para a venda #${saleId.substring(
            0,
            8
          )}?`
        )
      ) {
        // Aqui você pode abrir um modal para seleção de itens e quantidades
        // Para este exemplo, vamos considerar a devolução do primeiro item
        if (selectedSale.items && selectedSale.items.length > 0) {
          const item = selectedSale.items[0];
          const result = await processReturn({
            saleId,
            userId: selectedSale.user.id,
            items: [
              {
                saleItemId: item.id,
                quantity: item.quantity,
                reason: "Devolução solicitada pelo cliente",
              },
            ],
            notes: "Devolução processada via página de vendas",
          });

          if (result.error) {
            alert(`Erro ao processar devolução: ${result.error}`);
          } else {
            alert(`Devolução processada com sucesso!`);
            // Recarregar os dados
            window.location.reload();
          }
        } else {
          alert("Não há itens para devolução nesta venda.");
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Link href="/" className="text-blue-600 hover:underline mr-4">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>

        <Link
          href="/sales/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nova Venda
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Cliente ou ID..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="PROCESSING">Em Processamento</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {(searchTerm || statusFilter || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Vendas */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {searchTerm || statusFilter || startDate || endDate
              ? "Nenhuma venda encontrada com os filtros aplicados."
              : "Não há vendas registradas."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID/Cliente
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{sale.id.substring(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.customer?.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusLabel(sale.status).color
                        }`}
                      >
                        {getStatusLabel(sale.status).label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {sale.items.length} item(ns)
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => toggleDropdown(e, sale.id)}
                          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                          id={`options-menu-${sale.id}`}
                          aria-expanded="true"
                          aria-haspopup="true"
                        >
                          Opções
                          <svg
                            className="-mr-1 ml-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {openDropdown === sale.id && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby={`options-menu-${sale.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1" role="none">
                              <button
                                onClick={(e) =>
                                  handleOptionClick(e, sale.id, "Devolução")
                                }
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                              >
                                Devolução
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumo */}
      {filteredSales.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-sm text-gray-500">Total de Vendas:</span>
              <p className="text-lg font-semibold">{filteredSales.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Valor Total:</span>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  filteredSales.reduce(
                    (sum, sale) => sum + Number(sale.totalAmount),
                    0
                  )
                )}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Média por Venda:</span>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  filteredSales.length > 0
                    ? filteredSales.reduce(
                        (sum, sale) => sum + Number(sale.totalAmount),
                        0
                      ) / filteredSales.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
