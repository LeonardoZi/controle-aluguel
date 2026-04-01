"use client";
import { SimpleBarChart, type SimpleChartDatum } from "./SimpleChartPrimitives";

export type BestSellersChartData = SimpleChartDatum;

export function BestSellersChart({ data }: { data: BestSellersChartData[] }) {
  return (
    <SimpleBarChart
      data={data}
      barColor="#3b82f6"
      valueFormatter={(value) => `${value} un`}
      emptyMessage="Nenhum produto concluído no período selecionado."
    />
  );
}
