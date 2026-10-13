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
import { useState } from "react";

interface MaterialProps {
  id: string;
  codigoSinapi: string;
  nome: string;
  unidade: string;
  precoUnitario: number;
}

export default function MarketClient({
  materiaisIniciais,
}: {
  materiaisIniciais: MaterialProps[];
}) {
  const [busca, setBusca] = useState("");

  const materiaisFiltrados = materiaisIniciais.filter((item) =>
    item.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <input
        value={busca}
        type="text"
        placeholder="Buscar por nome"
        onChange={(e) => setBusca(e.target.value)}
        className="bg-white border-2 border-black rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
      />

      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <div className="h-[70vh] [&>div]:h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="[&_th]:text-black [&_th]:font-semibold">
                  <TableHead>SINAPI</TableHead>
                  <TableHead className="min-w-[300px]">Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-center">Preço</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
