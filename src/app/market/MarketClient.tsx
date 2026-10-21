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
            Painel analítico
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

      <TabsContent value="graficos">
        <p>Gráficos em construção...</p>
      </TabsContent>
    </Tabs>
  );
}
