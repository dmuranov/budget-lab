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

export function parseCSV(text) {
  const sep = detectSeparator(text);
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 2) return { transactions: [], error: "El archivo está vacío o no tiene datos" };

  const headers = splitCSVLine(lines[0], sep);

  const dateCol = findCol(headers, ["fecha", "date", "f.operacion", "f.valor", "fechaoperacion", "fechavalor"]);
  const descCol = findCol(headers, ["concepto", "descripcion", "descripción", "movimiento", "detalle", "referencia", "observaciones", "texto", "narrative"]);
  const amountCol = findCol(headers, ["importe", "amount", "cantidad", "valor", "monto", "importe(eur)", "importe(€)"]);
  const incomeCol = findCol(headers, ["haber", "abono", "ingreso", "credit", "entrada"]);
  const expenseCol = findCol(headers, ["debe", "cargo", "gasto", "debit", "salida", "pago"]);

  if (dateCol === -1) return { transactions: [], error: "No se encontró columna de fecha. Se esperaba: fecha, date, f.operacion, etc." };
  if (descCol === -1) return { transactions: [], error: "No se encontró columna de descripción. Se esperaba: concepto, descripcion, etc." };
  if (amountCol === -1 && incomeCol === -1 && expenseCol === -1) {
    return { transactions: [], error: "No se encontraron columnas de importe. Se esperaba: importe, haber/debe, etc." };
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

    // Parsear fecha española: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
    let parsedDate = dateStr;
    const dateMatch = dateStr.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      let year = dateMatch[3];
      if (year.length === 2) year = "20" + year;
      parsedDate = `${year}-${month}-${day}`;
    }

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
  return { transactions, error: null };
}