import React from "react";
import { formatEUR, formatPct } from "../budget/constants";

export default function RuleProgress({ needsTotal, wantsTotal, totalIncome, netCashflow }) {
  const savingsAmt = netCashflow;
  const needsPct = totalIncome > 0 ? (needsTotal / totalIncome) * 100 : 0;
  const wantsPct = totalIncome > 0 ? (wantsTotal / totalIncome) * 100 : 0;
  const savingsPct = totalIncome > 0 ? (savingsAmt / totalIncome) * 100 : 0;

  const bars = [
    { label: "Needs", target: "≤ 50%", pct: needsPct, amount: needsTotal, color: needsPct <= 50 ? "#4ade80" : "#f87171" },
    { label: "Wants", target: "≤ 30%", pct: wantsPct, amount: wantsTotal, color: wantsPct <= 30 ? "#4ade80" : "#f87171" },
    { label: "Savings", target: "≥ 20%", pct: savingsPct, amount: savingsAmt, color: savingsPct >= 20 ? "#4ade80" : "#f87171" },
  ];

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>50 / 30 / 20 Rule</h3>
      <div className="space-y-5">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{bar.label}</span>
                <span className="text-xs" style={{ color: "#64748b" }}>{bar.target}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color: bar.color }}>{formatPct(bar.pct)}</span>
                <span className="text-xs ml-2" style={{ color: "#64748b" }}>{formatEUR(bar.amount)}</span>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: "#1a2030" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(bar.pct, 100)}%`, background: bar.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}