import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Settings, RefreshCw } from "lucide-react";
import { formatEUR } from "../components/budget/constants";
import { classifyTransaction } from "../components/budget/classifier";
import { Button } from "@/components/ui/button";
import HouseholdForm from "../components/setup/HouseholdForm";
import CSVImporter from "../components/setup/CSVImporter";

export default function Configuracion() {
  const [activeBudgetId, setActiveBudgetId] = useState(null);
  const [importDone, setImportDone] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBudgetId],
    queryFn: () => activeBudgetId ? base44.entities.Transaction.filter({ budget_id: activeBudgetId }) : Promise.resolve([]),
    enabled: !!activeBudgetId && importDone,
  });

  const nominas = transactions.filter(t => t.category === "Nómina");
  const obligaciones = transactions.filter(t => t.is_fixed && t.direction === "gasto");
  const recurrentes = transactions.filter(t => t.is_recurring && t.direction === "gasto");
  const sinClasificar = transactions.filter(t => t.category === "Sin Clasificar");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
          <Settings size={20} style={{ color: "#4ade80" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>⚙️ Configuración</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Datos del hogar e importación de extractos bancarios</p>
        </div>
      </div>

      <HouseholdForm onBudgetCreated={(b) => setActiveBudgetId(b.id)} />
      <CSVImporter budgetId={activeBudgetId} onImported={() => setImportDone(true)} />

      {/* Detección automática tras importar */}
      {importDone && transactions.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#f1f5f9" }}>🔍 Detección Automática</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ background: "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>💵 Nóminas detectadas</div>
              <div className="text-lg font-bold" style={{ color: "#4ade80" }}>
                {nominas.length > 0 ? formatEUR(nominas.reduce((s, t) => s + t.amount, 0)) : "No detectadas"}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{nominas.length} abonos</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>🔒 Obligaciones fijas detectadas</div>
              <div className="text-lg font-bold" style={{ color: "#f87171" }}>
                {obligaciones.length > 0 ? formatEUR(obligaciones.reduce((s, t) => s + t.amount, 0)) + "/mes" : "Ninguna"}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>{obligaciones.length} cargos fijos</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>🔄 Gastos recurrentes</div>
              <div className="text-lg font-bold" style={{ color: "#f472b6" }}>{recurrentes.length}</div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>suscripciones/servicios</div>
            </div>
            <div className="rounded-lg p-4"
              style={{ background: sinClasificar.length > 0 ? "rgba(251,191,36,0.1)" : "#1a2030" }}>
              <div className="text-xs mb-1" style={{ color: "#64748b" }}>❓ Sin clasificar</div>
              <div className="text-lg font-bold" style={{ color: sinClasificar.length > 0 ? "#fbbf24" : "#4ade80" }}>
                {sinClasificar.length}
              </div>
              <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                {sinClasificar.length > 0 ? "revísalos en Movimientos" : "¡Todo clasificado!"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}