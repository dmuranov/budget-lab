import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Save, X, Loader2 } from "lucide-react";
import { formatEUR, ALL_CATEGORIES, CATEGORY_CONFIG } from "../budget/constants";
import { detectSalaries } from "../budget/classifier";

export default function ImportPreview({ transactions, budgetId, onCancel, onImported }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(transactions);
  const [saving, setSaving] = useState(false);

  const incomeRows = rows.filter(t => t.direction === "income");
  const expenseRows = rows.filter(t => t.direction === "expense");
  const totalIncome = incomeRows.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenseRows.reduce((s, t) => s + t.amount, 0);
  const uncategorized = rows.filter(t => t.category === "Uncategorized").length;
  const salaries = detectSalaries(rows);

  const updateCategory = (idx, category) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, category } : r));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const batch = rows.map(r => ({
      budget_id: budgetId,
      date: r.date,
      description: r.description,
      original_amount: r.original_amount,
      amount: r.amount,
      direction: r.direction,
      flow_type: r.flow_type,
      category: r.category,
      is_recurring: r.is_recurring,
      who: r.who,
      notes: r.notes || "",
    }));

    // Bulk create in batches of 50
    for (let i = 0; i < batch.length; i += 50) {
      await base44.entities.Transaction.bulkCreate(batch.slice(i, i + 50));
    }

    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setSaving(false);
    onImported?.();
  };

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Total Transactions</div>
          <div className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{rows.length}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Income ({incomeRows.length})</div>
          <div className="text-lg font-bold" style={{ color: "#4ade80" }}>{formatEUR(totalIncome)}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Expenses ({expenseRows.length})</div>
          <div className="text-lg font-bold" style={{ color: "#f87171" }}>{formatEUR(totalExpenses)}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: uncategorized > 0 ? "rgba(251,191,36,0.1)" : "#1a2030" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Uncategorized</div>
          <div className="text-lg font-bold" style={{ color: uncategorized > 0 ? "#fbbf24" : "#4ade80" }}>
            {uncategorized}
          </div>
        </div>
      </div>

      {/* Salary detection */}
      {salaries.length > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
          <div className="text-sm font-medium mb-1" style={{ color: "#4ade80" }}>💵 Salary Detected</div>
          {salaries.map((s, i) => (
            <div key={i} className="text-sm" style={{ color: "#94a3b8" }}>
              {formatEUR(s.amount)} — "{s.description}" ({s.count}x)
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#1a2030" }}>
              <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: "#64748b" }}>Date</th>
              <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: "#64748b" }}>Description</th>
              <th className="text-right px-3 py-2 font-medium text-xs" style={{ color: "#64748b" }}>Amount</th>
              <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: "#64748b" }}>Type</th>
              <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: "#64748b" }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}
                className="transition-colors"
                style={{
                  background: row.category === "Uncategorized" ? "rgba(251,191,36,0.05)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.04)"
                }}>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: "#94a3b8" }}>{row.date}</td>
                <td className="px-3 py-2 max-w-[200px] truncate" style={{ color: "#f1f5f9" }}>{row.description}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1" style={{ color: row.direction === "income" ? "#4ade80" : "#f87171" }}>
                    {row.direction === "income" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {formatEUR(row.amount)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                    {row.flow_type}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Select value={row.category} onValueChange={(val) => updateCategory(idx, val)}>
                    <SelectTrigger className="h-7 text-xs border-0 w-36"
                      style={{ background: "#1a2030", color: CATEGORY_CONFIG[row.category]?.color || "#94a3b8" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {ALL_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} style={{ color: CATEGORY_CONFIG[cat]?.color }}>
                          {CATEGORY_CONFIG[cat]?.icon} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5">
        <Button onClick={handleSaveAll} disabled={saving}
          className="px-5" style={{ background: "#4ade80", color: "#0b0e13" }}>
          {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</> :
            <><Save size={16} className="mr-2" /> Save All ({rows.length})</>}
        </Button>
        <Button variant="ghost" onClick={onCancel}
          style={{ color: "#94a3b8" }}>
          <X size={16} className="mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
}