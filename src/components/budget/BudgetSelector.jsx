import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BudgetSelector({ value, onChange }) {
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  if (budgets.length === 0) {
    return (
      <div className="text-sm" style={{ color: "#64748b" }}>
        No budgets yet. Go to Setup to create one.
      </div>
    );
  }

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-48 border-0 text-sm font-medium"
        style={{ background: "#1a2030", color: "#f1f5f9" }}>
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
        {budgets.map(b => (
          <SelectItem key={b.id} value={b.id} style={{ color: "#f1f5f9" }}>
            {b.month} {b.name_person1 ? `· ${b.name_person1}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}