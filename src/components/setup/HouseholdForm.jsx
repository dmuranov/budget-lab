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
  const [name1, setName1] = useState("Dado");
  const [name2, setName2] = useState("");
  const [salary1, setSalary1] = useState("");
  const [salary2, setSalary2] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check if budget already exists for this month
  const { data: existing = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => base44.entities.MonthlyBudget.list("-month", 50),
  });

  useEffect(() => {
    const found = existing.find(b => b.month === month);
    if (found) {
      setName1(found.name_person1 || "Dado");
      setName2(found.name_person2 || "");
      setSalary1(found.salary_person1 || "");
      setSalary2(found.salary_person2 || "");
    }
  }, [month, existing]);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      month,
      name_person1: name1,
      name_person2: name2,
      salary_person1: parseFloat(salary1) || 0,
      salary_person2: parseFloat(salary2) || 0,
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

  return (
    <div className="rounded-xl p-6" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 className="text-lg font-semibold mb-5" style={{ color: "#f1f5f9" }}>Household Info</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Month</Label>
          <Input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border-0"
            style={{ background: "#1a2030", color: "#f1f5f9" }}
          />
        </div>
        <div />

        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Person 1 Name</Label>
          <Input value={name1} onChange={e => setName1(e.target.value)}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Person 1 Net Salary (€/month)</Label>
          <Input type="number" value={salary1} onChange={e => setSalary1(e.target.value)}
            placeholder="e.g. 2500"
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>

        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Person 2 Name (optional)</Label>
          <Input value={name2} onChange={e => setName2(e.target.value)}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Person 2 Net Salary (€/month)</Label>
          <Input type="number" value={salary2} onChange={e => setSalary2(e.target.value)}
            placeholder="e.g. 2200"
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
      </div>

      <div className="mt-5">
        <Button onClick={handleSave} disabled={saving}
          className="px-5" style={{ background: "#4ade80", color: "#0b0e13" }}>
          {saved ? <><Check size={16} className="mr-2" /> Saved</> :
            <><Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save"}</>}
        </Button>
      </div>
    </div>
  );
}