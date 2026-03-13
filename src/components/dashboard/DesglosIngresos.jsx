import React from "react";
import { formatEUR } from "../budget/constants";

export default function DesglosIngresos({ incomeByCategory, budget }) {
  const entries = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const nomina1 = budget?.salary_person1 || 0;
  const nomina2 = budget?.salary_person2 || 0;
  const nominaDeclarada = nomina1 + nomina2;
  const nominaDetectada = incomeByCategory["Nómina"] || 0;
  const diferencia = nominaDeclarada > 0 && nominaDetectada > 0 && Math.abs(nominaDeclarada - nominaDetectada) > 50;

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>💵 De dónde viene el dinero</h3>

      {nominaDeclarada > 0 && (
        <div className="mb-4 space-y-1">
          <div className="flex justify-between text-xs" style={{ color: "#64748b" }}>
            <span>Declarada {budget?.name_person1 || "Titular 1"}:</span>
            <span>{formatEUR(nomina1)}</span>
          </div>
          {nomina2 > 0 && (
            <div className="flex justify-between text-xs" style={{ color: "#64748b" }}>
              <span>Declarada {budget?.name_person2 || "Titular 2"}:</span>
              <span>{formatEUR(nomina2)}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {entries.map(([cat, amount]) => (
          <div key={cat} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#94a3b8" }}>{cat}</span>
            <span className="text-sm font-medium" style={{ color: "#4ade80" }}>{formatEUR(amount)}</span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>No se detectaron ingresos</p>}
      </div>

      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex justify-between text-sm font-bold">
          <span style={{ color: "#94a3b8" }}>Total detectado</span>
          <span style={{ color: "#4ade80" }}>{formatEUR(total)}</span>
        </div>
      </div>

      {diferencia && (
        <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>
          ⚠️ Nómina declarada ({formatEUR(nominaDeclarada)}) ≠ detectada ({formatEUR(nominaDetectada)}). Puede deberse a IRPF variable, pagas extra o retenciones.
        </div>
      )}
    </div>
  );
}