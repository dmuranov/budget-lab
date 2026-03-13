// Formatea EUR en locale español
export function formatEUR(amount) {
  if (amount == null || isNaN(amount)) return "0,00 €";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(value) {
  if (value == null || isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

// Configuración de categorías: color + icono
export const CATEGORY_CONFIG = {
  "Supermercado":          { color: "#4ade80", icon: "🛒" },
  "Restaurantes":          { color: "#fb923c", icon: "🍽️" },
  "Vivienda":              { color: "#60a5fa", icon: "🏠" },
  "Suministros":           { color: "#a78bfa", icon: "⚡" },
  "Suscripciones":         { color: "#f472b6", icon: "📺" },
  "Compras":               { color: "#fbbf24", icon: "🛍️" },
  "Transporte":            { color: "#2dd4bf", icon: "🚗" },
  "Salud":                 { color: "#f87171", icon: "💊" },
  "Educación Hija":        { color: "#fca5a1", icon: "👶" },
  "Ocio":                  { color: "#e879f9", icon: "🎭" },
  "Viajes":                { color: "#38bdf8", icon: "✈️" },
  "Cuidado Personal":      { color: "#fb7185", icon: "💇" },
  "Seguros":               { color: "#c084fc", icon: "🛡️" },
  "Impuestos/Tasas":       { color: "#cbd5e1", icon: "📋" },
  "Regalos/Varios":        { color: "#fdba74", icon: "🎁" },
  "Hogar":                 { color: "#a3e635", icon: "🔧" },
  "Nómina":                { color: "#22c55e", icon: "💵" },
  "Pensión/Prestación":    { color: "#86efac", icon: "🏛️" },
  "Ingreso Profesional":   { color: "#a3e635", icon: "💼" },
  "Ingreso Alquiler":      { color: "#fde047", icon: "🔑" },
  "Hipoteca":              { color: "#dc2626", icon: "🏠" },
  "Préstamo":              { color: "#ef4444", icon: "🏦" },
  "Pago Tarjeta Crédito":  { color: "#f97316", icon: "💳" },
  "Comisiones Bancarias":  { color: "#9ca3af", icon: "🏧" },
  "Efectivo":              { color: "#78716c", icon: "💶" },
  "Transferencia Recibida":{ color: "#6ee7b7", icon: "📥" },
  "Transferencia Enviada": { color: "#fdba74", icon: "📤" },
  "Traspaso Interno":      { color: "#475569", icon: "↔️" },
  "Devolución":            { color: "#a7f3d0", icon: "↩️" },
  "Intereses":             { color: "#bef264", icon: "📊" },
  "Otro Ingreso":          { color: "#a3e635", icon: "📦" },
  "Sin Clasificar":        { color: "#fde047", icon: "❓" },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

// Categorías para la regla 50/30/20
export const NECESIDADES_CATEGORIAS = [
  "Vivienda", "Hipoteca", "Suministros", "Supermercado", "Transporte",
  "Seguros", "Salud", "Impuestos/Tasas", "Préstamo", "Educación Hija"
];

export const DESEOS_CATEGORIAS = [
  "Restaurantes", "Compras", "Suscripciones", "Ocio",
  "Cuidado Personal", "Viajes", "Regalos/Varios", "Hogar"
];

export const GASTOS_FIJOS_CATEGORIAS = [
  "Hipoteca", "Vivienda", "Préstamo", "Pago Tarjeta Crédito",
  "Seguros", "Suministros", "Educación Hija"
];

export const INGRESO_CATEGORIAS = [
  "Nómina", "Pensión/Prestación", "Ingreso Profesional", "Ingreso Alquiler",
  "Transferencia Recibida", "Devolución", "Intereses", "Otro Ingreso"
];

export const DEUDA_CATEGORIAS = ["Préstamo", "Hipoteca", "Pago Tarjeta Crédito"];