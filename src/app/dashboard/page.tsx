import Link from "next/link";
import { type ReactNode } from "react";
import { getDashboardOverview } from "@/server/dashboard/queries";
import type { SaleStatus } from "@/server/contracts/v1/sales";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HandCoins, Package2, CheckCircle2, CircleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import ChartSection from "@/components/data-display/charts/ChartSection";
import { RevenueChartData } from "@/components/data-display/charts/RevenueChart";
import { BestSellersChartData } from "@/components/data-display/charts/BestSellersChart";

interface SummaryCard {
  title: string;
  value: string | number;
  icon?: ReactNode;
  valueClassName: string;
  href?: string;
  linkLabel?: string;
  caption?: string;
  badge?: {
    label: string;
    variant: BadgeVariant;
  };
}

const statusConfig: Record<
  SaleStatus,
  {
    label: string;
    variant: BadgeVariant;
  }
> = {
  ATIVO: { label: "Ativo", variant: "info" },
  ATRASADO: { label: "Atrasado", variant: "destructive" },
  CONCLUIDO: { label: "Concluído", variant: "success" },
  CANCELADO: { label: "Cancelado", variant: "secondary" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateValue: string | Date): string {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function renderStatusBadge(status: SaleStatus) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function DashboardPage() {
  try {
    const overview = await getDashboardOverview();

    // Gerar dados de receita por data para o gráfico
    // Agrupa as locações concluídas por dia e soma o total

    // Receita por dia
    const revenueMap: Record<string, number> = {};
    // Produtos mais vendidos
    const productSalesMap: Record<string, { name: string; total: number }> = {};

    overview.recentRentals.forEach((rental) => {
      if (rental.status === "CONCLUIDO" && rental.dataRetirada && rental.totalAmount) {
        const date = new Date(rental.dataRetirada);
        const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        revenueMap[label] = (revenueMap[label] || 0) + Number(rental.totalAmount);
      }
      // Contabiliza produtos vendidos
      if (rental.status === "CONCLUIDO" && rental.itens) {
        rental.itens.forEach((item) => {
          if (!item.produto) return;
          const prodId = item.produto.id;
          if (!productSalesMap[prodId]) {
            productSalesMap[prodId] = { name: item.produto.name, total: 0 };
          }
          // Considera como vendido o que não foi devolvido
          const vendido = item.quantidadeRetirada - (item.quantidadeDevolvida || 0);
          productSalesMap[prodId].total += vendido;
        });
      }
    });
    const revenueData: RevenueChartData[] = Object.entries(revenueMap).map(([name, total]) => ({ name, total }));
    revenueData.sort((a, b) => a.name.localeCompare(b.name));
    const bestSellersData: BestSellersChartData[] = Object.values(productSalesMap).sort((a, b) => b.total - a.total);

    const summaryCards: SummaryCard[] = [
      {
        title: "Locações Ativas",
        icon: <CheckCircle2 size={24} className="text-muted-foreground" />,
        value: overview.summary.activeSales,
        valueClassName: "text-blue-600",
        href: "/sales?status=ATIVO",
        linkLabel: "Ver locações ativas",
      },
      {
        title: "Locações Atrasadas",
        icon: <CircleAlert className="text-muted-foreground" size={24} />,
        value: overview.summary.overdueSales,
        valueClassName: "text-red-600",
        href: "/sales?status=ATRASADO",
        linkLabel: "Ver locações atrasadas",
      },
      {
        title: "Receita (30 dias)",
        icon: <HandCoins className="text-muted-foreground" size={24} />,
        value: formatCurrency(overview.summary.totalRevenue),
        valueClassName: "text-2xl text-green-600",
        href: undefined,
        linkLabel: `${overview.summary.completedSales} locações concluídas`,
      },
      {
        title: "Estoque Baixo",
        icon: <Package2 className="text-muted-foreground" size={24} />,
        value: overview.lowStockProducts.length,
        valueClassName: "text-amber-600",
        href: "/inventory",
        linkLabel: "Ver inventário",
      },
    ];

    return (
      <div className="container mx-auto space-y-10 px-2 py-6 sm:px-4 sm:py-10 animate-fadein">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="w-fit transition-all hover:scale-105 hover:bg-blue-50/10">
            <Link href="/">← Voltar</Link>
          </Button>

          <div className="space-y-1 text-left sm:text-right">
            <h1 className="text-3xl font-extrabold drop-shadow-sm tracking-tight animate-slidein text-white dark:text-white text-black dark:!text-white">
              <span className="dark:text-white text-black">Dashboard <span className="text-blue-600">•</span> Sistema de Locação</span>
            </h1>
            <p className="text-base text-gray-300 dark:text-gray-300 text-gray-500 animate-fadein-slow">Resumo operacional.</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, idx) => (
            <Card
              key={card.title}
              className="shadow-lg border-0 bg-white dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-blue-900/60 hover:scale-[1.025] transition-transform duration-300 animate-fadein"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <CardHeader className="space-y-1 pb-3">
                <CardDescription className="uppercase tracking-wider text-xs text-blue-300/80 font-semibold animate-fadein-slow dark:text-blue-300/80 text-blue-700/80">
                  {card.title}
                </CardDescription>
                <CardTitle className={cn("text-4xl flex items-center gap-2 font-bold drop-shadow-sm dark:text-white text-black", card.valueClassName)}>
                  <span className="transition-transform duration-300 group-hover:scale-110">{card.icon}</span>
                  {card.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {card.caption ? (
                  <p className="text-xs animate-fadein-slow dark:text-gray-400 text-gray-600">{card.caption}</p>
                ) : null}

                {card.badge ? (
                  <Badge variant={card.badge.variant}>{card.badge.label}</Badge>
                ) : null}

                {card.href && card.linkLabel ? (
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0 dark:text-blue-400 text-blue-700 hover:text-blue-300 transition-colors animate-fadein"
                  >
                    <Link href={card.href}>
                      {card.linkLabel} →
                    </Link>
                  </Button>
                ) : (
                  <div className="inline-flex items-center text-[14px] font-medium leading-5 cursor-default select-none animate-fadein dark:text-blue-300 text-blue-700">
                    {card.linkLabel}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Locações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.recentRentals.length > 0 ? (
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Retirada</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.recentRentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell>
                          <Link
                            href={`/sales/${rental.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {rental.customer.name}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(rental.dataRetirada)}</TableCell>
                        <TableCell>
                          {renderStatusBadge(rental.status)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rental.totalAmount ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">
                  Nenhuma locação registrada nos últimos 30 dias.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white-400">Gráficos</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSection revenueData={revenueData} bestSellersData={bestSellersData} />
            </CardContent>
          </Card>
        </section>

        {overview.lowStockProducts.length > 0 ? (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Produtos com Estoque Baixo</CardTitle>
                <CardDescription>
                  Itens que precisam de reposição.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">
                        Estoque Atual
                      </TableHead>
                      <TableHead className="text-center">Unidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Link
                            href={`/inventory/${product.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <span
                            className={cn(
                              product.currentStock === 0
                                ? "text-red-600"
                                : "text-amber-600",
                            )}
                          >
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                          {product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.precoUnitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        ) : null}


      </div>
    );
  } catch {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="w-fit">
            <Link href="/">← Voltar</Link>
          </Button>

          <div className="space-y-1 text-left sm:text-right">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard - Sistema de Locação
            </h1>
            <p className="text-sm text-gray-500">Falha ao carregar os dados.</p>
          </div>
        </header>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Falha ao carregar dashboard
            </CardTitle>
            <CardDescription className="text-red-600">
              Ocorreu um erro ao carregar os dados. Tente novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              asChild
              className="border-red-200 text-red-700"
            >
              <Link href="/dashboard">Tentar novamente</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
