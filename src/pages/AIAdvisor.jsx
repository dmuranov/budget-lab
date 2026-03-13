import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bot, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { formatEUR, NEEDS_CATEGORIES, WANTS_CATEGORIES } from "../components/budget/constants";
import BudgetSelector from "../components/budget/BudgetSelector";

export default function AIAdvisor() {
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId || budgets[0]?.id;

  const { data: budget } = useQuery({
    queryKey: ["budget", activeId],
    queryFn: () => activeId ? base44.entities.MonthlyBudget.filter({ id: activeId }) : Promise.resolve([]),
    enabled: !!activeId,
    select: (data) => data?.[0],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeId],
    queryFn: () => activeId ? base44.entities.Transaction.filter({ budget_id: activeId }, "date", 5000) : Promise.resolve([]),
    enabled: !!activeId,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.FinancialGoal.list(),
  });

  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const generateAdvice = async () => {
    if (!budget || transactions.length === 0) return;
    setLoading(true);
    setAdvice("");

    const income = transactions.filter(t => t.direction === "income" && t.category !== "Internal Transfer");
    const expenses = transactions.filter(t => t.direction === "expense" && t.category !== "Internal Transfer");
    const totalIncome = income.reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, t) => s + (t.amount || 0), 0);

    // Category totals
    const expByCategory = {};
    expenses.forEach(t => { expByCategory[t.category] = (expByCategory[t.category] || 0) + (t.amount || 0); });

    const incByCategory = {};
    income.forEach(t => { incByCategory[t.category] = (incByCategory[t.category] || 0) + (t.amount || 0); });

    const needsTotal = expenses.filter(t => NEEDS_CATEGORIES.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
    const wantsTotal = expenses.filter(t => WANTS_CATEGORIES.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
    const savingsAmt = totalIncome - totalExpenses;
    const debtCategories = ["Loan Payment", "Mortgage", "Credit Card"];
    const totalDebt = expenses.filter(t => debtCategories.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);

    const totalAssets = assets.filter(a => a.type === "asset").reduce((s, a) => s + (a.value || 0), 0);
    const totalLiabilities = assets.filter(a => a.type === "liability").reduce((s, a) => s + (a.value || 0), 0);

    const recurring = transactions.filter(t => t.is_recurring && t.direction === "expense");
    const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 15);

    const prompt = `You are a direct, no-nonsense financial advisor for a household in Madrid, Spain. Analyze this data and give SPECIFIC, actionable advice. Be honest. Respond in English.

HOUSEHOLD:
- ${budget.name_person1 || "Person 1"}: €${budget.salary_person1 || 0}/month net
- ${budget.name_person2 || "Person 2"}: €${budget.salary_person2 || 0}/month net
- Total income from transactions: €${totalIncome.toFixed(2)}/month

INCOME BREAKDOWN:
${Object.entries(incByCategory).map(([k, v]) => `- ${k}: €${v.toFixed(2)}`).join("\n")}

EXPENSE BREAKDOWN BY CATEGORY:
${Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: €${v.toFixed(2)} (${totalIncome > 0 ? ((v / totalIncome) * 100).toFixed(1) : 0}%)`).join("\n")}

DEBT SITUATION:
- Monthly debt payments: €${totalDebt.toFixed(2)}
- Debt-to-income ratio: ${totalIncome > 0 ? ((totalDebt / totalIncome) * 100).toFixed(1) : 0}%

50/30/20 STATUS:
- Needs: €${needsTotal.toFixed(2)} (${totalIncome > 0 ? ((needsTotal / totalIncome) * 100).toFixed(1) : 0}% — target ≤50%)
- Wants: €${wantsTotal.toFixed(2)} (${totalIncome > 0 ? ((wantsTotal / totalIncome) * 100).toFixed(1) : 0}% — target ≤30%)
- Savings: €${savingsAmt.toFixed(2)} (${totalIncome > 0 ? ((savingsAmt / totalIncome) * 100).toFixed(1) : 0}% — target ≥20%)

NET WORTH: €${(totalAssets - totalLiabilities).toFixed(2)} (Assets: €${totalAssets.toFixed(2)}, Liabilities: €${totalLiabilities.toFixed(2)})

RECURRING/SUBSCRIPTIONS:
${recurring.slice(0, 15).map(t => `- ${t.description}: €${(t.amount || 0).toFixed(2)}`).join("\n") || "None detected"}

TOP 15 BIGGEST EXPENSES:
${topExpenses.map((t, i) => `${i + 1}. ${t.description} - €${t.amount.toFixed(2)} (${t.category})`).join("\n")}

FINANCIAL GOALS:
${goals.map(g => `- ${g.icon || ""} ${g.name}: €${(g.saved_amount || 0).toFixed(2)}/€${(g.target_amount || 0).toFixed(2)} saved, €${(g.monthly_contribution || 0).toFixed(2)}/mo`).join("\n") || "None set"}

PROVIDE YOUR ANALYSIS IN THESE SECTIONS:
### 📊 Budget Health Score
Score /100 with one-line verdict.

### 💰 Income Analysis
Is income diversified enough? Suggestions.

### 🏠 Fixed Obligations Assessment
Are fixed costs too high? What to renegotiate?

### ⚖️ 50/30/20 Assessment
Actual vs ideal. Specific amounts to shift.

### 🔴 Cut Immediately
Specific items to eliminate with € savings.

### 🟡 Optimize
Items to reduce. Give SPECIFIC Spanish alternatives (Digi, MyInvestor, etc.)

### 🔄 Subscription Audit
Which to cancel or downgrade.

### 💳 Debt Strategy
Avalanche vs snowball with timeline.

### 💰 Savings & Investment Plan
Emergency fund → cuenta remunerada, Index funds → MyInvestor/Indexa Capital, Plan de pensiones.

### 📈 Spain-Specific Tax Tips
Plan de pensiones, vivienda habitual, maternidad, Madrid deductions.

### 🎯 5 Actions This Week
Concrete steps with € targets.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
    });

    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <Bot size={20} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>AI Financial Advisor</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>Powered by AI · Uses more integration credits</p>
          </div>
        </div>
        <BudgetSelector value={activeId} onChange={setSelectedId} />
      </div>

      {!advice && !loading && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-5xl mb-4 block">🤖</span>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Get Personalized Financial Advice</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#64748b" }}>
            AI will analyze your income, expenses, debt, goals, and net worth to give specific, actionable advice tailored to your situation in Madrid.
          </p>
          <Button onClick={generateAdvice}
            disabled={!budget || transactions.length === 0}
            className="px-8 py-3 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "#0b0e13" }}>
            🤖 Generate Financial Advice
          </Button>
          {(!budget || transactions.length === 0) && (
            <p className="text-xs mt-3" style={{ color: "#f87171" }}>Import transactions first in Setup page</p>
          )}
        </div>
      )}

      {loading && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#4ade80" }} />
          <p className="text-sm" style={{ color: "#94a3b8" }}>Analyzing your finances...</p>
        </div>
      )}

      {advice && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <Button onClick={generateAdvice} variant="outline" size="sm"
              className="border-0" style={{ background: "#151a22", color: "#94a3b8" }}>
              <RefreshCw size={14} className="mr-2" /> Regenerate
            </Button>
          </div>
          <div className="rounded-xl p-6 md:p-8 prose-invert max-w-none"
            style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-sm leading-relaxed" style={{ color: "#f1f5f9" }}>
              <ReactMarkdown
                components={{
                  h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: "#4ade80" }}>{children}</h3>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mt-8 mb-4" style={{ color: "#4ade80" }}>{children}</h2>,
                  strong: ({ children }) => <strong style={{ color: "#f1f5f9" }}>{children}</strong>,
                  li: ({ children }) => <li className="ml-4 mb-1" style={{ color: "#94a3b8" }}>{children}</li>,
                  p: ({ children }) => <p className="mb-3" style={{ color: "#94a3b8" }}>{children}</p>,
                }}
              >
                {advice}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}