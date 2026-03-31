"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

export interface CustomerRankingChartData {
  name: string;
  total: number;
}

export function CustomerRankingChart({ data }: { data: CustomerRankingChartData[] }) {
  return (
    <div style={{ minHeight: 350, minWidth: 300, height: 350, width: '100%' }} className="pt-4">
      <ResponsiveContainer width="100%" height={350} minWidth={300} minHeight={350}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f1f5f9" }}
            itemStyle={{ color: "#3b82f6" }}
            formatter={(value) => [`${value ?? 0} compras`, "Compras"]}
          />
          <Bar dataKey="total" fill="#10b981">
            <LabelList dataKey="total" position="top" fill="#f1f5f9" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
