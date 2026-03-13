import React from "react";
import { formatEUR } from "../budget/constants";

export default function AlertasInteligentes({ totalIncome, totalExpenses, netCashflow, savingsRate, debtToIncome, transactions }) {
  const alerts = [];
  const sinClasificar = transactions.filter(t => t.category === "Sin Clasificar").length;
  const restaurantesPct = totalIncome > 0
    ? (transactions.filter(t => t.category === "Restaurantes").reduce((s, t) => s + (t.amount || 0), 0) / totalIncome * 100)
    : 0;
  const tieneTarjeta = transactions.some(t => t.category === "Pago Tarjeta Crédito");

  if (netCashflow < 0) alerts.push({ level: "red", text: `Gastáis más de lo que ingresáis: ${formatEUR(Math.abs(netCashflow))} de déficit` });
  if (debtToIncome > 40) alerts.push({ level: "red", text: `🔴 Ratio de endeudamiento crítico: ${debtToIncome.toFixed(1)}%` });
  else if (debtToIncome > 35) alerts.push({ level: "red", text: `Ratio de endeudamiento alto: ${debtToIncome.toFixed(1)}%` });
  if (savingsRate < 0) alerts.push({ level: "red", text: "No se detecta ahorro — mes en negativo" });

  if (restaurantesPct > 10) alerts.push({ level: "yellow", text: `Restaurantes suponen el ${restaurantesPct.toFixed(1)}% del presupuesto` });
  if (sinClasificar > 0) alerts.push({ level: "yellow", text: `${sinClasificar} movimientos sin clasificar — revísalos en Movimientos` });
  if (tieneTarjeta) alerts.push({ level: "yellow", text: "Pago de tarjeta de crédito detectado — sube el extracto para ver el desglose" });

  // Alertas de apuestas
  const gastoApuestas = transactions.filter(t => t.category === "Apuestas/Juego" && t.direction === "gasto").reduce((s, t) => s + (t.amount || 0), 0);
  const apuestasPct = totalIncome > 0 ? (gastoApuestas / totalIncome * 100) : 0;
  if (apuestasPct > 5) alerts.push({ level: "red", text: `🔴 Gasto elevado en apuestas: ${formatEUR(gastoApuestas)} este mes (${apuestasPct.toFixed(1)}% de ingresos)` });
  else if (apuestasPct > 2) alerts.push({ level: "yellow", text: `⚠️ Gasto en apuestas: ${formatEUR(gastoApuestas)} este mes (${apuestasPct.toFixed(1)}% de ingresos)` });

  // Info familia Bosnia/Croacia
  const gastoFamilia = transactions.filter(t => t.category === "Padres de Danijel" && t.direction === "gasto").reduce((s, t) => s + (t.amount || 0), 0);
  if (gastoFamilia > 0) alerts.push({ level: "green", text: `👨‍👩‍👦 Gastos familia Bosnia/Croacia: ${formatEUR(gastoFamilia)} este mes` });

  if (savingsRate >= 20) alerts.push({ level: "green", text: `Tasa de ahorro superior al 20%: ${savingsRate.toFixed(1)}%` });
  if (netCashflow > 0 && savingsRate >= 10) alerts.push({ level: "green", text: `Cashflow positivo: ${formatEUR(netCashflow)}` });
  if (sinClasificar === 0 && transactions.length > 0) alerts.push({ level: "green", text: "¡Todos los movimientos están clasificados!" });

  if (alerts.length === 0) return null;

  const styles = {
    red: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", text: "#f87171", icon: "🔴" },
    yellow: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", text: "#fbbf24", icon: "🟡" },
    green: { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", text: "#4ade80", icon: "🟢" },
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>🚨 Alertas Inteligentes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {alerts.map((a, i) => {
          const s = styles[a.level];
          return (
            <div key={i} className="rounded-lg p-3 text-sm"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
              {s.icon} {a.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}