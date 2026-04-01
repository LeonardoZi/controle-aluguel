"use client";

import {
  SimpleAreaChart,
  type SimpleChartDatum,
} from "./SimpleChartPrimitives";

export type RevenueChartData = SimpleChartDatum;

export function RevenueChart({ data }: { data: RevenueChartData[] }) {
  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatAxisValue = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  return (
    <SimpleAreaChart
      data={data}
      accentColor="#3b82f6"
      valueFormatter={formatCurrency}
      axisFormatter={formatAxisValue}
      emptyMessage="Nenhuma receita concluída no período selecionado."
    />
  );
}
