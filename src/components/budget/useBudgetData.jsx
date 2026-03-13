import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { NECESIDADES_CATEGORIAS, DESEOS_CATEGORIAS, GASTOS_FIJOS_CATEGORIAS, DEUDA_CATEGORIAS } from "./constants";

export function useBudgetData(budgetId) {
  const budgetQuery = useQuery({
    queryKey: ["budget", budgetId],
    queryFn: () => budgetId ? base44.entities.MonthlyBudget.filter({ id: budgetId }) : Promise.resolve([]),
    enabled: !!budgetId,
    staleTime: 0,
  });

  const txQuery = useQuery({
    queryKey: ["transactions", budgetId],
    queryFn: () => budgetId ? base44.entities.Transaction.filter({ budget_id: budgetId }, "date", 5000) : Promise.resolve([]),
    enabled: !!budgetId,
    staleTime: 0,
  });

  const budget = budgetQuery.data?.[0] || null;
  const transactions = txQuery.data || [];

  const income = transactions.filter(t => t.direction === "ingreso" && t.category !== "Traspaso Interno");
  const expenses = transactions.filter(t => t.direction === "gasto" && t.category !== "Traspaso Interno");

  const totalIncome = income.reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, t) => s + (t.amount || 0), 0);
  const netCashflow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

  const expenseByCategory = {};
  expenses.forEach(t => { expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + (t.amount || 0); });

  const incomeByCategory = {};
  income.forEach(t => { incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + (t.amount || 0); });

  const necesidadesTotal = expenses.filter(t => NECESIDADES_CATEGORIAS.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
  const deseosTotal = expenses.filter(t => DESEOS_CATEGORIAS.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);

  const fixedExpenses = expenses.filter(t => t.is_fixed || GASTOS_FIJOS_CATEGORIAS.includes(t.category));
  const fixedTotal = fixedExpenses.reduce((s, t) => s + (t.amount || 0), 0);

  const recurring = transactions.filter(t => t.is_recurring && t.direction === "gasto");

  const debtPayments = expenses.filter(t => DEUDA_CATEGORIAS.includes(t.category));
  const totalDebt = debtPayments.reduce((s, t) => s + (t.amount || 0), 0);
  const debtToIncome = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

  return {
    budget, transactions, income, expenses,
    totalIncome, totalExpenses, netCashflow, savingsRate,
    expenseByCategory, incomeByCategory,
    necesidadesTotal, deseosTotal,
    fixedExpenses, fixedTotal,
    recurring, debtPayments, totalDebt, debtToIncome,
    isLoading: budgetQuery.isLoading || txQuery.isLoading,
    refetch: () => { budgetQuery.refetch(); txQuery.refetch(); },
  };
}