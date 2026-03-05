import Link from "next/link";
import { type ReactNode } from "react";
import { getDashboardOverview } from "@/server/dashboard/queries";
import type { SaleStatus } from "@/server/contracts/v1/sales";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface SummaryCard {
  title: string;
  value: string | number;
  valueClassName: string;
  href?: string;
  linkLabel?: string;
  caption?: string;
  badge?: {
    label: string;
    variant: BadgeVariant;
  };
}

interface QuickAction {
  href: string;
  label: string;
  icon: ReactNode;
  iconClassName: string;
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

const quickActions: QuickAction[] = [
  {
    href: "/sales/new",
    label: "Nova Locação",
    iconClassName: "bg-green-100 text-green-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    ),
  },
  {
    href: "/inventory/new",
    label: "Novo Produto",
    iconClassName: "bg-blue-100 text-blue-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: "/customers/new",
    label: "Novo Cliente",
    iconClassName: "bg-amber-100 text-amber-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6" />
        <path d="M23 11h-6" />
      </svg>
    ),
  },
  {
    href: "/sales",
    label: "Ver Locações",
    iconClassName: "bg-purple-100 text-purple-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

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

    const summaryCards: SummaryCard[] = [
      {
        title: "Locações Ativas",
        value: overview.summary.activeSales,
        valueClassName: "text-blue-600",
        href: "/sales?status=ATIVO",
        linkLabel: "Ver locações ativas",
      },
      {
        title: "Locações Atrasadas",
        value: overview.summary.overdueSales,
        valueClassName: "text-red-600",
        href: "/sales?status=ATRASADO",
        linkLabel: "Ver locações atrasadas",
      },
      {
        title: "Receita (30 dias)",
        value: formatCurrency(overview.summary.totalRevenue),
        valueClassName: "text-2xl text-green-600",
        caption: `${overview.summary.completedSales} locações concluídas`,
      },
      {
        title: "Estoque Baixo",
        value: overview.lowStockProducts.length,
        valueClassName: "text-amber-600",
        href: "/inventory",
        linkLabel: "Ver inventário",
        badge: {
          label: overview.lowStockProducts.length > 0 ? "Atenção" : "OK",
          variant: overview.lowStockProducts.length > 0 ? "warning" : "success",
        },
      },
    ];

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
            <p className="text-sm text-gray-500">
              Resumo operacional dos últimos 30 dias.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="space-y-1 pb-3">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className={cn("text-3xl", card.valueClassName)}>
                  {card.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {card.caption ? (
                  <p className="text-xs text-gray-500">{card.caption}</p>
                ) : null}

                {card.badge ? (
                  <Badge variant={card.badge.variant}>{card.badge.label}</Badge>
                ) : null}

                {card.href && card.linkLabel ? (
                  <Button variant="link" asChild className="h-auto p-0 text-blue-600">
                    <Link href={card.href}>{card.linkLabel} →</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Locações Recentes</CardTitle>
              <CardDescription>Últimos registros dos últimos 30 dias.</CardDescription>
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
                        <TableCell>{renderStatusBadge(rental.status)}</TableCell>
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
              <CardTitle className="text-red-600">Locações Atrasadas</CardTitle>
              <CardDescription>Demandam retorno imediato.</CardDescription>
            </CardHeader>
            <CardContent>
              {overview.overdueRentals.length > 0 ? (
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Devolução</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.overdueRentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell>
                          <Link
                            href={`/sales/${rental.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {rental.customer.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          {formatDate(rental.dataDevolucaoPrevista)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rental.totalAmount ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-4 text-center text-sm text-green-600">
                  Nenhuma locação atrasada no momento.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {overview.lowStockProducts.length > 0 ? (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Produtos com Estoque Baixo</CardTitle>
                <CardDescription>Itens que precisam de reposição.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Estoque Atual</TableHead>
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

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Atalhos para as operações mais usadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.href}
                    variant="outline"
                    asChild
                    className="h-auto flex-col gap-2 rounded-lg border-gray-200 p-4 text-center hover:bg-gray-50"
                  >
                    <Link href={action.href}>
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          action.iconClassName,
                        )}
                      >
                        {action.icon}
                      </span>
                      <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
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
            <CardTitle className="text-red-700">Falha ao carregar dashboard</CardTitle>
            <CardDescription className="text-red-600">
              Ocorreu um erro ao carregar os dados. Tente novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="border-red-200 text-red-700">
              <Link href="/dashboard">Tentar novamente</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
