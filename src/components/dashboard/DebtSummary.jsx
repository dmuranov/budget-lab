import React from "react";
import { formatEUR, formatPct, CATEGORY_CONFIG } from "../budget/constants";

export default function DebtSummary({ debtPayments, totalDebt, debtToIncome }) {
  if (debtPayments.length === 0) return null;

  // Group by category
  const byCategory = {};
  debtPayments.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0);
  });

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>Debt Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Monthly Debt Payments</div>
          <div className="text-lg font-bold" style={{ color: "#f87171" }}>{formatEUR(totalDebt)}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Debt-to-Income Ratio</div>
          <div className="text-lg font-bold" style={{ color: debtToIncome > 35 ? "#f87171" : debtToIncome > 20 ? "#fbbf24" : "#4ade80" }}>
            {formatPct(debtToIncome)}
          </div>
          {debtToIncome > 35 && <div className="text-xs" style={{ color: "#f87171" }}>⚠️ High debt load</div>}
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(byCategory).map(([cat, amount]) => (
          <div key={cat} className="flex items-center justify-between text-sm">
            <span style={{ color: "#94a3b8" }}>{CATEGORY_CONFIG[cat]?.icon} {cat}</span>
            <span className="font-medium" style={{ color: "#f87171" }}>{formatEUR(amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}