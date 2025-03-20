import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white text-gray-900">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        {/* Header Section - Improved */}
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
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
            <h2 className="text-xl font-semibold mb-2">Inventário</h2>
            <p className="text-sm mb-4 text-gray-600">
              Gerencie seu estoque de materiais elétricos com facilidade.
            </p>
            <a
              href="/inventory"
              className="text-blue-600 hover:underline text-sm"
            >
              Acessar →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
            <h2 className="text-xl font-semibold mb-2">Vendas</h2>
            <p className="text-sm mb-4 text-gray-600">
              Registre e acompanhe todas as vendas e transações.
            </p>
            <a href="/sales" className="text-blue-600 hover:underline text-sm">
              Acessar →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
            <h2 className="text-xl font-semibold mb-2">Fornecedores</h2>
            <p className="text-sm mb-4 text-gray-600">
              Gerencie seus fornecedores e pedidos pendentes.
            </p>
            <a
              href="/suppliers"
              className="text-blue-600 hover:underline text-sm"
            >
              Acessar →
            </a>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-6">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/dashboard"
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
          </a>
          <a
            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-100 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/reports"
          >
            Relatórios
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-600">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="/help"
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
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="/settings"
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
        </a>
        <span className="text-sm text-gray-500">
          © 2024 Controle de Estoque
        </span>
      </footer>
    </div>
  );
}
