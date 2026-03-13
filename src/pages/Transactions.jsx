import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeftRight, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEUR, ALL_CATEGORIES, CATEGORY_CONFIG } from "../components/budget/constants";
import BudgetSelector from "../components/budget/BudgetSelector";

const TABS = ["All", "Income", "Expenses", "Recurring", "Uncategorized"];

export default function Transactions() {
  const queryClient = useQueryClient();
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId || budgets[0]?.id;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", activeId],
    queryFn: () => activeId ? base44.entities.Transaction.filter({ budget_id: activeId }, "date", 5000) : Promise.resolve([]),
    enabled: !!activeId,
  });

  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  let filtered = [...transactions];

  // Tab filter
  if (tab === "Income") filtered = filtered.filter(t => t.direction === "income");
  else if (tab === "Expenses") filtered = filtered.filter(t => t.direction === "expense");
  else if (tab === "Recurring") filtered = filtered.filter(t => t.is_recurring);
  else if (tab === "Uncategorized") filtered = filtered.filter(t => t.category === "Uncategorized");

  // Search
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(t => t.description?.toLowerCase().includes(s));
  }

  // Category filter
  if (catFilter !== "all") filtered = filtered.filter(t => t.category === catFilter);

  // Sort
  if (sortBy === "date") filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  else if (sortBy === "amount_high") filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
  else if (sortBy === "amount_low") filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));

  const totalIncome = filtered.filter(t => t.direction === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = filtered.filter(t => t.direction === "expense").reduce((s, t) => s + (t.amount || 0), 0);

  const handleCategoryChange = async (txId, newCat) => {
    await base44.entities.Transaction.update(txId, { category: newCat });
    queryClient.invalidateQueries({ queryKey: ["transactions", activeId] });
  };

  const handleWhoChange = async (txId, who) => {
    await base44.entities.Transaction.update(txId, { who });
    queryClient.invalidateQueries({ queryKey: ["transactions", activeId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <ArrowLeftRight size={20} style={{ color: "#4ade80" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Transactions</h1>
        </div>
        <BudgetSelector value={activeId} onChange={setSelectedId} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#151a22" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              background: tab === t ? "#4ade80" : "transparent",
              color: tab === t ? "#0b0e13" : "#94a3b8",
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search descriptions..."
            className="pl-9 border-0"
            style={{ background: "#151a22", color: "#f1f5f9" }} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40 border-0" style={{ background: "#151a22", color: "#94a3b8" }}>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
            <SelectItem value="all" style={{ color: "#f1f5f9" }}>All Categories</SelectItem>
            {ALL_CATEGORIES.map(c => (
              <SelectItem key={c} value={c} style={{ color: CATEGORY_CONFIG[c]?.color }}>
                {CATEGORY_CONFIG[c]?.icon} {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 border-0" style={{ background: "#151a22", color: "#94a3b8" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
            <SelectItem value="date" style={{ color: "#f1f5f9" }}>Date (newest)</SelectItem>
            <SelectItem value="amount_high" style={{ color: "#f1f5f9" }}>Amount (high)</SelectItem>
            <SelectItem value="amount_low" style={{ color: "#f1f5f9" }}>Amount (low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1a2030" }}>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>Description</th>
                <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>Dir</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>Who</th>
                <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: "#64748b" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: "#64748b" }}>No transactions found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#94a3b8" }}>{t.date}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate" style={{ color: "#f1f5f9" }}>{t.description}</td>
                  <td className="px-4 py-3 text-center">
                    {t.direction === "income" ?
                      <ArrowUp size={14} style={{ color: "#4ade80" }} /> :
                      <ArrowDown size={14} style={{ color: "#f87171" }} />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Select value={t.category} onValueChange={(val) => handleCategoryChange(t.id, val)}>
                      <SelectTrigger className="h-7 text-xs border-0 w-36"
                        style={{ background: "#1a2030", color: CATEGORY_CONFIG[t.category]?.color || "#94a3b8" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {ALL_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c} style={{ color: CATEGORY_CONFIG[c]?.color }}>
                            {CATEGORY_CONFIG[c]?.icon} {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={t.who || "shared"} onValueChange={(val) => handleWhoChange(t.id, val)}>
                      <SelectTrigger className="h-7 text-xs border-0 w-24"
                        style={{ background: "#1a2030", color: "#94a3b8" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <SelectItem value="person1" style={{ color: "#f1f5f9" }}>Person 1</SelectItem>
                        <SelectItem value="person2" style={{ color: "#f1f5f9" }}>Person 2</SelectItem>
                        <SelectItem value="shared" style={{ color: "#f1f5f9" }}>Shared</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap"
                    style={{ color: t.direction === "income" ? "#4ade80" : "#f87171" }}>
                    {t.direction === "income" ? "+" : "-"}{formatEUR(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end gap-6 px-4 py-3" style={{ background: "#1a2030", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-sm" style={{ color: "#4ade80" }}>Income: {formatEUR(totalIncome)}</span>
          <span className="text-sm" style={{ color: "#f87171" }}>Expenses: {formatEUR(totalExpenses)}</span>
          <span className="text-sm font-bold" style={{ color: totalIncome - totalExpenses >= 0 ? "#4ade80" : "#f87171" }}>
            Net: {formatEUR(totalIncome - totalExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
}