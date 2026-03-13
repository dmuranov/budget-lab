// Motor de clasificación de movimientos para extractos bancarios españoles

function matchesAny(text, keywords) {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return keywords.some(kw => {
    const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return lower.includes(kwNorm);
  });
}

// FLUJOS DE INGRESO
const INCOME_FLOWS = [
  { flowType: "NÓMINA", category: "Nómina", isRecurring: true, isFixed: true,
    keywords: ["nomina", "nómina", "pago nomina", "salario", "sueldo", "abono nomina", "pago salario"] },
  { flowType: "PENSIÓN", category: "Pensión/Prestación", isRecurring: true,
    keywords: ["pension", "pensión", "jubilacion", "jubilación", "prestacion", "prestación", "seg social", "seguridad social", "inss", "desempleo", "paro", "sepe", "baja", "maternidad", "paternidad", "subsidio"] },
  { flowType: "INGRESO_FREELANCE", category: "Ingreso Profesional",
    keywords: ["factura", "honorarios", "ingreso profesional", "autonomo", "autónomo"] },
  { flowType: "INGRESO_ALQUILER", category: "Ingreso Alquiler",
    keywords: ["alquiler recibido", "renta recibida", "ingreso alquiler", "arrendamiento"] },
  { flowType: "TRANSFERENCIA_RECIBIDA", category: "Transferencia Recibida",
    keywords: ["transferencia recibida", "transferencia a favor", "transfer recibida", "ingreso transferencia", "traspaso recibido", "bizum recibido", "ingreso bizum", "bizum a favor", "bizum de"] },
  { flowType: "DEVOLUCIÓN", category: "Devolución",
    keywords: ["devolucion", "devolución", "reembolso", "anulacion", "anulación", "retrocesion", "abono por", "rectificacion", "cashback"] },
  { flowType: "INTERESES", category: "Intereses",
    keywords: ["liquidacion intereses", "intereses abonados", "rendimiento", "interes cuenta", "remuneracion cuenta", "intereses"] },
  { flowType: "OTRO_INGRESO", category: "Otro Ingreso",
    keywords: ["ingreso efectivo", "ingreso cheque", "dividendo", "premio", "loteria", "lotería"] },
];

// FLUJOS DE GASTO
const EXPENSE_FLOWS = [
  { flowType: "TRASPASO_INTERNO", category: "Traspaso Interno", isRecurring: false, isFixed: false,
    keywords: ["traspaso entre cuentas", "traspaso propio", "traspaso a cuenta", "traspaso de cuenta", "ahorro programado"] },
  { flowType: "HIPOTECA", category: "Hipoteca", isRecurring: true, isFixed: true,
    keywords: ["hipoteca", "cuota hipoteca", "pago hipoteca", "amortizacion hipoteca", "amortización hipoteca", "cuota hipoteca"] },
  { flowType: "PRÉSTAMO", category: "Préstamo", isRecurring: true, isFixed: true,
    keywords: ["prestamo", "préstamo", "cuota prestamo", "amortizacion", "amortización", "pago prestamo", "credito personal", "crédito personal", "cofidis", "cetelem", "pepper", "sofinco", "creditea", "vivus", "moneyman", "zaplo"] },
  { flowType: "PAGO_TARJETA", category: "Pago Tarjeta Crédito", isRecurring: true, isFixed: false,
    keywords: ["pago tarjeta", "liquidacion tarjeta", "liquidación tarjeta", "extracto tarjeta", "cargo tarjeta"] },
  { flowType: "SEGUROS", category: "Seguros", isRecurring: true, isFixed: true,
    keywords: ["seguro", "prima seguro", "mapfre", "linea directa", "generali", "axa", "allianz", "zurich", "pelayo", "reale", "mutua", "adeslas", "sanitas", "asisa", "dkv"] },
  { flowType: "IMPUESTOS", category: "Impuestos/Tasas",
    keywords: ["hacienda", "aeat", "agencia tributaria", "impuesto", "irpf", "iva", "ibi", "tasa", "modelo", "recargo", "multa", "ayuntamiento"] },
  { flowType: "CAJERO", category: "Efectivo",
    keywords: ["retirada efectivo", "disposicion efectivo", "cajero", "atm", "reintegro cajero"] },
  { flowType: "TRANSFERENCIA_ENVIADA", category: "Transferencia Enviada",
    keywords: ["transferencia emitida", "transferencia a ", "transfer enviada", "traspaso enviado", "bizum enviado", "bizum a ", "envio bizum"] },
  { flowType: "COMISIONES", category: "Comisiones Bancarias",
    keywords: ["comision", "comisión", "mantenimiento cuenta", "comision tarjeta", "gastos bancarios", "servicio"] },
];

// SUBCATEGORÍAS DE GASTO (para compras con tarjeta y recibos)
const EXPENSE_SUBCATEGORIES = [
  { category: "Supermercado", isRecurring: false, keywords: ["mercadona", "lidl", "carrefour", "aldi", "eroski", "dia", "alcampo", "hipercor", "ahorramas", "consum", "caprabo", "simply", "bonarea", "gadis", "coviran", "supermercado", "alimentacion", "alimentación", "frutas", "fruteria", "carniceria", "pescaderia", "panaderia"] },
  { category: "Restaurantes", isRecurring: false, keywords: ["restaurante", "cafe", "cafeteria", "starbucks", "mcdonald", "burger", "pizza", "glovo", "uber eats", "just eat", "deliveroo", "telepizza", "dominos", "100montaditos", "vips", "goiko", "lateral", "foster", "asador", "marisqueria", "cerveceria", "taberna", "kebab", "sushi"] },
  { category: "Suministros", isRecurring: true, isFixed: true, keywords: ["endesa", "iberdrola", "naturgy", "movistar", "vodafone", "orange", "telefonica", "yoigo", "masmovil", "o2", "digi", "pepephone", "lowi", "simyo", "agua", "canal isabel", "canal de isabel", "luz", "gas natural", "fibra", "internet", "electricidad", "telefono"] },
  { category: "Suscripciones", isRecurring: true, keywords: ["netflix", "spotify", "hbo", "disney", "amazon prime", "gym", "apple", "youtube premium", "dazn", "crunchyroll", "audible", "chatgpt", "openai", "adobe", "microsoft 365", "icloud", "playstation", "xbox", "nintendo", "patreon", "substack", "medium", "tidal", "paramount", "gimnasio"] },
  { category: "Compras", isRecurring: false, keywords: ["amazon", "aliexpress", "zara", "el corte ingles", "primark", "ikea", "decathlon", "mediamarkt", "fnac", "leroy merlin", "shein", "temu", "wallapop", "bershka", "mango", "pull bear", "massimo dutti", "uniqlo", "h&m", "pccomponentes", "worten"] },
  { category: "Transporte", isRecurring: false, keywords: ["gasolina", "gasolinera", "repsol", "cepsa", "bp", "shell", "taxi", "uber", "cabify", "bolt", "freenow", "metro", "bus", "emt", "renfe", "parking", "parquimetro", "peaje", "autopista", "alsa", "avanza", "blablacar", "itv", "taller", "mecanico", "neumaticos"] },
  { category: "Salud", isRecurring: false, keywords: ["farmacia", "doctor", "hospital", "dentista", "clinica", "optica", "óptica", "fisioterapia", "fisio", "psicologo", "psicólogo", "veterinario", "laboratorio", "radiologia", "pediatra", "ginecologo", "vacuna", "analisis"] },
  { category: "Educación Hija", isRecurring: true, isFixed: true, keywords: ["guarderia", "guardería", "colegio", "escuela infantil", "matricula", "matrícula", "cuota escolar", "ampa", "extraescolar", "campamento", "juguete", "toys", "prenatal", "pañales", "bebe", "bebé", "mothercare", "imaginarium", "dodot", "hero baby"] },
  { category: "Ocio", isRecurring: false, keywords: ["cine", "teatro", "concierto", "festival", "museo", "parque", "zoo", "acuario", "steam", "ticketmaster", "entradas", "bowling", "karaoke", "escape room", "parque atracciones"] },
  { category: "Viajes", isRecurring: false, keywords: ["hotel", "vuelo", "airbnb", "booking", "ryanair", "iberia", "vueling", "easyjet", "expedia", "maleta", "alojamiento", "hostal", "parador", "casa rural", "camping", "rentalcars", "sixt", "europcar"] },
  { category: "Cuidado Personal", isRecurring: false, keywords: ["peluqueria", "peluquería", "barberia", "barbería", "estetica", "estética", "cosmetica", "cosmética", "sephora", "druni", "primor", "rituals", "perfumeria", "manicura", "spa", "masaje"] },
  { category: "Hogar", isRecurring: false, keywords: ["bricomart", "conforama", "colchon", "mueble", "ferreteria", "jardineria", "pintura", "limpieza", "cerrajero", "fontanero", "electricista", "reparacion hogar"] },
  { category: "Regalos/Varios", isRecurring: false, keywords: ["regalo", "flores", "floristeria", "joyeria", "relojeria", "papeleria", "bazar"] },
  { category: "Vivienda", isRecurring: true, isFixed: true, keywords: ["alquiler", "comunidad propietarios", "finca", "inmobiliaria", "portero"] },
];

export function classifyTransaction(description, direction) {
  const flows = direction === "ingreso" ? INCOME_FLOWS : EXPENSE_FLOWS;

  for (const rule of flows) {
    if (matchesAny(description, rule.keywords)) {
      return {
        flowType: rule.flowType,
        category: rule.category,
        isRecurring: rule.isRecurring || false,
        isFixed: rule.isFixed || false,
      };
    }
  }

  if (direction === "gasto") {
    const isCardOrRecibo = matchesAny(description, [
      "recibo", "domiciliacion", "domiciliación", "adeudo", "cargo recibo",
      "compra tarj", "compra tarjeta", "pago con tarjeta", "compra en", "pago en", "tpv", "contactless", "sin contacto"
    ]);

    for (const sub of EXPENSE_SUBCATEGORIES) {
      if (matchesAny(description, sub.keywords)) {
        return {
          flowType: isCardOrRecibo ? "COMPRA_TARJETA" : "RECIBO_DOMICILIADO",
          category: sub.category,
          isRecurring: sub.isRecurring || false,
          isFixed: sub.isFixed || false,
        };
      }
    }

    if (isCardOrRecibo) {
      return { flowType: "COMPRA_TARJETA", category: "Sin Clasificar", isRecurring: false, isFixed: false };
    }
  }

  return { flowType: "DESCONOCIDO", category: "Sin Clasificar", isRecurring: false, isFixed: false };
}

export function detectRecurring(transactions) {
  const descCounts = {};
  transactions.forEach(t => {
    const key = t.description.toLowerCase().substring(0, 30);
    descCounts[key] = (descCounts[key] || 0) + 1;
  });
  transactions.forEach(t => {
    const key = t.description.toLowerCase().substring(0, 30);
    if (descCounts[key] >= 2) t.is_recurring = true;
  });
}

export function detectSalaries(transactions) {
  const salaryTxns = transactions.filter(t =>
    t.direction === "ingreso" && t.category === "Nómina"
  );
  if (salaryTxns.length === 0) return [];

  const groups = [];
  for (const txn of salaryTxns) {
    let matched = false;
    for (const group of groups) {
      const avg = group.reduce((s, t) => s + t.amount, 0) / group.length;
      if (Math.abs(txn.amount - avg) / avg <= 0.1) { group.push(txn); matched = true; break; }
    }
    if (!matched) groups.push([txn]);
  }
  return groups.map(g => ({
    amount: Math.round(g.reduce((s, t) => s + t.amount, 0) / g.length * 100) / 100,
    count: g.length,
    description: g[0].description,
  }));
}