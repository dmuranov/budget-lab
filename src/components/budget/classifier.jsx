// Flow classification engine for Spanish bank statements

function matchesAny(text, keywords) {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return keywords.some(kw => {
    const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return lower.includes(kwNorm);
  });
}

// INCOME FLOW RULES
const INCOME_FLOWS = [
  { flowType: "SALARY", category: "Salary", keywords: ["nomina", "nómina", "pago nomina", "salario", "sueldo", "abono nomina"] },
  { flowType: "PENSION", category: "Pension/Benefits", keywords: ["pension", "pensión", "jubilacion", "jubilación", "prestacion", "seg social", "seguridad social", "inss"] },
  { flowType: "FREELANCE_INCOME", category: "Freelance Income", keywords: ["factura", "honorarios", "ingreso profesional", "autonomo", "autónomo"] },
  { flowType: "RENTAL_INCOME", category: "Rental Income", keywords: ["alquiler recibido", "renta recibida", "ingreso alquiler", "arrendamiento"] },
  { flowType: "TRANSFER_IN", category: "Transfer In", keywords: ["transferencia recibida", "transfer recibida", "ingreso transferencia", "traspaso recibido", "bizum recibido"] },
  { flowType: "REFUND", category: "Refund", keywords: ["devolucion", "devolución", "reembolso", "anulacion", "anulación", "retrocesion"] },
  { flowType: "INTEREST_EARNED", category: "Interest Earned", keywords: ["liquidacion intereses", "intereses abonados", "rendimiento", "interes cuenta", "remuneracion cuenta"] },
  { flowType: "OTHER_INCOME", category: "Other Income", keywords: ["ingreso efectivo", "ingreso cheque", "dividendo", "premio"] },
];

// EXPENSE FLOW RULES
const EXPENSE_FLOWS = [
  { flowType: "INTERNAL_TRANSFER", category: "Internal Transfer", keywords: ["traspaso entre cuentas", "traspaso propio", "traspaso a cuenta", "traspaso de cuenta"], isRecurring: false },
  { flowType: "MORTGAGE", category: "Mortgage", keywords: ["hipoteca", "cuota hipoteca", "pago hipoteca", "amortizacion hipoteca"], isRecurring: true },
  { flowType: "LOAN_PAYMENT", category: "Loan Payment", keywords: ["prestamo", "préstamo", "cuota prestamo", "amortizacion", "amortización", "pago prestamo", "credito personal", "crédito personal", "cofidis", "cetelem", "pepper", "sofinco", "creditea"], isRecurring: true },
  { flowType: "CREDIT_CARD_PAYMENT", category: "Credit Card", keywords: ["pago tarjeta", "liquidacion tarjeta", "liquidación tarjeta", "extracto tarjeta", "cargo tarjeta"], isRecurring: false },
  { flowType: "INSURANCE_PAYMENT", category: "Insurance", keywords: ["seguro", "prima seguro", "seguro hogar", "seguro coche", "seguro vida", "seguro salud", "mapfre", "linea directa", "generali", "axa", "allianz", "zurich", "pelayo", "reale", "mutua"], isRecurring: true },
  { flowType: "TAX_PAYMENT", category: "Taxes", keywords: ["hacienda", "aeat", "agencia tributaria", "impuesto", "irpf", "iva", "ibi", "tasa", "modelo 303", "modelo 100", "recargo"] },
  { flowType: "ATM_WITHDRAWAL", category: "Cash Withdrawal", keywords: ["retirada efectivo", "disposicion efectivo", "cajero", "atm", "reintegro"] },
  { flowType: "BANK_FEES", category: "Bank Fees", keywords: ["comision", "comisión", "mantenimiento cuenta", "comision tarjeta", "gastos bancarios"] },
  { flowType: "TRANSFER_OUT", category: "Transfer Out", keywords: ["transferencia emitida", "transfer enviada", "traspaso enviado", "bizum enviado", "bizum", "envio bizum"] },
];

// EXPENSE SUB-CLASSIFICATION (for card purchases, recibos, etc.)
const EXPENSE_SUBCATEGORIES = [
  { category: "Groceries", keywords: ["mercadona", "lidl", "carrefour", "aldi", "eroski", "dia %", "alcampo", "hipercor", "ahorramas", "consum", "caprabo", "simply", "bonarea", "gadis", "coviran", "supermercado", "alimentacion", "alimentación"] },
  { category: "Dining Out", keywords: ["restaurante", "restaurant", "cafe", "cafeteria", "bar ", "starbucks", "mcdonald", "burger", "pizza", "glovo", "uber eats", "just eat", "deliveroo", "telepizza", "dominos", "100montaditos", "vips", "goiko", "lateral", "tgb", "foster", "asador", "marisqueria", "cerveceria", "taberna"] },
  { category: "Housing", keywords: ["alquiler", "comunidad", "comunidad propietarios", "finca", "inmobiliaria"] },
  { category: "Utilities", keywords: ["endesa", "iberdrola", "naturgy", "movistar", "vodafone", "orange", "telefonica", "yoigo", "masmovil", "o2", "digi", "pepephone", "lowi", "simyo", "agua", "canal isabel", "luz", "gas natural", "fibra", "internet", "electricidad"] },
  { category: "Subscriptions", keywords: ["netflix", "spotify", "hbo", "disney", "amazon prime", "gym", "apple", "youtube premium", "dazn", "crunchyroll", "audible", "notion", "chatgpt", "openai", "adobe", "microsoft 365", "icloud", "playstation", "xbox", "nintendo", "patreon", "substack", "medium", "tidal", "paramount"] },
  { category: "Shopping", keywords: ["amazon", "aliexpress", "zara", "el corte ingles", "primark", "ikea", "decathlon", "mediamarkt", "fnac", "leroy merlin", "shein", "temu", "wallapop", "bershka", "mango", "pull bear", "massimo dutti", "uniqlo", "h&m", "pccomponentes", "worten", "bricolaje", "tienda"] },
  { category: "Transport", keywords: ["gasolina", "gasolinera", "repsol", "cepsa", "bp", "shell", "taxi", "uber", "cabify", "bolt", "freenow", "metro", "bus", "emt", "renfe", "parking", "parquimetro", "peaje", "autopista", "alsa", "avanza", "blablacar", "acciona", "tier", "lime", "patinete"] },
  { category: "Health", keywords: ["farmacia", "doctor", "hospital", "dentista", "clinica", "adeslas", "sanitas", "asisa", "dkv", "optica", "óptica", "fisioterapia", "fisio", "psicologo", "psicólogo", "veterinario", "laboratorio"] },
  { category: "Education", keywords: ["udemy", "coursera", "academia", "colegio", "guarderia", "universidad", "formacion", "formación", "masterclass", "libro", "libreria", "casa del libro"] },
  { category: "Entertainment", keywords: ["cine", "teatro", "concierto", "festival", "museo", "parque atracciones", "zoo", "acuario", "steam", "playstation store", "xbox store", "ticketmaster", "entradas", "ocio", "bowling", "karaoke", "escape room"] },
  { category: "Children", keywords: ["juguete", "toys r us", "prenatal", "pañales", "bebe", "bebé", "mothercare", "imaginarium", "guardería"] },
  { category: "Travel", keywords: ["hotel", "vuelo", "flight", "airbnb", "booking", "ryanair", "iberia", "vueling", "easyjet", "expedia", "kayak", "skyscanner", "maleta", "alojamiento", "hostal", "parador", "rentalcars", "sixt", "europcar", "avis"] },
  { category: "Personal Care", keywords: ["peluqueria", "peluquería", "barberia", "barbería", "estetica", "estética", "cosmetica", "cosmética", "sephora", "druni", "primor", "rituals", "perfumeria", "manicura", "spa", "masaje"] },
];

export function classifyTransaction(description, direction) {
  const flows = direction === "income" ? INCOME_FLOWS : EXPENSE_FLOWS;
  
  for (const rule of flows) {
    if (matchesAny(description, rule.keywords)) {
      return {
        flowType: rule.flowType,
        category: rule.category,
        isRecurring: rule.isRecurring || false,
      };
    }
  }

  // For expenses, try sub-classification (card purchases, recibos)
  if (direction === "expense") {
    // Check for recibo/domiciliacion/compra patterns
    const isCardOrRecibo = matchesAny(description, [
      "recibo", "domiciliacion", "domiciliación", "adeudo",
      "compra tarjeta", "pago con tarjeta", "compra en", "pago en", "tpv", "contactless",
      "visa", "mastercard"
    ]);

    for (const sub of EXPENSE_SUBCATEGORIES) {
      if (matchesAny(description, sub.keywords)) {
        return {
          flowType: isCardOrRecibo ? "CARD_PURCHASE" : "DIRECT_DEBIT",
          category: sub.category,
          isRecurring: ["Utilities", "Subscriptions", "Housing"].includes(sub.category),
        };
      }
    }

    if (isCardOrRecibo) {
      return { flowType: "CARD_PURCHASE", category: "Uncategorized", isRecurring: false };
    }
  }

  return {
    flowType: "UNKNOWN",
    category: "Uncategorized",
    isRecurring: false,
  };
}

// Detect recurring by scanning for similar descriptions appearing 2+ times
export function detectRecurring(transactions) {
  const descCounts = {};
  transactions.forEach(t => {
    const key = t.description.toLowerCase().substring(0, 30);
    descCounts[key] = (descCounts[key] || 0) + 1;
  });

  transactions.forEach(t => {
    const key = t.description.toLowerCase().substring(0, 30);
    if (descCounts[key] >= 2) {
      t.is_recurring = true;
    }
  });
}

// Detect salary from transactions
export function detectSalaries(transactions) {
  const salaryTxns = transactions.filter(t =>
    t.direction === "income" && t.category === "Salary"
  );

  if (salaryTxns.length === 0) return [];

  // Group by similar amounts (±10%)
  const groups = [];
  for (const txn of salaryTxns) {
    let matched = false;
    for (const group of groups) {
      const avg = group.reduce((s, t) => s + t.amount, 0) / group.length;
      if (Math.abs(txn.amount - avg) / avg <= 0.1) {
        group.push(txn);
        matched = true;
        break;
      }
    }
    if (!matched) groups.push([txn]);
  }

  return groups.map(group => ({
    amount: Math.round(group.reduce((s, t) => s + t.amount, 0) / group.length * 100) / 100,
    count: group.length,
    description: group[0].description,
  }));
}