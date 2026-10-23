"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";

interface MaterialProps {
  id: string;
  codigoSinapi: string;
  nome: string;
  unidade: string;
  precoUnitario: number;
}

export default function MarketClient({
  materiaisIniciais,
  onSelect,
}: {
  materiaisIniciais: MaterialProps[];
  onSelect?: (codigo: string) => void;
}) {
  const [busca, setBusca] = useState("");

  const materiaisFiltrados = materiaisIniciais.filter((item) =>
    item.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const COLORS = [
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#c084fc",
    "#2dd4bf",
    "#94a3b8",
  ];

  const dadosGraficoPizza = useMemo(() => {
    const categorias = {
      "Fios e Cabos": { total: 0, count: 0, keywords: ["FIO", "CABO"] },
      "Proteção e Comando": {
        total: 0,
        count: 0,
        keywords: ["DISJUNTOR", "QUADRO", "CONTATOR", "RELE", "BARRAMENTO"],
      },
      Infraestrutura: {
        total: 0,
        count: 0,
        keywords: [
          "ELETRODUTO",
          "CONDUI",
          "CANALETA",
          "CAIXA",
          "PERFILADO",
          "ELETROCALHA",
          "CURVA",
          "LUVA",
          "ABRACADEIRA",
          "HASTE",
        ],
      },
      Iluminação: {
        total: 0,
        count: 0,
        keywords: [
          "LAMPADA",
          "LUMINARIA",
          "REFLETOR",
          "PLAFON",
          "PROJETOR",
          "REATOR",
          "FITA DE LED",
        ],
      },
      "Tomadas e Acessórios": {
        total: 0,
        count: 0,
        keywords: [
          "TOMADA",
          "INTERRUPTOR",
          "PLACA",
          "PLUG",
          "BOCAL",
          "CONECTOR",
          "TERMINAL",
        ],
      },
      Ferramentas: {
        total: 0,
        count: 0,
        keywords: ["ALICATE", "FURADEIRA", "MACARICO", "CHAVE", "MULTIMETRO"],
      },
    };
    const outros = { total: 0, count: 0 };

    materiaisIniciais.forEach((m) => {
      const nome = m.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
      let achou = false;
      for (const [, dados] of Object.entries(categorias)) {
        if (dados.keywords.some((k) => nome.includes(k))) {
          dados.total += m.precoUnitario;
          dados.count++;
          achou = true;
          break;
        }
      }
      if (!achou) {
        outros.total += m.precoUnitario;
        outros.count++;
      }
    });

    const resultado = Object.entries(categorias)
      .filter(([, d]) => d.count > 0)
      .map(([name, d]) => ({
        name,
        value: d.total / d.count,
        quantidade: d.count,
      }));

    if (outros.count > 0) {
      resultado.push({
        name: "Diversos",
        value: outros.total / outros.count,
        quantidade: outros.count,
      });
    }
    return resultado.sort((a, b) => b.value - a.value);
  }, [materiaisIniciais]);

  return (
    <Tabs defaultValue="tabela" className="w-full">
      {!onSelect && (
        <TabsList className="mb-4 inline-flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
          <TabsTrigger
            className="px-6 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-md"
            value="tabela"
          >
            Consulta em tabela
          </TabsTrigger>
          <TabsTrigger
            className="px-6 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-md"
            value="graficos"
          >
            Ticket Médio
          </TabsTrigger>
        </TabsList>
      )}

      <TabsContent value="tabela">
        <input
          value={busca}
          type="text"
          placeholder="Buscar por nome"
          onChange={(e) => setBusca(e.target.value)}
          className="mb-4 bg-white border-2 border-black rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-0">
            <div className="h-[70vh] [&>div]:h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-card bg-white z-10">
                  <TableRow className="[&_th]:text-black [&_th]:font-semibold">
                    <TableHead>SINAPI</TableHead>
                    <TableHead className="min-w-[300px]">Nome</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-center">Preço</TableHead>
                    {onSelect && (
                      <TableHead className="text-center w-[120px]">
                        Ação
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {materiaisFiltrados.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-center font-medium text-blue-600">
                        {item.codigoSinapi}
                      </TableCell>

                      <TableCell>{item.nome}</TableCell>

                      <TableCell className="whitespace-nowrap text-center">
                        {item.unidade}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-center font-bold text-gray-800">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.precoUnitario)}
                      </TableCell>

                      <TableCell>
                        {onSelect && (
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              onClick={() => onSelect(item.codigoSinapi)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Selecionar
                            </Button>
                          </TableCell>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="graficos" className="mt-6">
        <Card className="bg-white dark:bg-slate-900 shadow-md border-0 p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Ticket Médio por Categoria
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Preço médio oficial do SINAPI agrupado por setores da loja
          </p>

          <div className="h-[450px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGraficoPizza}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  dataKey="value"
                  stroke="none"
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                >
                  {dadosGraficoPizza.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl text-slate-50">
                          <p className="font-bold text-base mb-1">
                            {data.name}
                          </p>
                          <p className="text-blue-400 text-sm font-semibold">
                            Ticket Médio: R$ {Number(data.value).toFixed(2)}
                          </p>
                          <p className="text-slate-400 text-xs mt-2">
                            Baseado em {data.quantidade} produtos
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    color: "#888888",
                    fontSize: "13px",
                    paddingTop: "20px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
