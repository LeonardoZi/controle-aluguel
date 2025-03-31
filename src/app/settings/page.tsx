"use client";

import { useState, useEffect } from "react";

// Interface para as configurações do sistema
interface SystemSettings {
  companyName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  currencyFormat: string;
  dateFormat: string;
  lowStockThreshold: number;
  enableNotifications: boolean;
  defaultPaymentTerms: number;
  defaultTaxRate: number;
}

// Interface para as configurações de usuário
interface UserPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
  showDashboardStats: boolean;
  defaultView: string;
  itemsPerPage: number;
}

export default function SettingsPage() {
  // Estado para as configurações do sistema
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: "Eletro Materiais LTDA",
    taxId: "12.345.678/0001-90",
    email: "contato@eletromateriais.com.br",
    phone: "(11) 3456-7890",
    address: "Rua das Indústrias, 123 - São Paulo - SP",
    currencyFormat: "BRL",
    dateFormat: "DD/MM/YYYY",
    lowStockThreshold: 10,
    enableNotifications: true,
    defaultPaymentTerms: 30,
    defaultTaxRate: 18,
  });

  // Estado para as preferências do usuário
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    darkMode: false,
    emailNotifications: true,
    showDashboardStats: true,
    defaultView: "list",
    itemsPerPage: 20,
  });

  // Estados para controle da UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "system" | "user" | "backup" | "security"
  >("system");

  // Carregar configurações do backend
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Em um sistema real, você buscaria as configurações do backend
        // const response = await fetch("/api/settings");
        // const data = await response.json();
        // setSystemSettings(data.systemSettings);
        // setUserPreferences(data.userPreferences);

        // Simulando um tempo de carregamento para demonstração
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
        setError("Ocorreu um erro ao carregar as configurações.");
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Salvar configurações do sistema
  const handleSystemSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      // Em um sistema real, você enviaria as configurações para o backend
      // const response = await fetch("/api/settings/system", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(systemSettings),
      // });

      // Simulando tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular sucesso
      setSuccess(true);

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      setError("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  // Salvar preferências do usuário
  const handleUserPreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      // Em um sistema real, você enviaria as preferências para o backend
      // const response = await fetch("/api/settings/user", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(userPreferences),
      // });

      // Simulando tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular sucesso
      setSuccess(true);

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar preferências:", err);
      setError("Ocorreu um erro ao salvar as preferências.");
    } finally {
      setSaving(false);
    }
  };

  // Atualizar campo de configuração do sistema
  const updateSystemSetting = (
    field: keyof SystemSettings,
    value: SystemSettings[keyof SystemSettings]
  ) => {
    setSystemSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Atualizar campo de preferência do usuário
  const updateUserPreference = (
    field: keyof UserPreferences,
    value: UserPreferences[keyof UserPreferences]
  ) => {
    setUserPreferences((prev) => ({ ...prev, [field]: value }));
  };

  // Realizar backup dos dados
  const handleBackup = async () => {
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      // Simulando tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simular download do arquivo
      const date = new Date().toISOString().slice(0, 10);
      alert(`Backup gerado com sucesso: backup_${date}.zip`);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao gerar backup:", err);
      setError("Ocorreu um erro ao gerar o backup.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-500 mt-1">
          Gerencie as configurações do sistema e suas preferências
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Alterações salvas com sucesso!
        </div>
      )}

      {/* Tabs de navegação */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("system")}
          className={`py-2 px-4 mr-2 ${
            activeTab === "system"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Configurações do Sistema
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`py-2 px-4 mr-2 ${
            activeTab === "user"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preferências do Usuário
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={`py-2 px-4 mr-2 ${
            activeTab === "backup"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Backup e Restauração
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`py-2 px-4 ${
            activeTab === "security"
              ? "border-b-2 border-blue-500 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Segurança
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Configurações do Sistema */}
        {activeTab === "system" && (
          <form onSubmit={handleSystemSettingsSave}>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Informações da Empresa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={systemSettings.companyName}
                  onChange={(e) =>
                    updateSystemSetting("companyName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={systemSettings.taxId}
                  onChange={(e) => updateSystemSetting("taxId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={systemSettings.email}
                  onChange={(e) => updateSystemSetting("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={systemSettings.phone}
                  onChange={(e) => updateSystemSetting("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={systemSettings.address}
                  onChange={(e) =>
                    updateSystemSetting("address", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Configurações Gerais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato de Moeda
                </label>
                <select
                  value={systemSettings.currencyFormat}
                  onChange={(e) =>
                    updateSystemSetting("currencyFormat", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="BRL">Real Brasileiro (R$)</option>
                  <option value="USD">Dólar Americano ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato de Data
                </label>
                <select
                  value={systemSettings.dateFormat}
                  onChange={(e) =>
                    updateSystemSetting("dateFormat", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                  <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                  <option value="YYYY-MM-DD">AAAA-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Estoque Baixo
                </label>
                <input
                  type="number"
                  min="0"
                  value={systemSettings.lowStockThreshold}
                  onChange={(e) =>
                    updateSystemSetting(
                      "lowStockThreshold",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo Padrão de Pagamento (dias)
                </label>
                <input
                  type="number"
                  min="0"
                  value={systemSettings.defaultPaymentTerms}
                  onChange={(e) =>
                    updateSystemSetting(
                      "defaultPaymentTerms",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Imposto Padrão (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={systemSettings.defaultTaxRate}
                  onChange={(e) =>
                    updateSystemSetting(
                      "defaultTaxRate",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={systemSettings.enableNotifications}
                  onChange={(e) =>
                    updateSystemSetting("enableNotifications", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="enableNotifications"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Ativar notificações do sistema
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
              >
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </form>
        )}

        {/* Preferências do Usuário */}
        {activeTab === "user" && (
          <form onSubmit={handleUserPreferencesSave}>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Preferências de Interface
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={userPreferences.darkMode}
                  onChange={(e) =>
                    updateUserPreference("darkMode", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="darkMode"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Modo escuro
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showDashboardStats"
                  checked={userPreferences.showDashboardStats}
                  onChange={(e) =>
                    updateUserPreference("showDashboardStats", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="showDashboardStats"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Mostrar estatísticas no dashboard
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visualização padrão
                </label>
                <select
                  value={userPreferences.defaultView}
                  onChange={(e) =>
                    updateUserPreference("defaultView", e.target.value)
                  }
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="list">Lista</option>
                  <option value="grid">Grade</option>
                  <option value="table">Tabela</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Itens por página
                </label>
                <select
                  value={userPreferences.itemsPerPage}
                  onChange={(e) =>
                    updateUserPreference(
                      "itemsPerPage",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Notificações
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={userPreferences.emailNotifications}
                  onChange={(e) =>
                    updateUserPreference("emailNotifications", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="emailNotifications"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Receber notificações por email
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
              >
                {saving ? "Salvando..." : "Salvar Preferências"}
              </button>
            </div>
          </form>
        )}

        {/* Backup e Restauração */}
        {activeTab === "backup" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Backup e Restauração
            </h2>

            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-md font-medium mb-2">Backup do Sistema</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Crie um backup completo dos dados do sistema. O arquivo será
                  gerado e disponibilizado para download.
                </p>
                <button
                  onClick={handleBackup}
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                >
                  {saving ? "Gerando Backup..." : "Gerar Backup"}
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-md font-medium mb-2">
                  Restauração de Backup
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Restaure um backup previamente salvo. Todos os dados atuais
                  serão substituídos pelos dados do backup.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="backupFile"
                    accept=".zip,.json"
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    type="button"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Restaurar
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-md font-medium mb-2">
                  Backups Automáticos
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Configure backups automáticos periódicos.
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="enableAutoBackup"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableAutoBackup"
                    className="text-sm text-gray-700"
                  >
                    Ativar backups automáticos
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="backupFrequency"
                    className="text-sm text-gray-700"
                  >
                    Frequência:
                  </label>
                  <select
                    id="backupFrequency"
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segurança */}
        {activeTab === "security" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Configurações de Segurança
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-3">Alterar Senha</h3>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Alterar Senha
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium mb-3">Sessões Ativas</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Gerencie os dispositivos conectados à sua conta.
                </p>

                <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    <div className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          Computador Windows (Chrome)
                        </div>
                        <div className="text-xs text-gray-500">
                          São Paulo, Brasil • Ativo agora
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Sessão Atual
                      </span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">iPhone (Safari)</div>
                        <div className="text-xs text-gray-500">
                          São Paulo, Brasil • Há 2 horas
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Encerrar
                      </button>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          Tablet Android (Chrome)
                        </div>
                        <div className="text-xs text-gray-500">
                          Rio de Janeiro, Brasil • Há 3 dias
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Encerrar
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 text-red-600 hover:text-red-800 font-medium"
                >
                  Encerrar todas as outras sessões
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium mb-3">
                  Autenticação de Dois Fatores
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Adicione uma camada extra de segurança à sua conta.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable2FA"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="enable2FA" className="text-sm text-gray-700">
                    Ativar autenticação de dois fatores
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
