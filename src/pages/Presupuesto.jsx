import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEUR, CATEGORY_CONFIG, DESEOS_CATEGORIAS, NECESIDADES_CATEGORIAS } from "../components/budget/constants";
import BudgetSelector, { formatMonthES } from "../components/budget/BudgetSelector";
import { useSelectedBudget } from "../components/budget/SelectedBudgetContext";
import { useBudgetData } from "../components/budget/useBudgetData";

const CATEGORIAS_GASTOS = [
  "Supermercado", "Restaurantes", "Suministros", "Suscripciones", "Compras",
  "Transporte", "Salud", "Educación Hija", "Ocio", "Viajes", "Cuidado Personal",
  "Hogar", "Regalos/Varios", "Hipoteca", "Préstamo", "Seguros", "Impuestos/Tasas",
];

function FilaCategoria({ categoria, gastado, limite, onUpdateLimite }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(limite || "");

  const pct = limite > 0 ? (gastado / limite) * 100 : 0;
  const color = pct > 100 ? "#f87171" : pct > 80 ? "#fbbf24" : "#4ade80";
  const cfgColor = CATEGORY_CONFIG[categoria]?.color || "#94a3b8";

  const handleSave = () => {
    onUpdateLimite(categoria, parseFloat(valor) || 0);
    setEditando(false);
  };

  return (
    <div className="rounded-xl p-4" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{CATEGORY_CONFIG[categoria]?.icon}</span>
          <span className="text-sm font-medium" style={{ color: cfgColor }}>{categoria}</span>
        </div>
        <div className="flex items-center gap-2">
          {editando ? (
            <>
              <Input value={valor} onChange={e => setValor(e.target.value)} type="number"
                className="h-7 w-24 text-xs border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
              <button onClick={handleSave}><Check size={14} style={{ color: "#4ade80" }} /></button>
            </>
          ) : (
            <>
              <span className="text-xs" style={{ color: "#64748b" }}>
                {limite > 0 ? `Límite: ${formatEUR(limite)}` : "Sin límite"}
              </span>
              <button onClick={() => setEditando(true)}><Pencil size={12} style={{ color: "#64748b" }} /></button>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: "#f1f5f9" }}>Gastado: <strong>{formatEUR(gastado)}</strong></span>
        {limite > 0 && (
          <span style={{ color: color }}>
            {pct > 100 ? `Excedido en ${formatEUR(gastado - limite)}` : `Quedan ${formatEUR(limite - gastado)}`}
          </span>
        )}
      </div>

      {limite > 0 && (
        <div className="h-2 rounded-full" style={{ background: "#1a2030" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
      )}

      {gastado === 0 && (
        <div className="text-xs mt-1" style={{ color: "#64748b" }}>Sin gastos este mes</div>
      )}
    </div>
  );
}

export default function Presupuesto() {
  const queryClient = useQueryClient();
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId || budgets[0]?.id;
  const activeBudget = budgets.find(b => b.id === activeId);
  const activeMonth = activeBudget?.month || "";

  const { expenseByCategory, totalExpenses, isLoading } = useBudgetData(activeId);

  const { data: limites = [] } = useQuery({
    queryKey: ["limites", activeMonth],
    queryFn: () => activeMonth ? base44.entities.LimiteCategoria.filter({ mes: activeMonth }) : Promise.resolve([]),
    enabled: !!activeMonth,
  });

  const getLimite = (cat) => limites.find(l => l.categoria === cat)?.limite_mensual || 0;
  const totalLimites = limites.reduce((s, l) => s + (l.limite_mensual || 0), 0);

  const handleUpdateLimite = async (categoria, importe) => {
    const found = limites.find(l => l.categoria === categoria);
    if (found) {
      await base44.entities.LimiteCategoria.update(found.id, { limite_mensual: importe });
    } else {
      await base44.entities.LimiteCategoria.create({ categoria, limite_mensual: importe, mes: activeMonth });
    }
    queryClient.invalidateQueries({ queryKey: ["limites", activeMonth] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <BookOpen size={20} style={{ color: "#4ade80" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>📝 Presupuesto por Categorías</h1>
        </div>
        <BudgetSelector value={activeId} onChange={setSelectedId} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Presupuesto total</div>
          <div className="text-lg font-bold" style={{ color: "#60a5fa" }}>{formatEUR(totalLimites)}</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Gastado total</div>
          <div className="text-lg font-bold" style={{ color: "#f87171" }}>{formatEUR(totalExpenses)}</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>Margen</div>
          <div className="text-lg font-bold" style={{ color: totalLimites - totalExpenses >= 0 ? "#4ade80" : "#f87171" }}>
            {formatEUR(totalLimites - totalExpenses)}
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: "#64748b" }}>
        💡 Haz clic en el icono ✏️ de cada categoría para fijar un límite mensual
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIAS_GASTOS.map(cat => (
          <FilaCategoria
            key={cat}
            categoria={cat}
            gastado={expenseByCategory[cat] || 0}
            limite={getLimite(cat)}
            onUpdateLimite={handleUpdateLimite}
          />
        ))}
      </div>
    </div>
  );
}