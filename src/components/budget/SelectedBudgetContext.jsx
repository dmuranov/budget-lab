import React, { createContext, useContext, useState } from "react";

const SelectedBudgetContext = createContext(null);

export function SelectedBudgetProvider({ children }) {
  const [selectedId, setSelectedId] = useState(null); // null = primer presupuesto (más reciente)
  return (
    <SelectedBudgetContext.Provider value={{ selectedId, setSelectedId }}>
      {children}
    </SelectedBudgetContext.Provider>
  );
}

export function useSelectedBudget() {
  return useContext(SelectedBudgetContext);
}