"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";



export interface RevenueChartData {
    name: string;
    total: number;
}

export function RevenueChart({ data }: { data: RevenueChartData[] }) {
    return (
        <div style={{ minHeight: 350, minWidth: 300, height: 350, width: '100%' }} className="pt-4">
            <ResponsiveContainer width="100%" height={350} minWidth={300} minHeight={350}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#1e293b"
                    />

                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={(value) => `R$ ${value}`}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                            color: "#f1f5f9",
                        }}
                        itemStyle={{ color: "#3b82f6" }}
                        formatter={(value, name) => [
                            `R$ ${Number(value ?? 0).toFixed(2)}`,
                            name ?? "Receita"
                        ]}
                    />

                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}