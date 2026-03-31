"use client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import React, { useState } from "react";
import { RevenueChart, RevenueChartData } from "./RevenueChart";
import { BestSellersChart, BestSellersChartData } from "./BestSellersChart";
import { Select } from "@/components/ui/select";


interface ChartSectionProps {
    revenueData: RevenueChartData[];
    bestSellersData: BestSellersChartData[];
}

const ChartSection = ({ revenueData, bestSellersData }: ChartSectionProps) => {
    const [graph, setGraph] = useState("receita");

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <h3 className="mb-2">Análise gráfica</h3>
                <Select
                    value={graph}
                    onChange={(e) => setGraph(e.target.value)}
                    className="w-[180px]"
                >
                    <option value="receita">Receita</option>
                    <option value="mais-vendidos">Mais vendidos</option>
                </Select>
            </CardHeader>
            <CardContent>
                {graph === "receita" && <RevenueChart data={revenueData} />}
                {graph === "mais-vendidos" && <BestSellersChart data={bestSellersData} />}
            </CardContent>
        </Card>
    );
};

export default ChartSection

