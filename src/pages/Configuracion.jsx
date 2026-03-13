import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Settings, RefreshCw, Trash2 } from "lucide-react";
import { formatEUR } from "../components/budget/constants";
import { classifyTransaction, classifyWithAI } from "../components/budget/classifier";
import { Button } from "@/components/ui/button";
import HouseholdForm from "../components/setup/HouseholdForm";
import CSVImporter from "../components/setup/CSVImporter";
import APIKeySection from "../components/setup/APIKeySection";
import { useAppSettings } from "../components/budget/useAppSettings";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Configuracion() {
  const queryClient = useQueryClient();
  const { getSetting } = useAppSettings();
  const [activeBudgetId, setActiveBudgetId] = useState(null);
  const [importDone, setImportDone] = useState(false);
  const [reclasificando, setReclasificando] = useState(false);
  const [reclasificadoCount, setReclasificadoCount] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBudgetId],
    queryFn: () => activeBudgetId ? base44.entities.Transaction.filter({ budget_id: activeBudgetId }) : Promise.resolve([]),
    enabled: !!activeBudgetId && importDone,
  });

  const nominas = transactions.filter(t => t.category === "Nómina");
  const obligaciones = transactions.filter(t => t.is_fixed && t.direction === "gasto");
  const recurrentes = transactions.filter(t => t.is_recurring && t.direction === "gasto");
  const sinClasificar = transactions.filter(t => t.category === "Sin Clasificar");

  const handleReclasificar = async () => {
    setReclasificando(true);
    setReclasificadoCount(null);

    // Obtener TODOS los movimientos de la base de datos (sin filtro de presupuesto)
    const allTxns = await base44.entities.Transaction.list("date", 5000);
    let count = 0;

    // Procesar en batches de 20
    for (let i = 0; i < allTxns.length; i += 20) {
      const batch = allTxns.slice(i, i + 20);
      await Promise.all(batch.map(async (t) => {
        const { flowType, category, isRecurring, isFixed } = classifyTransaction(t.description, t.direction);
        if (category !== t.category || flowType !== t.flow_type || isRecurring !== t.is_recurring || isFixed !== t.is_fixed) {
          await base44.entities.Transaction.update(t.id, {
            category,
            flow_type: flowType,
            is_recurring: isRecurring,
            is_fixed: isFixed,
          });
          count++;
        }
      }));
    }

    // Paso 2: IA para los que siguen Sin Clasificar
    const stillUnclassified = allTxns.filter(t => {
      const { category } = classifyTransaction(t.description, t.direction);
      return category === "Sin Clasificar";
    });

    if (stillUnclassified.length > 0) {
      setReclasificadoCount(count); // progreso parcial
      const apiKey = getSetting("claude_api_key");
      for (let i = 0; i < stillUnclassified.length; i += 30) {
        const batch = stillUnclassified.slice(i, i + 30);
        const aiCategories = await classifyWithAI(batch, base44, apiKey);
        await Promise.all(batch.map(async (t, idx) => {
          if (aiCategories[idx] && aiCategories[idx] !== "Sin Clasificar" && aiCategories[idx] !== t.category) {
            await base44.entities.Transaction.update(t.id, { category: aiCategories[idx] });
            count++;
          }
        }));
      }
    }

    setReclasificadoCount(count);
    setReclasificando(false);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setDeleteMsg(null);
    const res = await base44.functions.invoke('deleteAllTransactions');
    setDeleting(false);
    setDeleteMsg(res.data.message || res.data.error);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

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

      {/* Botón reclasificar */}
      <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>🔄 Reclasificar Movimientos</h2>
        <p className="text-xs mb-4" style={{ color: "#64748b" }}>
          Aplica la lógica de clasificación actualizada a TODOS los movimientos existentes en la base de datos. Útil tras actualizar las reglas.
        </p>
        <Button onClick={handleReclasificar} disabled={reclasificando} size="sm"
          style={{ background: reclasificando ? "#1a2030" : "#4ade80", color: "#0b0e13" }}>
          <RefreshCw size={14} className={reclasificando ? "animate-spin mr-2" : "mr-2"} />
          {reclasificando ? "Reclasificando..." : "🔄 Reclasificar todos los movimientos"}
        </Button>
        {reclasificadoCount !== null && (
          <p className="text-xs mt-3" style={{ color: "#4ade80" }}>
            ✅ {reclasificadoCount} movimientos actualizados
          </p>
        )}
      </div>

      {/* Eliminar todas las transacciones */}
      <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(239,68,68,0.2)" }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: "#f87171" }}>🗑️ Zona de Peligro</h2>
        <p className="text-xs mb-4" style={{ color: "#64748b" }}>
          Elimina todas las transacciones de la base de datos. Esta acción no se puede deshacer.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash2 size={14} className="mr-2" />
              {deleting ? "Eliminando..." : "Eliminar todas las transacciones"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.1)" }}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: "#f87171" }}>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: "#94a3b8" }}>
                Esta acción eliminará permanentemente TODAS las transacciones. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel style={{ background: "#1a2030", color: "#f1f5f9", border: "none" }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll} style={{ background: "#ef4444", color: "white" }}>
                Sí, eliminar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {deleteMsg && <p className="text-xs mt-3" style={{ color: "#4ade80" }}>✅ {deleteMsg}</p>}
      </div>

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