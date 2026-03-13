import React from "react";
import { formatEUR, formatPct, CATEGORY_CONFIG } from "../budget/constants";

export default function SituacionDeuda({ debtPayments, totalDebt, debtToIncome }) {
  if (debtPayments.length === 0) return null;

  const byCategory = {};
  debtPayments.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0); });

  const color = debtToIncome > 40 ? "#f87171" : debtToIncome > 35 ? "#fbbf24" : "#4ade80";

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>💳 Situación de Deuda</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Pagos mensuales de deuda</div>
          <div className="text-lg font-bold" style={{ color: "#f87171" }}>{formatEUR(totalDebt)}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Ratio deuda/ingresos</div>
          <div className="text-lg font-bold" style={{ color }}>
            {formatPct(debtToIncome)}
          </div>
          {debtToIncome > 40 && <div className="text-xs" style={{ color: "#f87171" }}>🔴 Ratio crítico</div>}
          {debtToIncome > 35 && debtToIncome <= 40 && <div className="text-xs" style={{ color: "#fbbf24" }}>⚠️ Ratio alto</div>}
        </div>
      </div>
      {Object.entries(byCategory).map(([cat, amount]) => (
        <div key={cat} className="flex items-center justify-between text-sm py-1.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ color: "#94a3b8" }}>{CATEGORY_CONFIG[cat]?.icon} {cat}</span>
          <span className="font-medium" style={{ color: "#f87171" }}>{formatEUR(amount)}</span>
        </div>
      ))}
    </div>
  );
}