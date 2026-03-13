import React, { useState } from "react";
import HouseholdForm from "../components/setup/HouseholdForm";
import CSVImporter from "../components/setup/CSVImporter";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatEUR } from "../components/budget/constants";
import { Settings } from "lucide-react";

export default function Setup() {
  const [activeBudgetId, setActiveBudgetId] = useState(null);
  const [importDone, setImportDone] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBudgetId],
    queryFn: () => activeBudgetId ? base44.entities.Transaction.filter({ budget_id: activeBudgetId }) : Promise.resolve([]),
    enabled: !!activeBudgetId && importDone,
  });

  const salaryTxns = transactions.filter(t => t.category === "Salary");
  const loanTxns = transactions.filter(t => ["Loan Payment", "Mortgage"].includes(t.category));
  const subTxns = transactions.filter(t => t.category === "Subscriptions");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
          <Settings size={20} style={{ color: "#4ade80" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Setup</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Configure your household and import bank data</p>
        </div>
      </div>

      <HouseholdForm onBudgetCreated={(b) => setActiveBudgetId(b.id)} />
      <CSVImporter budgetId={activeBudgetId} onImported={() => setImportDone(true)} />

      {importDone && transactions.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#f1f5f9" }}>Quick Stats Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ background: "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>💵 Detected Salary</div>
              <div className="text-lg font-bold" style={{ color: "#4ade80" }}>
                {salaryTxns.length > 0 ? formatEUR(salaryTxns.reduce((s, t) => s + t.amount, 0)) : "Not found"}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{salaryTxns.length} entries</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>🏦 Loan/Mortgage Payments</div>
              <div className="text-lg font-bold" style={{ color: "#f87171" }}>
                {loanTxns.length > 0 ? formatEUR(loanTxns.reduce((s, t) => s + t.amount, 0)) : "None detected"}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{loanTxns.length} payments</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>📺 Recurring Subscriptions</div>
              <div className="text-lg font-bold" style={{ color: "#f472b6" }}>
                {subTxns.length > 0 ? formatEUR(subTxns.reduce((s, t) => s + t.amount, 0)) : "None detected"}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{subTxns.length} found</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}