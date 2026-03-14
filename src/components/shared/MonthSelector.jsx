import React from "react";
import { formatMonthLabel } from "../budget/useMonthFilter";

export default function MonthSelector({ selectedMonth, setSelectedMonth, availableMonths }) {
  return (
    <select
      value={selectedMonth}
      onChange={e => setSelectedMonth(e.target.value)}
      className="h-9 rounded-md px-3 text-sm cursor-pointer"
      style={{ background: "#1a2030", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", minWidth: "180px" }}
    >
      <option value="all">📊 Todos los meses</option>
      {availableMonths.map(m => (
        <option key={m} value={m}>{formatMonthLabel(m)}</option>
      ))}
    </select>
  );
}