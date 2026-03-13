import React from "react";
import { detectSalaryPattern } from "../budget/classifier";

export default function BannerNomina({ allTransactions, currentMonthTransactions, budgetMonth }) {
  if (!budgetMonth) return null;

  const pattern = detectSalaryPattern(allTransactions);
  if (!pattern) return null;

  const nominasEsteMes = currentMonthTransactions.filter(t =>
    t.direction === "ingreso" && t.category === "Nómina"
  );
  if (nominasEsteMes.length > 0) return null;

  const today = new Date();
  const [year, month] = budgetMonth.split("-").map(Number);
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;

  if (!isCurrentMonth) {
    return (
      <div className="rounded-lg p-3 text-sm flex items-center gap-2"
        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
        <span>⚠️</span>
        <span>No se detectaron nóminas en este mes. Los ratios de gasto pueden no ser representativos.</span>
      </div>
    );
  }

  const currentDay = today.getDate();

  if (currentDay < pattern.earliestDay) {
    const diasRestantes = pattern.earliestDay - currentDay;
    const diasTexto = pattern.patterns.length === 1
      ? `día ~${pattern.patterns[0].avgDay}`
      : pattern.patterns.map(p => `~${p.avgDay}`).join(" y ");

    return (
      <div className="rounded-lg p-3 text-sm flex items-start gap-2"
        style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
        <span className="mt-0.5">ℹ️</span>
        <div>
          <span>Las nóminas suelen llegar el {diasTexto} del mes (basado en {pattern.totalNominas} cobros anteriores). </span>
          <span style={{ color: "#94a3b8" }}>Faltan ~{diasRestantes} días. Los ratios y alertas se estabilizarán cuando se registren los ingresos.</span>
        </div>
      </div>
    );
  }

  if (currentDay > pattern.latestDay + 3) {
    return (
      <div className="rounded-lg p-3 text-sm flex items-center gap-2"
        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
        <span>⚠️</span>
        <span>Las nóminas suelen llegar antes del día {pattern.latestDay}. Aún no se han detectado este mes. ¿Falta importar el extracto más reciente?</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3 text-sm flex items-center gap-2"
      style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)", color: "#94a3b8" }}>
      <span>💵</span>
      <span>Ventana de cobro de nóminas (días {pattern.earliestDay}-{pattern.latestDay}). Los ingresos pueden aparecer en cualquier momento.</span>
    </div>
  );
}