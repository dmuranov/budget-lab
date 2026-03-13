import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatEUR, CATEGORY_CONFIG } from "../budget/constants";

export default function GraficoGastos({ expenseByCategory }) {
  const entries = Object.entries(expenseByCategory)
    .filter(([cat]) => cat !== "Traspaso Interno")
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const data = entries.map(([cat, amount]) => ({
    name: cat,
    value: amount,
    color: CATEGORY_CONFIG[cat]?.color || "#64748b",
    icon: CATEGORY_CONFIG[cat]?.icon || "📦",
    pct: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg p-3 text-sm" style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ color: "#f1f5f9" }}>{d.icon} {d.name}</div>
        <div className="font-bold" style={{ color: d.color }}>{formatEUR(d.value)} ({d.pct}%)</div>
      </div>
    );
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>🍩 Gastos por Categoría</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" stroke="none" paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {data.slice(0, 12).map(d => (
            <div key={d.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span style={{ color: "#94a3b8" }}>{d.icon} {d.name}</span>
                <span className="font-medium" style={{ color: "#f1f5f9" }}>{formatEUR(d.value)}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#1a2030" }}>
                <div className="h-full rounded-full" style={{
                  width: `${(d.value / (data[0]?.value || 1)) * 100}%`, background: d.color
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}