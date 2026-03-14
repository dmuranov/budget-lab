import { useState, useMemo } from "react";

const MONTH_NAMES = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${MONTH_NAMES[month] || month} ${year}`;
}

export function getMonthFromDate(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{4}-\d{2})/);
  return match ? match[1] : null;
}

export function useMonthFilter(transactions) {
  const [selectedMonth, setSelectedMonth] = useState("all");

  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    (transactions || []).forEach(t => {
      const m = getMonthFromDate(t.date);
      if (m) monthSet.add(m);
    });
    return Array.from(monthSet).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (selectedMonth === "all") return transactions;
    return transactions.filter(t => getMonthFromDate(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  const transactionsForCalc = useMemo(() => {
    return filteredTransactions.filter(t => t.category !== "Traspaso Interno");
  }, [filteredTransactions]);

  return {
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    filteredTransactions,
    transactionsForCalc,
  };
}