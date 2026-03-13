import React from "react";
import { formatEUR } from "../budget/constants";

export default function SmartAlerts({ totalIncome, totalExpenses, netCashflow, savingsRate, debtToIncome, transactions }) {
  const alerts = [];
  const uncategorized = transactions.filter(t => t.category === "Uncategorized").length;
  const diningPct = totalIncome > 0 ? ((transactions.filter(t => t.category === "Dining Out").reduce((s, t) => s + (t.amount || 0), 0)) / totalIncome * 100) : 0;
  const hasCreditCardPayment = transactions.some(t => t.category === "Credit Card");

  // Red alerts
  if (netCashflow < 0) {
    alerts.push({ level: "red", icon: "🔴", text: `Spending exceeds income by ${formatEUR(Math.abs(netCashflow))}` });
  }
  if (debtToIncome > 35) {
    alerts.push({ level: "red", icon: "🔴", text: `Debt ratio above 35% (${debtToIncome.toFixed(1)}%)` });
  }

  // Yellow alerts
  if (diningPct > 10) {
    alerts.push({ level: "yellow", icon: "🟡", text: `Dining out is ${diningPct.toFixed(1)}% of income` });
  }
  if (uncategorized > 0) {
    alerts.push({ level: "yellow", icon: "🟡", text: `${uncategorized} uncategorized transactions need review` });
  }
  if (hasCreditCardPayment) {
    alerts.push({ level: "yellow", icon: "🟡", text: "Credit card payment detected — upload card statement for full breakdown" });
  }

  // Green alerts
  if (savingsRate >= 20) {
    alerts.push({ level: "green", icon: "🟢", text: `Savings rate above 20% (${savingsRate.toFixed(1)}%)` });
  }
  if (netCashflow > 0 && savingsRate >= 10) {
    alerts.push({ level: "green", icon: "🟢", text: `Positive cashflow of ${formatEUR(netCashflow)}` });
  }

  if (alerts.length === 0) return null;

  const colors = {
    red: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", text: "#f87171" },
    yellow: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", text: "#fbbf24" },
    green: { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", text: "#4ade80" },
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>Smart Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {alerts.map((a, i) => (
          <div key={i} className="rounded-lg p-3 text-sm"
            style={{ background: colors[a.level].bg, border: `1px solid ${colors[a.level].border}`, color: colors[a.level].text }}>
            {a.icon} {a.text}
          </div>
        ))}
      </div>
    </div>
  );
}