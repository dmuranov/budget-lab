import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { NEEDS_CATEGORIES, WANTS_CATEGORIES, FIXED_CATEGORIES, INCOME_CATEGORIES } from "./constants";

export function useBudgetData(budgetId) {
  const budgetQuery = useQuery({
    queryKey: ["budget", budgetId],
    queryFn: () => budgetId ? base44.entities.MonthlyBudget.filter({ id: budgetId }) : Promise.resolve([]),
    enabled: !!budgetId,
  });

  const txQuery = useQuery({
    queryKey: ["transactions", budgetId],
    queryFn: () => budgetId ? base44.entities.Transaction.filter({ budget_id: budgetId }, "date", 5000) : Promise.resolve([]),
    enabled: !!budgetId,
  });

  const budget = budgetQuery.data?.[0] || null;
  const transactions = txQuery.data || [];

  const income = transactions.filter(t => t.direction === "income" && t.category !== "Internal Transfer");
  const expenses = transactions.filter(t => t.direction === "expense" && t.category !== "Internal Transfer");

  const totalIncome = income.reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, t) => s + (t.amount || 0), 0);
  const netCashflow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

  // Category totals for expenses
  const expenseByCategory = {};
  expenses.forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + (t.amount || 0);
  });

  // Income by category
  const incomeByCategory = {};
  income.forEach(t => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + (t.amount || 0);
  });

  // 50/30/20
  const needsTotal = expenses.filter(t => NEEDS_CATEGORIES.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
  const wantsTotal = expenses.filter(t => WANTS_CATEGORIES.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);

  // Fixed obligations
  const fixedTotal = expenses.filter(t => FIXED_CATEGORIES.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);

  // Recurring
  const recurring = transactions.filter(t => t.is_recurring && t.direction === "expense");

  // Debt payments
  const debtCategories = ["Loan Payment", "Mortgage", "Credit Card"];
  const debtPayments = expenses.filter(t => debtCategories.includes(t.category));
  const totalDebt = debtPayments.reduce((s, t) => s + (t.amount || 0), 0);
  const debtToIncome = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

  return {
    budget,
    transactions,
    income,
    expenses,
    totalIncome,
    totalExpenses,
    netCashflow,
    savingsRate,
    expenseByCategory,
    incomeByCategory,
    needsTotal,
    wantsTotal,
    fixedTotal,
    recurring,
    debtPayments,
    totalDebt,
    debtToIncome,
    isLoading: budgetQuery.isLoading || txQuery.isLoading,
    refetch: () => { budgetQuery.refetch(); txQuery.refetch(); },
  };
}