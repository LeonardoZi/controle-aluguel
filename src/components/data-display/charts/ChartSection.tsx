"use client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import React, { useState } from "react";
import { RevenueChart, RevenueChartData } from "./RevenueChart";
import { BestSellersChart, BestSellersChartData } from "./BestSellersChart";
import {
  CustomerRankingChart,
  CustomerRankingChartData,
} from "./CustomerRankingChart";
import { Select } from "@/components/ui/select";

interface ChartSectionProps {
  revenueData: RevenueChartData[];
  bestSellersData: BestSellersChartData[];
  customerRankingData: CustomerRankingChartData[];
}

const ChartSection = ({
  revenueData,
  bestSellersData,
  customerRankingData,
}: ChartSectionProps) => {
  const [graph, setGraph] = useState("receita");

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="mb-2">Análise gráfica</h3>
        <Select
          value={graph}
          onChange={(e) => setGraph(e.target.value)}
          className="w-[220px]"
        >
          <option value="receita">Receita</option>
          <option value="mais-vendidos">Mais vendidos</option>
          <option value="clientes-ranking">Clientes: mais compras</option>
        </Select>
      </CardHeader>
      <CardContent>
        {graph === "receita" && <RevenueChart data={revenueData} />}
        {graph === "mais-vendidos" && (
          <BestSellersChart data={bestSellersData} />
        )}
        {graph === "clientes-ranking" && (
          <CustomerRankingChart data={customerRankingData} />
        )}
      </CardContent>
    </Card>
  );
};

export default ChartSection;
