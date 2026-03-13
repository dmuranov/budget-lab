import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Save, Check } from "lucide-react";

export default function HouseholdForm({ onBudgetCreated }) {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [nameDado, setNameDado] = useState("Dado");
  const [nameEsposa, setNameEsposa] = useState("Esposa");
  const [salaryDado, setSalaryDado] = useState("");
  const [salaryEsposa, setSalaryEsposa] = useState("");
  const [otrosIngresos, setOtrosIngresos] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: existing = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  useEffect(() => {
    const found = existing.find(b => b.month === month);
    if (found) {
      setNameDado(found.name_person1 || "Dado");
      setNameEsposa(found.name_person2 || "Esposa");
      setSalaryDado(found.salary_person1 || "");
      setSalaryEsposa(found.salary_person2 || "");
      setOtrosIngresos(found.otros_ingresos_esperados || "");
    }
  }, [month, existing]);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      month,
      name_person1: nameDado,
      name_person2: nameEsposa,
      salary_person1: parseFloat(salaryDado) || 0,
      salary_person2: parseFloat(salaryEsposa) || 0,
      otros_ingresos_esperados: parseFloat(otrosIngresos) || 0,
    };
    const found = existing.find(b => b.month === month);
    let budget;
    if (found) {
      await base44.entities.MonthlyBudget.update(found.id, data);
      budget = { ...found, ...data };
    } else {
      budget = await base44.entities.MonthlyBudget.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onBudgetCreated?.(budget);
  };

  const inputStyle = { background: "#1a2030", color: "#f1f5f9" };
  const labelStyle = { color: "#94a3b8" };

  return (
    <div className="rounded-xl p-6" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 className="text-lg font-semibold mb-5" style={{ color: "#f1f5f9" }}>⚙️ Datos del Hogar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label className="text-xs mb-1.5 block" style={labelStyle}>Mes</Label>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border-0" style={inputStyle} />
        </div>
        <div />

        <div>
          <Label className="text-xs mb-1.5 block" style={labelStyle}>Nombre Titular 1</Label>
          <Input value={nameDado} onChange={e => setNameDado(e.target.value)}
            className="border-0" style={inputStyle} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={labelStyle}>Nómina Titular 1 (€/mes neto)</Label>
          <Input type="number" value={salaryDado} onChange={e => setSalaryDado(e.target.value)}
            placeholder="ej: 2.500" className="border-0" style={inputStyle} />
        </div>

        <div>
          <Label className="text-xs mb-1.5 block" style={labelStyle}>Nombre Titular 2 (opcional)</Label>
          <Input value={nameEsposa} onChange={e => setNameEsposa(e.target.value)}
            className="border-0" style={inputStyle} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={labelStyle}>Nómina Titular 2 (€/mes neto)</Label>
          <Input type="number" value={salaryEsposa} onChange={e => setSalaryEsposa(e.target.value)}
            placeholder="ej: 2.200" className="border-0" style={inputStyle} />
        </div>

        <div>
          <Label className="text-xs mb-1.5 block" style={labelStyle}>Otros ingresos esperados (€/mes)</Label>
          <Input type="number" value={otrosIngresos} onChange={e => setOtrosIngresos(e.target.value)}
            placeholder="ej: alquiler Villotilla" className="border-0" style={inputStyle} />
        </div>
      </div>

      <div className="mt-5">
        <Button onClick={handleSave} disabled={saving} className="px-5" style={{ background: "#4ade80", color: "#0b0e13" }}>
          {saved ? <><Check size={16} className="mr-2" />Guardado</> :
            <><Save size={16} className="mr-2" />{saving ? "Guardando..." : "Guardar"}</>}
        </Button>
      </div>
    </div>
  );
}