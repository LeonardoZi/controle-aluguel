"use client";

import { useState } from "react";
import Link from "next/link";

// Definição dos cartões de relatórios
interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  available: boolean;
}

export default function ReportsPage() {
  // Lista de relatórios disponíveis e planejados
  const reportCards: ReportCard[] = [
    {
      id: "inventory",
      title: "Relatório de Inventário",
      description:
        "Análise de estoque, valores, produtos com estoque baixo e movimentações",
      icon: "📦",
      path: "/reports/inventory",
      color: "bg-blue-50 border-blue-200 text-blue-800",
      available: true,
    },
    {
      id: "purchases",
      title: "Relatório de Compras",
      description:
        "Análise de pedidos de compra, fornecedores e valores investidos",
      icon: "🛒",
      path: "/reports/purchases",
      color: "bg-green-50 border-green-200 text-green-800",
      available: true,
    },
    {
      id: "sales",
      title: "Relatório de Vendas",
      description:
        "Análise de vendas, faturamento, produtos mais vendidos e clientes",
      icon: "💰",
      path: "/reports/sales",
      color: "bg-purple-50 border-purple-200 text-purple-800",
      available: true,
    },
    {
      id: "financial",
      title: "Relatório Financeiro",
      description: "Análise de lucros, despesas, fluxo de caixa e projeções",
      icon: "📊",
      path: "/reports/financial",
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      available: false,
    },
    {
      id: "customers",
      title: "Relatório de Clientes",
      description: "Análise de clientes, frequência de compras e fidelidade",
      icon: "👥",
      path: "/reports/customers",
      color: "bg-red-50 border-red-200 text-red-800",
      available: false,
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar relatórios com base na pesquisa
  const filteredReports = reportCards.filter(
    (card) =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mr-4">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Relatórios e Análises
        </h1>
        <p className="text-gray-500 mt-1">
          Acesse os relatórios disponíveis para análise de dados do seu negócio
        </p>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar relatórios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Grid de cartões de relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((card) => (
          <div
            key={card.id}
            className={`border rounded-lg shadow-sm overflow-hidden ${
              card.available ? "" : "opacity-60"
            }`}
          >
            <div className={`p-5 ${card.color}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{card.title}</h2>
                <span className="text-3xl">{card.icon}</span>
              </div>
              <p className="mt-2 text-sm">{card.description}</p>

              <div className="mt-4">
                {card.available ? (
                  <Link
                    href={card.path}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Acessar Relatório
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md font-semibold text-sm text-gray-500 cursor-not-allowed">
                    Em Desenvolvimento
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">
            Nenhum relatório encontrado para &quot;{searchTerm}&quot;
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-2 text-blue-600 hover:underline"
          >
            Limpar pesquisa
          </button>
        </div>
      )}

      {/* Dicas de uso */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800">
          Dicas para relatórios
        </h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>
            Utilize os filtros disponíveis em cada relatório para análises mais
            específicas
          </li>
          <li>
            Exporte os relatórios em CSV para utilizar os dados em outras
            ferramentas
          </li>
          <li>
            Os relatórios são atualizados em tempo real com os dados do sistema
          </li>
          <li>
            Para visualizar dados de períodos específicos, utilize os filtros de
            data
          </li>
        </ul>
      </div>
    </div>
  );
}
