import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEUR, formatPct } from "../components/budget/constants";
import { useBudgetData } from "../components/budget/useBudgetData";
import BudgetSelector, { formatMonthES } from "../components/budget/BudgetSelector";
import StatCard from "../components/budget/StatCard";
import DesglosIngresos from "../components/dashboard/DesglosIngresos";
import ObligacionesFijas from "../components/dashboard/ObligacionesFijas";
import Regla502030 from "../components/dashboard/Regla502030";
import GraficoGastos from "../components/dashboard/GraficoGastos";
import SituacionDeuda from "../components/dashboard/SituacionDeuda";
import SuscripcionesRecurrentes from "../components/dashboard/SuscripcionesRecurrentes";
import TopGastos from "../components/dashboard/TopGastos";
import AlertasInteligentes from "../components/dashboard/AlertasInteligentes";
import ResumenMultiMes from "../components/dashboard/ResumenMultiMes";

export default function Panel() {
  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId === "todos" ? null : (selectedId || budgets[0]?.id);
  const showingTodos = selectedId === "todos";

  const {
    budget, transactions, income, expenses,
    totalIncome, totalExpenses, netCashflow, savingsRate,
    expenseByCategory, incomeByCategory,
    necesidadesTotal, deseosTotal,
    recurring, debtPayments, totalDebt, debtToIncome,
    isLoading,
  } = useBudgetData(activeId);

  if (budgets.length === 0 && !loadingBudgets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(74,222,128,0.1)" }}>
          <LayoutDashboard size={28} style={{ color: "#4ade80" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Sin datos todavía</h2>
        <p className="text-sm mb-4" style={{ color: "#64748b" }}>Ve a Configuración para crear tu primer presupuesto e importar movimientos.</p>
        <Link to="/Configuracion" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#4ade80", color: "#0b0e13" }}>
          Ir a Configuración
        </Link>
      </div>
    );
  }

  const activeBudget = budgets.find(b => b.id === activeId);
  const savingsColor = savingsRate >= 20 ? "#4ade80" : savingsRate >= 10 ? "#fbbf24" : "#f87171";

  // Aviso de nómina ausente: hay gastos pero no hay ingresos de nómina en este mes
  const tieneNomina = income.some(t => t.category === "Nómina");
  const tieneGastos = expenses.length > 0;
  const mostrarAvisoNomina = !showingTodos && tieneGastos && !tieneNomina && !isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <LayoutDashboard size={20} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>📊 Panel Principal</h1>
            {activeBudget && !showingTodos && (
              <p className="text-xs" style={{ color: "#64748b" }}>{formatMonthES(activeBudget.month)}</p>
            )}
          </div>
        </div>
        <BudgetSelector
          value={selectedId || budgets[0]?.id}
          onChange={setSelectedId}
          showTodos={true}
        />
      </div>

      {/* Vista multi-mes */}
      {showingTodos ? (
        <ResumenMultiMes budgets={budgets} />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#1a2030", borderTopColor: "#4ade80" }} />
        </div>
      ) : (
        <>
          {/* Aviso nómina ausente */}
          {mostrarAvisoNomina && (
            <div className="rounded-xl p-4" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "#fbbf24" }}>
                ⚠️ No se detectaron nóminas en {formatMonthES(activeBudget?.month)}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Esto puede ser porque vuestras nóminas se cobran entre el 25-30 del mes anterior y el extracto no las incluye.
                Para tener datos completos, exportad el extracto bancario desde el día 25 del mes anterior.
              </p>
            </div>
          )}

          {/* Fila 1: Tarjetas resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="💵 Ingresos Totales" value={formatEUR(totalIncome)} color="#4ade80" />
            <StatCard title="🔥 Gastos Totales" value={formatEUR(totalExpenses)}
              color={totalExpenses > totalIncome ? "#f87171" : "#f1f5f9"} />
            <StatCard title="💰 Saldo Neto" value={formatEUR(netCashflow)}
              color={netCashflow >= 0 ? "#4ade80" : "#f87171"} icon={netCashflow >= 0 ? "📈" : "📉"} />
            <StatCard title="📊 Tasa de Ahorro" value={formatPct(savingsRate)} color={savingsColor}
              subtitle={savingsRate >= 20 ? "¡En buen camino!" : "Objetivo: ≥20%"} />
          </div>

          {/* Fila 2: Ingresos + Fijos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DesglosIngresos incomeByCategory={incomeByCategory} budget={budget} />
            <ObligacionesFijas expenses={expenses} totalIncome={totalIncome} />
          </div>

          {/* Fila 3: Regla 50/30/20 */}
          <Regla502030 necesidadesTotal={necesidadesTotal} deseosTotal={deseosTotal}
            totalIncome={totalIncome} netCashflow={netCashflow} />

          {/* Fila 4: Gráfico gastos */}
          <GraficoGastos expenseByCategory={expenseByCategory} />

          {/* Fila 5: Deuda + Recurrentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SituacionDeuda debtPayments={debtPayments} totalDebt={totalDebt} debtToIncome={debtToIncome} />
            <SuscripcionesRecurrentes recurring={recurring} />
          </div>

          {/* Fila 6: Top gastos */}
          <TopGastos expenses={expenses} />

          {/* Fila 7: Alertas */}
          <AlertasInteligentes
            totalIncome={totalIncome} totalExpenses={totalExpenses}
            netCashflow={netCashflow} savingsRate={savingsRate}
            debtToIncome={debtToIncome} transactions={transactions}
          />

          {/* Botón IA */}
          <div className="text-center py-4">
            <Link to="/AsesorIA"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "#0b0e13" }}>
              🤖 Obtener Asesoramiento Financiero con IA
            </Link>
          </div>
        </>
      )}
    </div>
  );
}