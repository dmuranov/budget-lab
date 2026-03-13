import React from "react";
import { formatEUR, CATEGORY_CONFIG, GASTOS_FIJOS_CATEGORIAS } from "../budget/constants";

export default function FixedObligations({ expenses, totalIncome }) {
  const fixed = {};
  expenses.forEach(t => {
    if (FIXED_CATEGORIES.includes(t.category)) {
      fixed[t.category] = (fixed[t.category] || 0) + (t.amount || 0);
    }
  });

  const entries = Object.entries(fixed).sort((a, b) => b[1] - a[1]);
  const totalFixed = entries.reduce((s, [, v]) => s + v, 0);
  const remaining = totalIncome - totalFixed;
  const fixedPct = totalIncome > 0 ? (totalFixed / totalIncome * 100) : 0;

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Fixed Monthly Obligations</h3>
        {fixedPct > 50 && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
            ⚠️ {fixedPct.toFixed(0)}% of income
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {entries.map(([cat, amount]) => (
          <div key={cat} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{CATEGORY_CONFIG[cat]?.icon}</span>
              <span className="text-sm" style={{ color: "#94a3b8" }}>{cat}</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "#f87171" }}>{formatEUR(amount)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: "#94a3b8" }}>Total Fixed</span>
          <span className="font-bold" style={{ color: "#f87171" }}>{formatEUR(totalFixed)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span style={{ color: "#94a3b8" }}>Remaining (Spendable)</span>
          <span className="font-bold" style={{ color: remaining >= 0 ? "#4ade80" : "#f87171" }}>{formatEUR(remaining)}</span>
        </div>
      </div>
    </div>
  );
}