import React from "react";
import { formatEUR, CATEGORY_CONFIG } from "../budget/constants";

export default function SuscripcionesRecurrentes({ recurring }) {
  if (recurring.length === 0) return null;

  const groups = {};
  recurring.forEach(t => {
    const key = t.description.toLowerCase().substring(0, 25);
    if (!groups[key]) groups[key] = { description: t.description, category: t.category, total: 0, count: 0 };
    groups[key].total += t.amount || 0;
    groups[key].count += 1;
  });

  const entries = Object.values(groups).sort((a, b) => b.total - a.total);
  const totalMensual = entries.reduce((s, e) => s + (e.total / Math.max(e.count, 1)), 0);

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>🔄 Suscripciones y Recurrentes</h3>
      <div className="space-y-2.5 mb-4">
        {entries.slice(0, 10).map((e, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 truncate mr-4">
              <span>{CATEGORY_CONFIG[e.category]?.icon || "📦"}</span>
              <span className="truncate" style={{ color: "#94a3b8" }}>{e.description}</span>
            </div>
            <span className="font-medium whitespace-nowrap" style={{ color: "#f1f5f9" }}>
              {formatEUR(e.total / Math.max(e.count, 1))}/mes
            </span>
          </div>
        ))}
      </div>
      <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-sm" style={{ color: "#94a3b8" }}>
          Total: <span className="font-bold" style={{ color: "#f472b6" }}>{formatEUR(totalMensual)}/mes</span>
          <span className="ml-2">({formatEUR(totalMensual * 12)}/año)</span>
        </div>
      </div>
    </div>
  );
}