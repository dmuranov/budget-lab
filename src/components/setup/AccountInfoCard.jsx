import React from "react";
import { formatEUR } from "../budget/constants";
import { detectSalaries } from "../budget/classifier";

export default function AccountInfoCard({ metadata, transactions }) {
  const incomes = transactions.filter(t => t.direction === "ingreso");
  const expenses = transactions.filter(t => t.direction === "gasto");
  const salaries = detectSalaries(transactions);

  const accountLast4 = metadata?.account ? metadata.account.replace(/\s/g, "").slice(-4) : null;
  const holders = metadata?.holders || [];

  return (
    <div className="mb-4 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
      style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>

      {accountLast4 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
          <span>👥</span>
          <span>Cuenta compartida: <span className="font-semibold" style={{ color: "#f1f5f9" }}>****{accountLast4}</span></span>
        </div>
      )}

      {holders.length > 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
          <span>📋</span>
          <span>Titulares: <span className="font-semibold" style={{ color: "#f1f5f9" }}>{holders.join(" y ")}</span></span>
        </div>
      )}

      {metadata?.period && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
          <span>📅</span>
          <span>Período: <span className="font-semibold" style={{ color: "#f1f5f9" }}>{metadata.period}</span></span>
        </div>
      )}

      {salaries.length > 0 ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
          <span>💵</span>
          <span>
            Nóminas detectadas:{" "}
            <span className="font-semibold" style={{ color: "#4ade80" }}>
              {salaries.map(s => formatEUR(s.amount)).join(" + ")}
              {salaries.length > 1 && <> = {formatEUR(salaries.reduce((a, s) => a + s.amount, 0))}/mes</>}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#fbbf24" }}>
          <span>💵</span>
          <span>No se han detectado nóminas en este extracto</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
        <span>📊</span>
        <span>
          Total movimientos:{" "}
          <span className="font-semibold" style={{ color: "#f1f5f9" }}>
            {transactions.length} ({incomes.length} ingresos · {expenses.length} gastos)
          </span>
        </span>
      </div>
    </div>
  );
}