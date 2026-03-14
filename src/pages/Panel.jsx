import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEUR, formatPct, NECESIDADES_CATEGORIAS, DESEOS_CATEGORIAS } from "../components/budget/constants";
import { useMonthFilter, formatMonthLabel, getMonthFromDate } from "../components/budget/useMonthFilter";
import MonthSelector from "../components/shared/MonthSelector";
import StatCard from "../components/budget/StatCard";
import DesglosIngresos from "../components/dashboard/DesglosIngresos";
import ObligacionesFijas from "../components/dashboard/ObligacionesFijas";
import Regla502030 from "../components/dashboard/Regla502030";
import GraficoGastos from "../components/dashboard/GraficoGastos";
import SituacionDeuda from "../components/dashboard/SituacionDeuda";
import SuscripcionesRecurrentes from "../components/dashboard/SuscripcionesRecurrentes";
import TopGastos from "../components/dashboard/TopGastos";
import AlertasInteligentes from "../components/dashboard/AlertasInteligentes";
import BannerNomina from "../components/dashboard/BannerNomina";

export default function Panel() {
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["all-transactions"],
    queryFn: () => base44.entities.Transaction.list("date", 10000),
    staleTime: 5 * 60 * 1000,
  });

  const {
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    filteredTransactions,
    transactionsForCalc,
  } = useMonthFilter(allTransactions);

  const income = transactionsForCalc.filter(t => t.direction === "ingreso");
  const expenses = transactionsForCalc.filter(t => t.direction === "gasto");

  const totalIncome = income.reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, t) => s + (t.amount || 0), 0);
  const netCashflow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;
  const savingsColor = savingsRate >= 20 ? "#4ade80" : savingsRate >= 10 ? "#fbbf24" : "#f87171";

  const expenseByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const incomeByCategory = income.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const necesidadesTotal = expenses.filter(t => NECESIDADES_CATEGORIAS.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
  const deseosTotal = expenses.filter(t => DESEOS_CATEGORIAS.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);

  const debtPayments = expenses.filter(t => ["Hipoteca", "Préstamo", "Pago Tarjeta Crédito"].includes(t.category));
  const totalDebt = debtPayments.reduce((s, t) => s + (t.amount || 0), 0);
  const debtToIncome = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

  const recurring = expenses.filter(t => t.is_recurring);

  const monthlyBreakdown = useMemo(() => {
    if (selectedMonth !== "all") return null;
    const breakdown = {};
    allTransactions.forEach(t => {
      if (t.category === "Traspaso Interno") return;
      const month = getMonthFromDate(t.date);
      if (!month) return;
      if (!breakdown[month]) breakdown[month] = { ingresos: 0, gastos: 0 };
      if (t.direction === "ingreso") breakdown[month].ingresos += t.amount || 0;
      else breakdown[month].gastos += t.amount || 0;
    });
    return Object.entries(breakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: formatMonthLabel(month),
        ingresos: Math.round(data.ingresos * 100) / 100,
        gastos: Math.round(data.gastos * 100) / 100,
        neto: Math.round((data.ingresos - data.gastos) * 100) / 100,
        ahorro: data.ingresos > 0 ? Math.round((data.ingresos - data.gastos) / data.ingresos * 1000) / 10 : 0,
      }));
  }, [allTransactions, selectedMonth]);

  if (!isLoading && allTransactions.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Header — UN SOLO selector aquí */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <LayoutDashboard size={20} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>📊 Panel Principal</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>
              {selectedMonth === "all" ? "Resumen Total" : formatMonthLabel(selectedMonth)}
            </p>
          </div>
        </div>
        <MonthSelector
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          availableMonths={availableMonths}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#1a2030", borderTopColor: "#4ade80" }} />
        </div>
      ) : (
        <>
          {/* === StatCards === */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="💵 Ingresos Totales" value={formatEUR(totalIncome)} color="#4ade80" />
            <StatCard title="🔥 Gastos Totales" value={formatEUR(totalExpenses)} color={totalExpenses > totalIncome ? "#f87171" : "#f1f5f9"} />
            <StatCard title="💰 Saldo Neto" value={formatEUR(netCashflow)} color={netCashflow >= 0 ? "#4ade80" : "#f87171"} icon={netCashflow >= 0 ? "📈" : "📉"} />
            <StatCard title="📊 Tasa de Ahorro" value={formatPct(savingsRate)} color={savingsColor} subtitle={savingsRate >= 20 ? "¡En buen camino!" : "Objetivo: ≥20%"} />
          </div>

          <BannerNomina
            allTransactions={allTransactions}
            currentMonthTransactions={transactionsForCalc}
            budgetMonth={selectedMonth !== "all" ? selectedMonth : null}
          />

          {/* Tabla comparativa multi-mes */}
          {monthlyBreakdown && (
            <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>📊 Comparativa Multi-Mes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "#64748b" }}>
                      <th className="text-left py-2">Mes</th>
                      <th className="text-right py-2">Ingresos</th>
                      <th className="text-right py-2">Gastos</th>
                      <th className="text-right py-2">Neto</th>
                      <th className="text-right py-2">Ahorro %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map(row => (
                      <tr key={row.month} className="cursor-pointer hover:bg-white/[0.02]"
                        onClick={() => setSelectedMonth(row.month)}
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <td className="py-2 font-medium" style={{ color: "#f1f5f9" }}>{row.label}</td>
                        <td className="py-2 text-right" style={{ color: "#4ade80" }}>{row.ingresos.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                        <td className="py-2 text-right" style={{ color: "#f87171" }}>{row.gastos.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                        <td className="py-2 text-right" style={{ color: row.neto >= 0 ? "#4ade80" : "#f87171" }}>{row.neto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                        <td className="py-2 text-right" style={{ color: row.ahorro >= 0 ? "#60a5fa" : "#f87171" }}>{row.ahorro.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totI = monthlyBreakdown.reduce((s, r) => s + r.ingresos, 0);
                      const totG = monthlyBreakdown.reduce((s, r) => s + r.gastos, 0);
                      const totN = totI - totG;
                      const totA = totI > 0 ? (totN / totI * 100) : 0;
                      return (
                        <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                          <td className="py-2 font-bold" style={{ color: "#f1f5f9" }}>TOTAL</td>
                          <td className="py-2 text-right font-bold" style={{ color: "#4ade80" }}>{totI.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                          <td className="py-2 text-right font-bold" style={{ color: "#f87171" }}>{totG.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                          <td className="py-2 text-right font-bold" style={{ color: totN >= 0 ? "#4ade80" : "#f87171" }}>{totN.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                          <td className="py-2 text-right font-bold" style={{ color: totA >= 0 ? "#60a5fa" : "#f87171" }}>{totA.toFixed(1)}%</td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Dashboard detallado por mes */}
          {selectedMonth !== "all" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DesglosIngresos incomeByCategory={incomeByCategory} budget={null} />
                <ObligacionesFijas expenses={expenses} totalIncome={totalIncome} />
              </div>
              <Regla502030 necesidadesTotal={necesidadesTotal} deseosTotal={deseosTotal} totalIncome={totalIncome} netCashflow={netCashflow} />
              <GraficoGastos expenseByCategory={expenseByCategory} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SituacionDeuda debtPayments={debtPayments} totalDebt={totalDebt} debtToIncome={debtToIncome} />
                <SuscripcionesRecurrentes recurring={recurring} />
              </div>
              <TopGastos expenses={expenses} />
              <AlertasInteligentes totalIncome={totalIncome} totalExpenses={totalExpenses} netCashflow={netCashflow} savingsRate={savingsRate} debtToIncome={debtToIncome} transactions={transactionsForCalc} />
            </>
          )}

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