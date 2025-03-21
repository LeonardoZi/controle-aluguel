import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white text-gray-900">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="w-full bg-gradient-to-r from-blue-50 to-white p-6 sm:p-10 rounded-xl border-l-4 border-blue-500 shadow-sm mb-6">
          <div className="max-w-4xl mx-auto sm:mx-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
                Sistema Empresarial
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              Controle de Estoque em
              <br className="hidden sm:block" /> Comércio de{" "}
              <span className="text-blue-600">Materiais Elétricos</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Sistema completo para gerenciamento de inventário, controle de
              vendas e relacionamento com fornecedores, desenvolvido
              especificamente para
              <span className="font-medium">
                {" "}
                impulsionar seu negócio de materiais elétricos
              </span>
              .
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Fácil de usar
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Relatórios detalhados
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                Controle eficiente
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-4">
          <Link href="/inventory" className="card group">
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
              Inventário
            </h2>
            <p className="text-sm mb-4 text-gray-600">
              Gerencie seu estoque de materiais elétricos com facilidade.
            </p>
            <span className="text-blue-600 text-sm flex items-center gap-1">
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

          <Link href="/sales" className="card group">
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
              Vendas
            </h2>
            <p className="text-sm mb-4 text-gray-600">
              Registre e acompanhe todas as vendas e transações.
            </p>
            <span className="text-blue-600 text-sm flex items-center gap-1">
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

          <Link href="/suppliers" className="card group">
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
              Fornecedores
            </h2>
            <p className="text-sm mb-4 text-gray-600">
              Gerencie seus fornecedores e pedidos pendentes.
            </p>
            <span className="text-blue-600 text-sm flex items-center gap-1">
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

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-6">
          <Link
            href="/dashboard"
            className="btn-primary rounded-full flex items-center justify-center gap-2 h-10 sm:h-12 px-5"
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
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/reports"
            className="btn-secondary rounded-full flex items-center justify-center h-10 sm:h-12 px-5 sm:min-w-44"
          >
            Relatórios
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-8">
          <Link
            href="/customers"
            className="card bg-gradient-to-br from-blue-50 to-white"
          >
            <h2 className="text-lg font-medium mb-1">Clientes</h2>
            <p className="text-sm text-gray-600">Gerenciar base de clientes</p>
          </Link>
          <Link
            href="/purchases"
            className="card bg-gradient-to-br from-blue-50 to-white"
          >
            <h2 className="text-lg font-medium mb-1">Compras</h2>
            <p className="text-sm text-gray-600">Pedidos a fornecedores</p>
          </Link>
          <Link
            href="/reports"
            className="card bg-gradient-to-br from-blue-50 to-white"
          >
            <h2 className="text-lg font-medium mb-1">Relatórios</h2>
            <p className="text-sm text-gray-600">Análises e estatísticas</p>
          </Link>
          <Link
            href="/settings"
            className="card bg-gradient-to-br from-blue-50 to-white"
          >
            <h2 className="text-lg font-medium mb-1">Configurações</h2>
            <p className="text-sm text-gray-600">Ajustes do sistema</p>
          </Link>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-600 w-full">
        <Link
          href="/help"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
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
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Ajuda
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        >
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Configurações
        </Link>
        <span className="text-sm text-gray-500">
          © 2024 Controle de Estoque
        </span>
      </footer>
    </div>
  );
}
