import * as XLSX from "xlsx";
import { classifyTransaction, detectRecurring } from "./classifier";

function parseEurAmount(str) {
  if (!str || typeof str !== "string") return NaN;
  let s = str.trim().replace(/[€$£\s]/g, "");
  const isNeg = s.startsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  s = s.replace(/[()+-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const num = parseFloat(s);
  return isNaN(num) ? NaN : (isNeg ? -num : num);
}

function detectSeparator(text) {
  const firstLines = text.split("\n").slice(0, 5).join("\n");
  const semicolons = (firstLines.match(/;/g) || []).length;
  const commas = (firstLines.match(/,/g) || []).length;
  const tabs = (firstLines.match(/\t/g) || []).length;
  if (semicolons > commas && semicolons > tabs) return ";";
  if (tabs > commas) return "\t";
  return ",";
}

function findCol(headers, names) {
  const lower = headers.map(h => h.toLowerCase().trim().replace(/["\s]/g, ""));
  for (const name of names) {
    const idx = lower.findIndex(h => h.includes(name.toLowerCase().replace(/\s/g, "")));
    if (idx !== -1) return idx;
  }
  return -1;
}

function splitCSVLine(line, sep) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === sep && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, "")); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

function parseDateToISO(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(dateVal);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(dateVal).trim();
  const m = s.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    let year = m[3];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }
  return s;
}

function parseHolders(str) {
  // "FABIOLA*ARNILLAS MANZANARES Y DANIJEL*MURANOVIC VIDACKOVIC"
  return str.split(/\s+Y\s+/).map(h => {
    const parts = h.replace(/\*/g, " ").trim().split(/\s+/);
    // Capitalize: first word is first name, rest are surnames
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  });
}

function parseSabadellPeriod(str) {
  // "Desde 01 / 01 / 2026 hasta 12 / 03 / 2026."
  const matches = str.match(/(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})/g);
  if (matches && matches.length >= 2) {
    const fmt = (s) => s.replace(/\s/g, "");
    return `${fmt(matches[0])} — ${fmt(matches[1])}`;
  }
  return str.replace(/Desde|hasta|\./gi, "").trim();
}

export function parseSabadellXLS(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  let headerRowIdx = -1;
  const metadata = { account: null, holders: [], period: null, currency: "EUR" };

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i].map(c => String(c || "").trim());
    const rowStr = row.join(" ").toLowerCase();

    if (rowStr.includes("operativa") || (rowStr.includes("concepto") && rowStr.includes("importe"))) {
      headerRowIdx = i;
      break;
    }

    const first = row[0].toLowerCase();
    if (first.startsWith("cuenta")) metadata.account = String(row[1] || "").trim();
    else if (first.startsWith("titular")) metadata.holders = parseHolders(String(row[1] || "").trim());
    else if (first.startsWith("selecci") || first.startsWith("período") || first.startsWith("periodo")) {
      metadata.period = parseSabadellPeriod(String(row[1] || "").trim());
    }
    else if (first.startsWith("divisa")) metadata.currency = String(row[1] || "").trim();
  }

  if (headerRowIdx === -1) {
    return { transactions: [], error: "No se encontraron las cabeceras del extracto. ¿Es un extracto Banco Sabadell?", metadata };
  }

  const headers = rows[headerRowIdx].map(c => String(c || "").toLowerCase().trim());
  const dateCol = headers.findIndex(h => h.includes("operativa") || h.includes("fecha"));
  const descCol = headers.findIndex(h => h.includes("concepto"));
  // CRÍTICO: solo columna "Importe" — NO importar "Saldo" como transacción
  const amountCol = headers.findIndex(h => h.trim() === "importe" || (h.includes("importe") && !h.includes("saldo")));
  const saldoCol = headers.findIndex(h => h.trim() === "saldo" || h.includes("saldo"));
  const ref2Col = headers.findIndex(h => h.includes("referencia 2") || h.includes("referencia2") || (h.includes("ref") && headers.filter(x => x.includes("ref")).indexOf(h) === 1));

  if (dateCol === -1 || descCol === -1 || amountCol === -1) {
    return { transactions: [], error: "No se encontraron columnas: F.Operativa, Concepto, Importe", metadata };
  }

  const transactions = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const dateVal = row[dateCol];
    const desc = String(row[descCol] || "").trim();
    const amountVal = row[amountCol];
    // Saldo: solo para calcular saldo inicial, NO genera transacción
    const saldoVal = saldoCol !== -1 ? row[saldoCol] : undefined;
    const cardRef = ref2Col !== -1 ? String(row[ref2Col] || "").trim() : "";

    if (!dateVal || !desc) continue;

    const parsedDate = parseDateToISO(dateVal);
    if (!parsedDate) continue;

    let originalAmount;
    if (typeof amountVal === "number") {
      originalAmount = amountVal;
    } else {
      originalAmount = parseEurAmount(String(amountVal || ""));
    }

    if (isNaN(originalAmount) || originalAmount === 0) continue;

    let balanceAfter = undefined;
    if (saldoVal !== undefined) {
      balanceAfter = typeof saldoVal === "number" ? saldoVal : parseEurAmount(String(saldoVal || ""));
    }

    const direction = originalAmount >= 0 ? "ingreso" : "gasto";
    const amount = Math.abs(originalAmount);

    // Añadir referencia de tarjeta a descripción para clasificación (detectar tarjeta 8014)
    const descForClassify = cardRef ? `${desc} ${cardRef}` : desc;
    const { flowType, category, isRecurring, isFixed } = classifyTransaction(descForClassify, direction);

    transactions.push({
      date: parsedDate,
      description: desc,
      original_amount: originalAmount,
      amount,
      direction,
      flow_type: flowType,
      category,
      is_recurring: isRecurring,
      is_fixed: isFixed,
      who: "shared",
      notes: "",
      balance_after: balanceAfter,
    });
  }

  detectRecurring(transactions);

  // Calcular saldo inicial: última fila (más antigua) = saldo_después - importe
  let startingBalance = null;
  let balanceVerified = null;
  if (transactions.length > 0) {
    const oldest = transactions[transactions.length - 1];
    if (oldest.balance_after !== undefined && !isNaN(oldest.balance_after)) {
      startingBalance = Math.round((oldest.balance_after - oldest.original_amount) * 100) / 100;

      // Verificar que saldo inicial + todos los movimientos ≈ saldo de la transacción más reciente
      const newest = transactions[0];
      if (newest.balance_after !== undefined && !isNaN(newest.balance_after)) {
        const totalMovs = transactions.reduce((sum, t) => sum + t.original_amount, 0);
        const calculatedBalance = Math.round((startingBalance + totalMovs) * 100) / 100;
        const diff = Math.abs(calculatedBalance - newest.balance_after);
        balanceVerified = diff <= 0.05;
        console.log(`Saldo inicial: ${startingBalance}€ | Calculado: ${calculatedBalance}€ | Real: ${newest.balance_after}€ | Diff: ${diff.toFixed(2)}€ | OK: ${balanceVerified}`);
      }
    }
  }

  return { transactions, error: null, metadata, startingBalance, balanceVerified };
}

export function parseCSV(text) {
  const sep = detectSeparator(text);
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 2) return { transactions: [], error: "El archivo está vacío o no tiene datos", metadata: null };

  const headers = splitCSVLine(lines[0], sep);

  const dateCol = findCol(headers, ["fecha", "date", "f.operacion", "f.valor", "fechaoperacion", "fechavalor"]);
  const descCol = findCol(headers, ["concepto", "descripcion", "descripción", "movimiento", "detalle", "referencia", "observaciones", "texto", "narrative"]);
  const amountCol = findCol(headers, ["importe", "amount", "cantidad", "valor", "monto", "importe(eur)", "importe(€)"]);
  const incomeCol = findCol(headers, ["haber", "abono", "ingreso", "credit", "entrada"]);
  const expenseCol = findCol(headers, ["debe", "cargo", "gasto", "debit", "salida", "pago"]);

  if (dateCol === -1) return { transactions: [], error: "No se encontró columna de fecha. Se esperaba: fecha, date, f.operacion, etc.", metadata: null };
  if (descCol === -1) return { transactions: [], error: "No se encontró columna de descripción. Se esperaba: concepto, descripcion, etc.", metadata: null };
  if (amountCol === -1 && incomeCol === -1 && expenseCol === -1) {
    return { transactions: [], error: "No se encontraron columnas de importe. Se esperaba: importe, haber/debe, etc.", metadata: null };
  }

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], sep);
    if (cols.length < 3) continue;

    const dateStr = (cols[dateCol] || "").trim();
    const desc = (cols[descCol] || "").trim();
    if (!dateStr || !desc) continue;

    let originalAmount;
    if (amountCol !== -1) {
      originalAmount = parseEurAmount(cols[amountCol]);
    } else {
      const income = parseEurAmount(cols[incomeCol] || "0");
      const expense = parseEurAmount(cols[expenseCol] || "0");
      if (!isNaN(income) && income > 0) originalAmount = income;
      else if (!isNaN(expense) && expense !== 0) originalAmount = expense < 0 ? expense : -expense;
      else originalAmount = 0;
    }

    if (isNaN(originalAmount) || originalAmount === 0) continue;

    const direction = originalAmount >= 0 ? "ingreso" : "gasto";
    const amount = Math.abs(originalAmount);
    const { flowType, category, isRecurring, isFixed } = classifyTransaction(desc, direction);

    const parsedDate = parseDateToISO(dateStr) || dateStr;

    transactions.push({
      date: parsedDate,
      description: desc,
      original_amount: originalAmount,
      amount,
      direction,
      flow_type: flowType,
      category,
      is_recurring: isRecurring,
      is_fixed: isFixed,
      who: "shared",
      notes: "",
    });
  }

  detectRecurring(transactions);
  return { transactions, error: null, metadata: null };
}