import React from "react";
import { formatEUR, formatPct } from "../budget/constants";

export default function Regla502030({ necesidadesTotal, deseosTotal, totalIncome, netCashflow }) {
  const ahorroAmt = netCashflow;
  const necesidadesPct = totalIncome > 0 ? (necesidadesTotal / totalIncome) * 100 : 0;
  const deseosPct = totalIncome > 0 ? (deseosTotal / totalIncome) * 100 : 0;
  const ahorroPct = totalIncome > 0 ? (ahorroAmt / totalIncome) * 100 : 0;

  const bars = [
    { label: "Necesidades", target: "≤ 50%", pct: necesidadesPct, amount: necesidadesTotal, ok: necesidadesPct <= 50 },
    { label: "Deseos", target: "≤ 30%", pct: deseosPct, amount: deseosTotal, ok: deseosPct <= 30 },
    { label: "Ahorro", target: "≥ 20%", pct: ahorroPct, amount: ahorroAmt, ok: ahorroPct >= 20 },
  ];

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>⚖️ Regla 50 / 30 / 20</h3>
      <div className="space-y-5">
        {bars.map(bar => {
          const color = bar.ok ? "#4ade80" : "#f87171";
          return (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{bar.label}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{bar.target}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color }}>{formatPct(bar.pct)}</span>
                  <span className="text-xs ml-2" style={{ color: "#64748b" }}>{formatEUR(bar.amount)}</span>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#1a2030" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(Math.abs(bar.pct), 100)}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}