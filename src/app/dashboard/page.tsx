"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { getLowStockProducts } from "@/actions/products";
import { getSales, getSalesSummary, updateOverdueSales } from "@/actions/sales";
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

interface Product {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  precoUnitario: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface RentalItem {
  id: string;
  produtoId: string;
  quantidadeRetirada: number;
  quantidadeDevolvida: number | null;
  precoUnitarioNoMomento: number;
  produto: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Rental {
  id: string;
  customerId: string;
  userId: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  status: "ATIVO" | "ATRASADO" | "CONCLUIDO" | "CANCELADO";
  totalAmount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  user: {
    id: string;
    name: string;
    email: string;
  };
  itens: RentalItem[];
}

interface DashboardSummary {
  totalSales: number;
  activeSales: number;
  overdueSales: number;
  completedSales: number;
  totalRevenue: number;
  pendingReturns: number;
}

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
  Rental["status"],
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

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentRentals, setRecentRentals] = useState<Rental[]>([]);
  const [overdueRentals, setOverdueRentals] = useState<Rental[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      await updateOverdueSales();

      const summaryResult = await getSalesSummary({ startDate, endDate });
      if (summaryResult.error) {
        setError(summaryResult.error);
      } else if (summaryResult.summary) {
        setSummary(summaryResult.summary);
      }

      const recentResult = await getSales({ startDate, endDate });
      if (recentResult.sales) {
        setRecentRentals(recentResult.sales as Rental[]);
      }

      const overdueResult = await getSales({ status: "ATRASADO" });
      if (overdueResult.sales) {
        setOverdueRentals(overdueResult.sales as Rental[]);
      }

      const productsResult = await getLowStockProducts();
      if (productsResult.products) {
        setLowStockProducts(productsResult.products as Product[]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError("Ocorreu um erro ao carregar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateValue: string | Date): string => {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const summaryCards: SummaryCard[] = [
    {
      title: "Locações Ativas",
      value: summary?.activeSales ?? 0,
      valueClassName: "text-blue-600",
      href: "/sales?status=ATIVO",
      linkLabel: "Ver locações ativas",
    },
    {
      title: "Locações Atrasadas",
      value: summary?.overdueSales ?? 0,
      valueClassName: "text-red-600",
      href: "/sales?status=ATRASADO",
      linkLabel: "Ver locações atrasadas",
    },
    {
      title: "Receita (30 dias)",
      value: formatCurrency(summary?.totalRevenue ?? 0),
      valueClassName: "text-2xl text-green-600",
      caption: `${summary?.completedSales ?? 0} locações concluídas`,
    },
    {
      title: "Estoque Baixo",
      value: lowStockProducts.length,
      valueClassName: "text-amber-600",
      href: "/inventory",
      linkLabel: "Ver inventário",
      badge: {
        label: lowStockProducts.length > 0 ? "Atenção" : "OK",
        variant: lowStockProducts.length > 0 ? "warning" : "success",
      },
    },
  ];

  const renderStatusBadge = (status: Rental["status"]) => {
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
          <p className="text-sm text-gray-500">Resumo operacional dos últimos 30 dias.</p>
        </div>
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Carregando dados do dashboard...
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Falha ao carregar dashboard</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={fetchDashboardData}
              className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-700"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                {recentRentals.length > 0 ? (
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
                      {recentRentals.slice(0, 5).map((rental) => (
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
                {overdueRentals.length > 0 ? (
                  <Table className="min-w-[520px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Devolução</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueRentals.slice(0, 5).map((rental) => (
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

          {lowStockProducts.length > 0 ? (
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
                      {lowStockProducts.slice(0, 5).map((product) => (
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
        </>
      )}
    </div>
  );
}
