import Link from "next/link";
import { prisma } from "@/lib/prisma";


async function getStats() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      totalCustomers,
      activeSales,
      overdueSales,
      monthRevenue,
      lowStockCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.customer.count({
        where: { isActive: true },
      }),
      prisma.sale.count({
        where: {
          status: { in: ["ATIVO", "ATRASADO"] },
        },
      }),
      prisma.sale.count({
        where: {
          status: "ATRASADO",
        },
      }),
      prisma.sale.aggregate({
        where: {
          status: "CONCLUIDO",
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.product.count({
        where: {
          currentStock: {
            lte: 10,
          },
        },
      }),
    ]);

    return {
      totalProducts,
      totalCustomers,
      activeSales,
      overdueSales,
      monthRevenue: monthRevenue._sum?.totalAmount || 0,
      lowStockCount,
    };
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      totalProducts: 0,
      totalCustomers: 0,
      activeSales: 0,
      overdueSales: 0,
      monthRevenue: 0,
      lowStockCount: 0,
    };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] text-gray-900">
      <div className="bg-white py-4 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                  <path d="M8 17h8"></path>
                  <path d="M9 10h6"></path>
                  <path d="M12 10v7"></path>
                </svg>
              </div>
              <span className="text-blue-600 font-medium tracking-wide text-sm uppercase">
                Sistema de Vendas
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              Venda e Aluguel de Materiais
            </h1>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Receita Mês</p>
                <h3 className="text-2xl font-bold mt-1">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(stats.monthRevenue))}
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20"></path>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
            </div>
          </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vendas Ativas</p>
                <h3 className="text-2xl font-bold mt-1">
                  {stats.activeSales}
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
            </div>
          </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Atrasadas</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">
                  {stats.overdueSales}
                </h3>
              </div>
              <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Produtos</p>
                <h3 className="text-2xl font-bold mt-1">
                  {stats.totalProducts}
                </h3>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m7.5 4.27 9 5.15"></path>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="M12 22V12"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Clientes</p>
                <h3 className="text-2xl font-bold mt-1">
                  {stats.totalCustomers}
                </h3>
              </div>
              <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <path d="M20 8v6"></path>
                  <path d="M23 11h-6"></path>
                </svg>
              </div>
            </div>
          </div>




        </div>

        {/* Main Sections */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Navigation Cards */}
          <div className="md:w-8/12">
            <h2 className="text-xl font-semibold mb-4">Módulos do Sistema</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link
                href="/sales"
                className="card group bg-white flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-green-600 transition-colors">
                    Vendas
                  </h2>
                  <p className="text-sm text-gray-600">
                    Registre e monitore as vendas.
                  </p>
                </div>
                <span className="text-green-600 text-sm flex items-center gap-1 mt-3">
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </span>
              </Link>

              <Link
                href="/customers"
                className="card group bg-white flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <path d="M20 8v6"></path>
                      <path d="M23 11h-6"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 transition-colors">
                    Clientes
                  </h2>
                  <p className="text-sm text-gray-600">
                    Cadastre e gerencie seus clientes.
                  </p>
                </div>
                <span className="text-indigo-600 text-sm flex items-center gap-1 mt-3">
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </span>
              </Link>

              <Link
                href="/inventory"
                className="card group bg-white flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3v18h18"></path>
                      <path d="M18 17V9"></path>
                      <path d="M13 17V5"></path>
                      <path d="M8 17v-3"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    Produtos
                  </h2>
                  <p className="text-sm text-gray-600">
                    Gerencie o catálogo de produtos e estoque.
                  </p>
                </div>
                <span className="text-blue-600 text-sm flex items-center gap-1 mt-3">
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="card group bg-white flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                      <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                    Dashboard
                  </h2>
                  <p className="text-sm text-gray-600">
                    Visualize análises e estatísticas do seu negócio.
                  </p>
                </div>
                <span className="text-purple-600 text-sm flex items-center gap-1 mt-3">
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Quick Access Panel */}
          <div className="md:w-4/12">
            <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col gap-4">
                <Link
                  href="/sales/new"
                  className="btn-success flex items-center justify-center gap-2 px-5 py-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Nova Venda/Aluguel
                </Link>

                <Link
                  href="/customers/new"
                  className="btn-secondary flex items-center justify-center gap-2 px-5 py-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6"></path>
                    <path d="M23 11h-6"></path>
                  </svg>
                  Novo Cliente
                </Link>

                <Link
                  href="/inventory/new"
                  className="btn-secondary flex items-center justify-center gap-2 px-5 py-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Novo Produto
                </Link>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
              © 2024 Sistema de Vendas e Aluguel - Todos os direitos reservados
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
