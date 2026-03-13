import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard } from "lucide-react";
import { formatEUR, formatPct } from "../components/budget/constants";
import { useBudgetData } from "../components/budget/useBudgetData";
import BudgetSelector from "../components/budget/BudgetSelector";
import StatCard from "../components/budget/StatCard";
import IncomeBreakdown from "../components/dashboard/IncomeBreakdown";
import FixedObligations from "../components/dashboard/FixedObligations";
import RuleProgress from "../components/dashboard/RuleProgress";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import DebtSummary from "../components/dashboard/DebtSummary";
import RecurringSummary from "../components/dashboard/RecurringSummary";
import TopExpenses from "../components/dashboard/TopExpenses";
import SmartAlerts from "../components/dashboard/SmartAlerts";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId || budgets[0]?.id;

  const {
    budget, transactions, income, expenses,
    totalIncome, totalExpenses, netCashflow, savingsRate,
    expenseByCategory, incomeByCategory,
    needsTotal, wantsTotal,
    recurring, debtPayments, totalDebt, debtToIncome,
    isLoading,
  } = useBudgetData(activeId);

  if (budgets.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(74,222,128,0.1)" }}>
          <LayoutDashboard size={28} style={{ color: "#4ade80" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>No data yet</h2>
        <p className="text-sm mb-4" style={{ color: "#64748b" }}>Go to Setup to create your first monthly budget and import transactions.</p>
        <Link to="/Setup" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#4ade80", color: "#0b0e13" }}>
          Go to Setup
        </Link>
      </div>
    );
  }

  const savingsColor = savingsRate >= 20 ? "#4ade80" : savingsRate >= 10 ? "#fbbf24" : "#f87171";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <LayoutDashboard size={20} style={{ color: "#4ade80" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Dashboard</h1>
        </div>
        <BudgetSelector value={activeId} onChange={setSelectedId} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#1a2030", borderTopColor: "#4ade80" }} />
        </div>
      ) : (
        <>
          {/* Row 1: Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Income" value={formatEUR(totalIncome)} color="#4ade80" icon="💰" />
            <StatCard title="Total Expenses" value={formatEUR(totalExpenses)}
              color={totalExpenses > totalIncome ? "#f87171" : "#f1f5f9"} icon="💸" />
            <StatCard title="Net Cashflow" value={formatEUR(netCashflow)}
              color={netCashflow >= 0 ? "#4ade80" : "#f87171"} icon={netCashflow >= 0 ? "📈" : "📉"} />
            <StatCard title="Savings Rate" value={formatPct(savingsRate)} color={savingsColor} icon="🎯"
              subtitle={savingsRate >= 20 ? "On track!" : "Target: ≥20%"} />
          </div>

          {/* Row 2-3: Income + Fixed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IncomeBreakdown incomeByCategory={incomeByCategory} budget={budget} />
            <FixedObligations expenses={expenses} totalIncome={totalIncome} />
          </div>

          {/* Row 4: 50/30/20 */}
          <RuleProgress needsTotal={needsTotal} wantsTotal={wantsTotal}
            totalIncome={totalIncome} netCashflow={netCashflow} />

          {/* Row 5: Expense chart */}
          <ExpenseChart expenseByCategory={expenseByCategory} />

          {/* Row 6-7: Debt + Recurring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DebtSummary debtPayments={debtPayments} totalDebt={totalDebt} debtToIncome={debtToIncome} />
            <RecurringSummary recurring={recurring} />
          </div>

          {/* Row 8: Top expenses */}
          <TopExpenses expenses={expenses} />

          {/* Row 9: Smart Alerts */}
          <SmartAlerts
            totalIncome={totalIncome} totalExpenses={totalExpenses}
            netCashflow={netCashflow} savingsRate={savingsRate}
            debtToIncome={debtToIncome} transactions={transactions}
          />

          {/* Row 10: AI button */}
          <div className="text-center py-4">
            <Link to="/AIAdvisor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "#0b0e13" }}>
              🤖 Get AI Financial Advice
            </Link>
          </div>
        </>
      )}
    </div>
  );
}