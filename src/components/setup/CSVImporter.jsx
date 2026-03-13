import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertTriangle } from "lucide-react";
import { parseCSV } from "../budget/csvParser";
import ImportPreview from "./ImportPreview";

export default function CSVImporter({ budgetId, onImported }) {
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = parseCSV(evt.target.result);
      if (result.error) { setError(result.error); setParsedData(null); }
      else { setParsedData(result.transactions); }
    };
    reader.readAsText(file, "UTF-8");
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
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Upload size={32} className="mx-auto mb-3" style={{ color: "#64748b" }} />
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
              {fileName || "Haz clic para subir tu extracto CSV"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Compatible con CaixaBank, Santander, BBVA, ING, Openbank, Revolut, N26 y otros bancos españoles
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
        <ImportPreview
          transactions={parsedData}
          budgetId={budgetId}
          onCancel={() => { setParsedData(null); setFileName(""); }}
          onImported={onImported}
        />
      )}
    </div>
  );
}