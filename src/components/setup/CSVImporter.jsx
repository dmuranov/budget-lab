import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertTriangle } from "lucide-react";
import { parseCSV, parseSabadellXLS } from "../budget/csvParser";
import { detectSalaries, classifyWithAI } from "../budget/classifier";
import ImportPreview from "./ImportPreview";
import AccountInfoCard from "./AccountInfoCard";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "../budget/useAppSettings";

export default function CSVImporter({ budgetId, onImported }) {
  const { getSetting } = useAppSettings();
  const [parsedData, setParsedData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const fileRef = useRef();

  const processWithAI = async (transactions) => {
    const sinClasificar = transactions.filter(t => t.category === "Sin Clasificar");
    if (sinClasificar.length === 0) return transactions;

    setAiProcessing(true);
    const apiKey = getSetting("claude_api_key");
    try {
      // Enviar en batches de 30
      for (let i = 0; i < sinClasificar.length; i += 30) {
        const batch = sinClasificar.slice(i, i + 30);
        const aiCategories = await classifyWithAI(batch, base44, apiKey);
        batch.forEach((t, idx) => {
          if (aiCategories[idx] && aiCategories[idx] !== "Sin Clasificar") {
            t.category = aiCategories[idx];
            t.ai_classified = true;
          }
        });
      }
    } catch (err) {
      console.error("AI classification failed:", err);
    }
    setAiProcessing(false);
    return transactions;
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setMetadata(null);

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "xls" || ext === "xlsx") {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const result = parseSabadellXLS(evt.target.result);
        if (result.error) { setError(result.error); setParsedData(null); }
        else {
          const txns = await processWithAI(result.transactions, file.name);
          setParsedData(txns); setMetadata(result.metadata);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const result = parseCSV(evt.target.result);
        if (result.error) { setError(result.error); setParsedData(null); }
        else {
          const txns = await processWithAI(result.transactions, file.name);
          setParsedData(txns); setMetadata(result.metadata);
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const handleSampleDownload = () => {
    const csv = `Fecha;Concepto;Importe
01/03/2026;NOMINA EMPRESA ABC;2850,00
02/03/2026;RECIBO ENDESA ENERGIA;-85,30
03/03/2026;COMPRA TARJETA MERCADONA;-127,45
05/03/2026;CUOTA HIPOTECA BANCO;-750,00
07/03/2026;BIZUM ENVIADO JUAN;-25,00
10/03/2026;NETFLIX;-15,99
12/03/2026;ZARA COMPRA ONLINE;-89,90
15/03/2026;SEGURO MAPFRE HOGAR;-32,50
18/03/2026;RECIBO MOVISTAR FIBRA;-49,90
20/03/2026;NOMINA EMPRESA XYZ;2200,00
22/03/2026;TRANSFERENCIA RECIBIDA PEDRO;150,00
25/03/2026;COMPRA TARJETA CARREFOUR;-89,20
26/03/2026;RECIBO GUARDERIA LOS PEQUES;-320,00
28/03/2026;COMISION MANTENIMIENTO;-4,50
30/03/2026;PAGO PRESTAMO COFIDIS;-189,00`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "extracto_ejemplo.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (!budgetId) {
    return (
      <div className="rounded-xl p-6" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "#f1f5f9" }}>📥 Importar Extracto Bancario</h2>
        <p className="text-sm" style={{ color: "#64748b" }}>Primero guarda los datos del hogar para activar la importación.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>📥 Importar Extracto Bancario</h2>
        <button onClick={handleSampleDownload} className="text-xs underline" style={{ color: "#4ade80" }}>
          Descargar CSV de ejemplo
        </button>
      </div>

      {!parsedData ? (
        <div>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-opacity-50 transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFile} className="hidden" />
            <Upload size={32} className="mx-auto mb-3" style={{ color: "#64748b" }} />
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
              {aiProcessing ? "🤖 Clasificando con IA..." : (fileName || "Haz clic para subir tu extracto bancario")}
            </p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Acepta Excel (.xls, .xlsx) y CSV · Compatible con Sabadell, CaixaBank, Santander, BBVA, ING, Openbank y más
            </p>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm p-3 rounded-lg"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}
        </div>
      ) : (
        <div>
          {metadata && <AccountInfoCard metadata={metadata} transactions={parsedData} />}
          <ImportPreview
            transactions={parsedData}
            budgetId={budgetId}
            onCancel={() => { setParsedData(null); setFileName(""); setMetadata(null); }}
            onImported={onImported}
          />
        </div>
      )}
    </div>
  );
}