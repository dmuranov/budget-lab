import React from "react";
import { formatEUR } from "../budget/constants";

export default function IncomeBreakdown({ incomeByCategory, budget }) {
  const entries = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const salaryP1 = incomeByCategory["Salary"] || 0;
  const declaredTotal = (budget?.salary_person1 || 0) + (budget?.salary_person2 || 0);

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>Income Breakdown</h3>
      <div className="space-y-3">
        {entries.map(([cat, amount]) => (
          <div key={cat} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#94a3b8" }}>{cat}</span>
            <span className="text-sm font-medium" style={{ color: "#4ade80" }}>{formatEUR(amount)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm" style={{ color: "#64748b" }}>No income detected</p>
        )}
      </div>

      {declaredTotal > 0 && salaryP1 > 0 && Math.abs(declaredTotal - salaryP1) > 50 && (
        <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>
          ⚠️ Declared salary ({formatEUR(declaredTotal)}) differs from detected ({formatEUR(salaryP1)})
        </div>
      )}
    </div>
  );
}