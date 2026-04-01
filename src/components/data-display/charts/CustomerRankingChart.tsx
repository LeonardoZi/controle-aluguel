"use client";
import { SimpleBarChart, type SimpleChartDatum } from "./SimpleChartPrimitives";

export type CustomerRankingChartData = SimpleChartDatum;

export function CustomerRankingChart({
  data,
}: {
  data: CustomerRankingChartData[];
}) {
  return (
    <SimpleBarChart
      data={data}
      barColor="#10b981"
      valueFormatter={(value) => `${value} compras`}
      emptyMessage="Nenhum cliente concluído no período selecionado."
    />
  );
}
