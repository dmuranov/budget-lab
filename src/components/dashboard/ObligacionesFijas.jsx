import React from "react";
import { formatEUR, CATEGORY_CONFIG, GASTOS_FIJOS_CATEGORIAS } from "../budget/constants";

export default function ObligacionesFijas({ expenses, totalIncome }) {
  const byCategory = {};
  expenses.forEach(t => {
    if (t.is_fixed || GASTOS_FIJOS_CATEGORIAS.includes(t.category)) {
      byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0);
    }
  });

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const pct = totalIncome > 0 ? (total / totalIncome * 100) : 0;
  const disponible = totalIncome - total;

  const alertColor = pct > 60 ? "#f87171" : pct > 50 ? "#fbbf24" : "#4ade80";

  const emojis = {
    "Hipoteca": "🏠", "Vivienda": "🏠", "Préstamo": "🏦", "Pago Tarjeta Crédito": "💳",
    "Seguros": "🛡️", "Suministros": "⚡", "Educación Hija": "👶", "Impuestos/Tasas": "📋",
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>🔒 Obligaciones Fijas Mensuales</h3>
        {pct > 50 && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${alertColor}20`, color: alertColor }}>
            {pct > 60 ? "⚠️ Carga muy alta" : "⚠️ Carga elevada"}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {entries.map(([cat, amount]) => (
          <div key={cat} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{emojis[cat] || CATEGORY_CONFIG[cat]?.icon || "📌"}</span>
              <span className="text-sm" style={{ color: "#94a3b8" }}>{cat}</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "#f87171" }}>{formatEUR(amount)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm" style={{ color: "#64748b" }}>No se detectaron gastos fijos</p>
        )}
      </div>

      <div className="mt-4 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: "#94a3b8" }}>TOTAL FIJO</span>
          <span className="font-bold" style={{ color: "#f87171" }}>{formatEUR(total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "#94a3b8" }}>% de ingresos</span>
          <span className="font-bold" style={{ color: alertColor }}>{pct.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "#94a3b8" }}>💚 Disponible tras fijos</span>
          <span className="font-bold" style={{ color: disponible >= 0 ? "#4ade80" : "#f87171" }}>{formatEUR(disponible)}</span>
        </div>
      </div>
    </div>
  );
}