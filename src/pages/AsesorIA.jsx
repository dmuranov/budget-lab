import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bot, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { formatEUR, NECESIDADES_CATEGORIAS, DESEOS_CATEGORIAS } from "../components/budget/constants";
import BudgetSelector from "../components/budget/BudgetSelector";

export default function AsesorIA() {
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  const [selectedId, setSelectedId] = useState(null);
  const activeId = selectedId || budgets[0]?.id;

  const { data: budgetArr = [] } = useQuery({
    queryKey: ["budget", activeId],
    queryFn: () => activeId ? base44.entities.MonthlyBudget.filter({ id: activeId }) : Promise.resolve([]),
    enabled: !!activeId,
  });
  const budget = budgetArr[0] || null;

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeId],
    queryFn: () => activeId ? base44.entities.Transaction.filter({ budget_id: activeId }, "date", 5000) : Promise.resolve([]),
    enabled: !!activeId,
  });

  const { data: assets = [] } = useQuery({ queryKey: ["assets"], queryFn: () => base44.entities.Asset.list() });
  const { data: metas = [] } = useQuery({ queryKey: ["goals"], queryFn: () => base44.entities.FinancialGoal.list() });

  const [consejo, setConsejo] = useState("");
  const [loading, setLoading] = useState(false);

  const generarConsejo = async () => {
    if (!budget || transactions.length === 0) return;
    setLoading(true);
    setConsejo("");

    const ingresos = transactions.filter(t => t.direction === "ingreso" && t.category !== "Traspaso Interno");
    const gastos = transactions.filter(t => t.direction === "gasto" && t.category !== "Traspaso Interno");
    const totalIngresos = ingresos.reduce((s, t) => s + (t.amount || 0), 0);
    const totalGastos = gastos.reduce((s, t) => s + (t.amount || 0), 0);

    const gastosCat = {};
    gastos.forEach(t => { gastosCat[t.category] = (gastosCat[t.category] || 0) + (t.amount || 0); });

    const ingresosCat = {};
    ingresos.forEach(t => { ingresosCat[t.category] = (ingresosCat[t.category] || 0) + (t.amount || 0); });

    const necesidadesTotal = gastos.filter(t => NECESIDADES_CATEGORIAS.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
    const deseosTotal = gastos.filter(t => DESEOS_CATEGORIAS.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
    const ahorroAmt = totalIngresos - totalGastos;
    const gastosFijos = gastos.filter(t => t.is_fixed);
    const totalFijos = gastosFijos.reduce((s, t) => s + (t.amount || 0), 0);
    const deudaCats = ["Préstamo", "Hipoteca", "Pago Tarjeta Crédito"];
    const totalDeuda = gastos.filter(t => deudaCats.includes(t.category)).reduce((s, t) => s + (t.amount || 0), 0);
    const totalActivos = assets.filter(a => a.type === "asset").reduce((s, a) => s + (a.value || 0), 0);
    const totalPasivos = assets.filter(a => a.type === "liability").reduce((s, a) => s + (a.value || 0), 0);
    const recurrentes = transactions.filter(t => t.is_recurring && t.direction === "gasto").slice(0, 15);
    const topGastos = [...gastos].sort((a, b) => b.amount - a.amount).slice(0, 15);

    const prompt = `Eres un asesor financiero directo y sin rodeos para una familia en Madrid, España. Matrimonio con una hija pequeña. Tienen una cuenta bancaria compartida. Analiza estos datos y da consejos ESPECÍFICOS y accionables. Sé honesto — si gastan demasiado en algo, dilo claro. Responde en español.

FAMILIA:
- ${budget.name_person1 || "Titular 1"}: €${budget.salary_person1 || 0}/mes neto
- ${budget.name_person2 || "Titular 2"}: €${budget.salary_person2 || 0}/mes neto
- Otros ingresos esperados: €${budget.otros_ingresos_esperados || 0}/mes
- Ingresos totales detectados: €${totalIngresos.toFixed(2)}/mes

DESGLOSE DE INGRESOS:
${Object.entries(ingresosCat).map(([k, v]) => `- ${k}: €${v.toFixed(2)}`).join("\n")}

OBLIGACIONES FIJAS MENSUALES:
${gastosFijos.slice(0, 15).map(t => `- ${t.category} (${t.description}): €${t.amount.toFixed(2)}`).join("\n") || "No detectadas"}
- TOTAL FIJO: €${totalFijos.toFixed(2)} (${totalIngresos > 0 ? ((totalFijos / totalIngresos) * 100).toFixed(1) : 0}% de ingresos)
- DISPONIBLE tras fijos: €${(totalIngresos - totalFijos).toFixed(2)}

GASTOS VARIABLES POR CATEGORÍA:
${Object.entries(gastosCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: €${v.toFixed(2)} (${totalIngresos > 0 ? ((v / totalIngresos) * 100).toFixed(1) : 0}%)`).join("\n")}

SITUACIÓN DE DEUDA:
- Pagos mensuales de deuda: €${totalDeuda.toFixed(2)}
- Ratio deuda/ingresos: ${totalIngresos > 0 ? ((totalDeuda / totalIngresos) * 100).toFixed(1) : 0}%

REGLA 50/30/20:
- Necesidades: €${necesidadesTotal.toFixed(2)} (${totalIngresos > 0 ? ((necesidadesTotal / totalIngresos) * 100).toFixed(1) : 0}% — objetivo ≤50%)
- Deseos: €${deseosTotal.toFixed(2)} (${totalIngresos > 0 ? ((deseosTotal / totalIngresos) * 100).toFixed(1) : 0}% — objetivo ≤30%)
- Ahorro: €${ahorroAmt.toFixed(2)} (${totalIngresos > 0 ? ((ahorroAmt / totalIngresos) * 100).toFixed(1) : 0}% — objetivo ≥20%)

PATRIMONIO: €${(totalActivos - totalPasivos).toFixed(2)} (Activos: €${totalActivos.toFixed(2)}, Pasivos: €${totalPasivos.toFixed(2)})

RECURRENTES/SUSCRIPCIONES:
${recurrentes.map(t => `- ${t.description}: €${(t.amount || 0).toFixed(2)}`).join("\n") || "Ninguna detectada"}

TOP 15 GASTOS MÁS GRANDES:
${topGastos.map((t, i) => `${i + 1}. ${t.description} - €${t.amount.toFixed(2)} (${t.category})`).join("\n")}

APUESTAS/JUEGO:
- Gasto mensual en apuestas: €${(gastosCat["Apuestas/Juego"] || 0).toFixed(2)}
- % sobre ingresos: ${totalIngresos > 0 ? (((gastosCat["Apuestas/Juego"] || 0) / totalIngresos) * 100).toFixed(1) : 0}%

GASTOS FAMILIA (BOSNIA/CROACIA):
- Gasto mensual en visitas familiares: €${(gastosCat["Padres de Danijel"] || 0).toFixed(2)}
- Incluye: compras, farmacia, gasolina, restaurantes durante viajes a ver a los padres de Danijel

METAS FINANCIERAS:
${metas.map(m => `- ${m.icon || ""} ${m.name}: €${(m.saved_amount || 0).toFixed(2)}/€${(m.target_amount || 0).toFixed(2)} ahorrado, €${(m.monthly_contribution || 0).toFixed(2)}/mes`).join("\n") || "Sin metas definidas"}

DA TU ANÁLISIS CON ESTA ESTRUCTURA EXACTA:

### 📊 Nota de Salud Financiera
Puntuación sobre 100 con veredicto en una línea.

### 💵 Análisis de Ingresos
¿Son suficientes? ¿Diversificados? Ideas para aumentarlos.

### 🔒 Valoración de Gastos Fijos
¿Son demasiado altos? ¿Cuáles se pueden renegociar? (hipoteca, cambiar a Digi/Lowi, PVPC, etc.)

### ⚖️ Análisis 50/30/20
Comparar real vs ideal. Importes concretos a mover.

### 🔴 Recortar YA
Gastos concretos a eliminar con € de ahorro mensual.

### 🟡 Optimizar
Alternativas españolas concretas: Digi, Lowi, PVPC, Rastreator, marcas blancas, etc.

### 🔄 Auditoría de Suscripciones
Qué cancelar o compartir.

### 👶 Gastos de la Hija
Análisis específico de educación, ropa, juguetes.

### 💳 Estrategia de Deuda
Avalancha vs bola de nieve con calendario. ¿Amortizar hipoteca?

### 💰 Plan de Ahorro e Inversión
Fondo emergencia (Trade Republic, MyInvestor), inversión indexada (MyInvestor, Indexa Capital, MSCI World), plan de pensiones (deducción 1.500€/año).

### 📈 Consejos Fiscales España
Plan de pensiones, deducción maternidad, deducciones Comunidad de Madrid, declaración conjunta vs individual.

### 🎰 Apuestas
Si hay gasto en apuestas, ser directo sobre el impacto real en el presupuesto familiar. Dar el coste anual proyectado. No moralizar pero sí cuantificar exactamente cuánto se podría ahorrar o invertir con ese dinero.

### 👨‍👩‍👦 Viajes Familiares
Los gastos en Bosnia/Croacia son visitas a los padres de Danijel. No recomendar recortarlos sino optimizarlos: viajar en temporada baja, comprar vuelos con antelación, sacar efectivo en cajeros sin comisión (Revolut/N26), etc.

### 🎯 5 Acciones para Esta Semana
5 pasos concretos con € objetivo.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setConsejo(result);
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
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>🤖 Asesor Financiero IA</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>Análisis personalizado · Usa más créditos de integración</p>
          </div>
        </div>
        <BudgetSelector value={activeId} onChange={setSelectedId} />
      </div>

      {!consejo && !loading && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-5xl mb-4 block">🤖</span>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Obtener Asesoramiento Financiero Personalizado</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#64748b" }}>
            La IA analizará vuestros ingresos, gastos, deuda, metas y patrimonio para daros consejos específicos adaptados a vuestra situación en Madrid.
          </p>
          <Button onClick={generarConsejo}
            disabled={!budget || transactions.length === 0}
            className="px-8 py-3 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "#0b0e13" }}>
            🤖 Obtener Asesoramiento con IA
          </Button>
          {(!budget || transactions.length === 0) && (
            <p className="text-xs mt-3" style={{ color: "#f87171" }}>Primero importa movimientos en Configuración</p>
          )}
        </div>
      )}

      {loading && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#4ade80" }} />
          <p className="text-sm" style={{ color: "#94a3b8" }}>Analizando vuestras finanzas...</p>
        </div>
      )}

      {consejo && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={generarConsejo} variant="outline" size="sm" className="border-0"
              style={{ background: "#151a22", color: "#94a3b8" }}>
              <RefreshCw size={14} className="mr-2" /> Regenerar Consejo
            </Button>
          </div>
          <div className="rounded-xl p-6 md:p-8" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-sm leading-relaxed" style={{ color: "#f1f5f9" }}>
              <ReactMarkdown
                components={{
                  h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: "#4ade80" }}>{children}</h3>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mt-8 mb-4" style={{ color: "#4ade80" }}>{children}</h2>,
                  strong: ({ children }) => <strong style={{ color: "#f1f5f9" }}>{children}</strong>,
                  li: ({ children }) => <li className="ml-4 mb-1" style={{ color: "#94a3b8" }}>{children}</li>,
                  p: ({ children }) => <p className="mb-3" style={{ color: "#94a3b8" }}>{children}</p>,
                }}
              >{consejo}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}