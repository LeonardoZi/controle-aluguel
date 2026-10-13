import Link from "next/link";
import { Button } from "@/components/ui/button";
import MarketClient from "./MarketClient";
import { prisma } from "@/lib/prisma";

export default async function MarketPage() {
  const listaMercado = await prisma.precoMercado.findMany({
    orderBy: { nome: "asc" },
  });

  const listaMercadoFormat = listaMercado.map((item) => ({
    id: item.id,
    codigoSinapi: item.codigoSinapi,
    nome: item.nome,
    unidade: item.unidade,
    precoUnitario: Number(item.precoUnitario),
  }));

  return (
    <div className="container mx-auto space-y-10 px-2 py-6 sm:px-4 sm:py-10 animate-fadein">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          asChild
          className="w-fit transition-all hover:scale-105 hover:bg-blue-50/10"
        >
          <Link href="/dashboard">← Voltar</Link>
        </Button>

        <div className="space-y-1 text-left sm:text-right">
          <h1 className="text-3xl font-extrabold drop-shadow-sm tracking-tight animate-slidein dark:text-white text-black">
            Preços de Mercado <span className="text-blue-600">•</span> Consulta
          </h1>
        </div>
      </header>

      <MarketClient materiaisIniciais={listaMercadoFormat} />
    </div>
  );
}
