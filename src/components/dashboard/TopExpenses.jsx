import React from "react";
import { formatEUR, CATEGORY_CONFIG } from "../budget/constants";

export default function TopExpenses({ expenses }) {
  const sorted = [...expenses]
    .filter(t => t.category !== "Internal Transfer")
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 10);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>Top 10 Biggest Expenses</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-2 py-1.5 text-xs font-medium" style={{ color: "#64748b" }}>#</th>
              <th className="text-left px-2 py-1.5 text-xs font-medium" style={{ color: "#64748b" }}>Date</th>
              <th className="text-left px-2 py-1.5 text-xs font-medium" style={{ color: "#64748b" }}>Description</th>
              <th className="text-left px-2 py-1.5 text-xs font-medium" style={{ color: "#64748b" }}>Category</th>
              <th className="text-right px-2 py-1.5 text-xs font-medium" style={{ color: "#64748b" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-2 py-2" style={{ color: "#64748b" }}>{i + 1}</td>
                <td className="px-2 py-2 whitespace-nowrap" style={{ color: "#94a3b8" }}>{t.date}</td>
                <td className="px-2 py-2 max-w-[180px] truncate" style={{ color: "#f1f5f9" }}>{t.description}</td>
                <td className="px-2 py-2">
                  <span className="text-xs" style={{ color: CATEGORY_CONFIG[t.category]?.color || "#94a3b8" }}>
                    {CATEGORY_CONFIG[t.category]?.icon} {t.category}
                  </span>
                </td>
                <td className="px-2 py-2 text-right font-medium" style={{ color: "#f87171" }}>{formatEUR(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}