import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatEUR, formatPct } from "../budget/constants";
import { formatMonthES } from "../budget/BudgetSelector";

export default function ResumenMultiMes({ budgets }) {
  const { data: allTxns = [], isLoading } = useQuery({
    queryKey: ["all-transactions"],
    queryFn: () => base44.entities.Transaction.list("date", 10000),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#1a2030", borderTopColor: "#4ade80" }} /></div>;
  }

  const rows = budgets.map(b => {
    const txs = allTxns.filter(t => t.budget_id === b.id && t.date && t.date.startsWith(b.month));
    const income = txs.filter(t => t.direction === "ingreso" && t.category !== "Traspaso Interno").reduce((s, t) => s + (t.amount || 0), 0);
    const expenses = txs.filter(t => t.direction === "gasto" && t.category !== "Traspaso Interno").reduce((s, t) => s + (t.amount || 0), 0);
    const net = income - expenses;
    const savings = income > 0 ? (net / income) * 100 : 0;
    return { month: b.month, income, expenses, net, savings };
  });

  const totIncome = rows.reduce((s, r) => s + r.income, 0);
  const totExpenses = rows.reduce((s, r) => s + r.expenses, 0);
  const totNet = totIncome - totExpenses;
  const totSavings = totIncome > 0 ? (totNet / totIncome) * 100 : 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>📅 Comparativa Multi-Mes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#1a2030" }}>
              {["Mes", "Ingresos", "Gastos", "Neto", "Ahorro %"].map(h => (
                <th key={h} className="text-right px-5 py-3 text-xs font-medium first:text-left" style={{ color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.month} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 font-medium" style={{ color: "#f1f5f9" }}>{formatMonthES(r.month)}</td>
                <td className="px-5 py-3 text-right" style={{ color: "#4ade80" }}>{formatEUR(r.income)}</td>
                <td className="px-5 py-3 text-right" style={{ color: "#f87171" }}>{formatEUR(r.expenses)}</td>
                <td className="px-5 py-3 text-right font-semibold" style={{ color: r.net >= 0 ? "#4ade80" : "#f87171" }}>
                  {r.net >= 0 ? "+" : ""}{formatEUR(r.net)}
                </td>
                <td className="px-5 py-3 text-right" style={{ color: r.savings >= 20 ? "#4ade80" : r.savings >= 10 ? "#fbbf24" : "#f87171" }}>
                  {formatPct(r.savings)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a2030", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <td className="px-5 py-3 font-bold" style={{ color: "#f1f5f9" }}>TOTAL</td>
              <td className="px-5 py-3 text-right font-bold" style={{ color: "#4ade80" }}>{formatEUR(totIncome)}</td>
              <td className="px-5 py-3 text-right font-bold" style={{ color: "#f87171" }}>{formatEUR(totExpenses)}</td>
              <td className="px-5 py-3 text-right font-bold" style={{ color: totNet >= 0 ? "#4ade80" : "#f87171" }}>
                {totNet >= 0 ? "+" : ""}{formatEUR(totNet)}
              </td>
              <td className="px-5 py-3 text-right font-bold" style={{ color: totSavings >= 20 ? "#4ade80" : "#fbbf24" }}>
                {formatPct(totSavings)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}