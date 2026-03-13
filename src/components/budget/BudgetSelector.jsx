import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function formatMonthES(yyyymm) {
  if (!yyyymm) return yyyymm;
  const [y, m] = yyyymm.split("-");
  return `${MESES_ES[parseInt(m) - 1]} ${y}`;
}

export default function BudgetSelector({ value, onChange, showTodos = false }) {
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  if (budgets.length === 0) {
    return <div className="text-sm" style={{ color: "#64748b" }}>Sin presupuestos. Ve a Configuración.</div>;
  }

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-52 border-0 text-sm font-medium"
        style={{ background: "#1a2030", color: "#f1f5f9" }}>
        <SelectValue placeholder="Seleccionar mes" />
      </SelectTrigger>
      <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
        {showTodos && (
          <SelectItem value="todos" style={{ color: "#f1f5f9" }}>📊 Todos los meses</SelectItem>
        )}
        {budgets.map(b => (
          <SelectItem key={b.id} value={b.id} style={{ color: "#f1f5f9" }}>
            {formatMonthES(b.month)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}