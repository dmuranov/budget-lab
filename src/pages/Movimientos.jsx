import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeftRight, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEUR, ALL_CATEGORIES, CATEGORY_CONFIG } from "../components/budget/constants";
import BudgetSelector, { formatMonthES } from "../components/budget/BudgetSelector";

const PESTAÑAS = [
  { id: "todos", label: "Todos" },
  { id: "ingresos", label: "Ingresos" },
  { id: "gastos", label: "Gastos" },
  { id: "fijos", label: "Fijos" },
  { id: "recurrentes", label: "Recurrentes" },
  { id: "sin_clasificar", label: "Sin Clasificar" },
];

export default function Movimientos() {
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

  const [tab, setTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  let filtered = [...transactions];
  if (tab === "ingresos") filtered = filtered.filter(t => t.direction === "ingreso");
  else if (tab === "gastos") filtered = filtered.filter(t => t.direction === "gasto");
  else if (tab === "fijos") filtered = filtered.filter(t => t.is_fixed);
  else if (tab === "recurrentes") filtered = filtered.filter(t => t.is_recurring);
  else if (tab === "sin_clasificar") filtered = filtered.filter(t => t.category === "Sin Clasificar");

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(t => t.description?.toLowerCase().includes(s));
  }
  if (catFilter !== "all") filtered = filtered.filter(t => t.category === catFilter);

  if (sortBy === "date") filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  else if (sortBy === "importe_mayor") filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
  else if (sortBy === "importe_menor") filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));

  const totalIngresos = filtered.filter(t => t.direction === "ingreso").reduce((s, t) => s + (t.amount || 0), 0);
  const totalGastos = filtered.filter(t => t.direction === "gasto").reduce((s, t) => s + (t.amount || 0), 0);

  const handleCategoryChange = async (txId, newCat) => {
    await base44.entities.Transaction.update(txId, { category: newCat });
    queryClient.invalidateQueries({ queryKey: ["transactions", activeId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <ArrowLeftRight size={20} style={{ color: "#4ade80" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>📋 Movimientos</h1>
        </div>
        <BudgetSelector value={activeId} onChange={setSelectedId} />
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ background: "#151a22" }}>
        {PESTAÑAS.map(p => (
          <button key={p.id} onClick={() => setTab(p.id)}
            className="px-3 py-2 rounded-md text-sm font-medium transition-all"
            style={{ background: tab === p.id ? "#4ade80" : "transparent", color: tab === p.id ? "#0b0e13" : "#94a3b8" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar descripción..."
            className="pl-9 border-0" style={{ background: "#151a22", color: "#f1f5f9" }} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44 border-0" style={{ background: "#151a22", color: "#94a3b8" }}>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
            <SelectItem value="all" style={{ color: "#f1f5f9" }}>Todas las categorías</SelectItem>
            {ALL_CATEGORIES.map(c => (
              <SelectItem key={c} value={c} style={{ color: CATEGORY_CONFIG[c]?.color }}>
                {CATEGORY_CONFIG[c]?.icon} {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 border-0" style={{ background: "#151a22", color: "#94a3b8" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
            <SelectItem value="date" style={{ color: "#f1f5f9" }}>Fecha (reciente)</SelectItem>
            <SelectItem value="importe_mayor" style={{ color: "#f1f5f9" }}>Importe (mayor)</SelectItem>
            <SelectItem value="importe_menor" style={{ color: "#f1f5f9" }}>Importe (menor)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1a2030" }}>
                {["Fecha", "Descripción", "Dir.", "Categoría", "Importe"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: "#64748b" }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: "#64748b" }}>No hay movimientos</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: t.category === "Sin Clasificar" ? "rgba(251,191,36,0.03)" : "transparent",
                  }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#94a3b8" }}>{t.date}</td>
                  <td className="px-4 py-3 max-w-[220px]" style={{ color: "#f1f5f9" }}>
                    <span title={`${t.description}\nFecha: ${t.date}\nImporte: ${t.direction === "ingreso" ? "+" : "-"}${formatEUR(t.amount)}\nCategoría: ${t.category}`}
                      className="block truncate cursor-default">{t.description}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.direction === "ingreso"
                      ? <ArrowUp size={14} style={{ color: "#4ade80" }} />
                      : t.category === "Traspaso Interno"
                        ? <span style={{ color: "#64748b" }}>↔</span>
                        : <ArrowDown size={14} style={{ color: "#f87171" }} />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Select value={t.category} onValueChange={(val) => handleCategoryChange(t.id, val)}>
                      <SelectTrigger className="h-7 text-xs border-0 w-40"
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
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap"
                    style={{ color: t.direction === "ingreso" ? "#4ade80" : t.category === "Traspaso Interno" ? "#64748b" : "#f87171" }}>
                    {t.direction === "ingreso" ? "+" : t.category === "Traspaso Interno" ? "↔" : "-"}{formatEUR(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-6 px-4 py-3" style={{ background: "#1a2030", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-sm" style={{ color: "#4ade80" }}>Ingresos: {formatEUR(totalIngresos)}</span>
          <span className="text-sm" style={{ color: "#f87171" }}>Gastos: {formatEUR(totalGastos)}</span>
          <span className="text-sm font-bold" style={{ color: totalIngresos - totalGastos >= 0 ? "#4ade80" : "#f87171" }}>
            Neto: {formatEUR(totalIngresos - totalGastos)}
          </span>
        </div>
      </div>
    </div>
  );
}