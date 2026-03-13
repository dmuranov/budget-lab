// Format EUR in Spanish locale
export function formatEUR(amount) {
  if (amount == null || isNaN(amount)) return "0,00 €";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format percentage
export function formatPct(value) {
  if (value == null || isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

// Category config: color + icon
export const CATEGORY_CONFIG = {
  "Groceries":        { color: "#4ade80", icon: "🛒" },
  "Dining Out":       { color: "#fb923c", icon: "🍽️" },
  "Housing":          { color: "#60a5fa", icon: "🏠" },
  "Utilities":        { color: "#a78bfa", icon: "⚡" },
  "Subscriptions":    { color: "#f472b6", icon: "📺" },
  "Shopping":         { color: "#fbbf24", icon: "🛍️" },
  "Transport":        { color: "#2dd4bf", icon: "🚗" },
  "Health":           { color: "#f87171", icon: "💊" },
  "Education":        { color: "#818cf8", icon: "📚" },
  "Entertainment":    { color: "#e879f9", icon: "🎭" },
  "Children":         { color: "#fca5a1", icon: "👶" },
  "Travel":           { color: "#38bdf8", icon: "✈️" },
  "Personal Care":    { color: "#fb7185", icon: "💇" },
  "Insurance":        { color: "#c084fc", icon: "🛡️" },
  "Taxes":            { color: "#cbd5e1", icon: "📋" },
  "Salary":           { color: "#22c55e", icon: "💵" },
  "Pension/Benefits": { color: "#86efac", icon: "🏛️" },
  "Freelance Income": { color: "#a3e635", icon: "💼" },
  "Rental Income":    { color: "#fde047", icon: "🔑" },
  "Loan Payment":     { color: "#ef4444", icon: "🏦" },
  "Mortgage":         { color: "#dc2626", icon: "🏠" },
  "Credit Card":      { color: "#f97316", icon: "💳" },
  "Bank Fees":        { color: "#9ca3af", icon: "🏧" },
  "Cash Withdrawal":  { color: "#78716c", icon: "💶" },
  "Transfer In":      { color: "#6ee7b7", icon: "📥" },
  "Transfer Out":     { color: "#fdba74", icon: "📤" },
  "Internal Transfer":{ color: "#475569", icon: "↔️" },
  "Refund":           { color: "#a7f3d0", icon: "↩️" },
  "Interest Earned":  { color: "#bef264", icon: "📊" },
  "Other Income":     { color: "#a3e635", icon: "📦" },
  "Uncategorized":    { color: "#fde047", icon: "❓" },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

// Needs categories for 50/30/20
export const NEEDS_CATEGORIES = [
  "Housing", "Mortgage", "Utilities", "Groceries", "Transport",
  "Insurance", "Health", "Taxes", "Loan Payment", "Children"
];

export const WANTS_CATEGORIES = [
  "Dining Out", "Shopping", "Subscriptions", "Entertainment",
  "Personal Care", "Travel", "Education"
];

export const FIXED_CATEGORIES = [
  "Mortgage", "Housing", "Loan Payment", "Credit Card",
  "Insurance", "Utilities"
];

export const INCOME_CATEGORIES = [
  "Salary", "Pension/Benefits", "Freelance Income", "Rental Income",
  "Transfer In", "Refund", "Interest Earned", "Other Income"
];