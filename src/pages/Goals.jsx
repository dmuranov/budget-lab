import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEUR } from "../components/budget/constants";

const DEFAULT_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#2dd4bf"];

function GoalCard({ goal, onEdit, onDelete }) {
  const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
  const remaining = goal.target_amount - (goal.saved_amount || 0);
  const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : null;

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.icon || "🎯"}</span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{goal.name}</h3>
            {monthsLeft && (
              <span className="text-xs" style={{ color: "#64748b" }}>~{monthsLeft} months left</span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg hover:bg-white/5">
            <Pencil size={14} style={{ color: "#64748b" }} />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-white/5">
            <Trash2 size={14} style={{ color: "#64748b" }} />
          </button>
        </div>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span style={{ color: "#94a3b8" }}>{formatEUR(goal.saved_amount || 0)}</span>
        <span style={{ color: "#64748b" }}>{formatEUR(goal.target_amount)}</span>
      </div>

      <div className="h-2.5 rounded-full" style={{ background: "#1a2030" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress, 100)}%`, background: goal.color || "#4ade80" }} />
      </div>

      <div className="flex justify-between mt-2 text-xs" style={{ color: "#64748b" }}>
        <span>{progress.toFixed(0)}%</span>
        {goal.monthly_contribution > 0 && <span>{formatEUR(goal.monthly_contribution)}/mo</span>}
      </div>
    </div>
  );
}

function GoalForm({ goal, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: goal?.name || "",
    icon: goal?.icon || "🎯",
    target_amount: goal?.target_amount || "",
    saved_amount: goal?.saved_amount || 0,
    monthly_contribution: goal?.monthly_contribution || "",
    color: goal?.color || DEFAULT_COLORS[0],
    is_active: goal?.is_active !== false,
  });

  const handleSave = () => {
    onSave({
      ...form,
      target_amount: parseFloat(form.target_amount) || 0,
      saved_amount: parseFloat(form.saved_amount) || 0,
      monthly_contribution: parseFloat(form.monthly_contribution) || 0,
    });
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{goal ? "Edit Goal" : "New Goal"}</h3>
        <button onClick={onCancel}><X size={18} style={{ color: "#64748b" }} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Icon (emoji)</Label>
          <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Name</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Target Amount (€)</Label>
          <Input type="number" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Saved So Far (€)</Label>
          <Input type="number" value={form.saved_amount} onChange={e => setForm({ ...form, saved_amount: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Monthly Contribution (€)</Label>
          <Input type="number" value={form.monthly_contribution} onChange={e => setForm({ ...form, monthly_contribution: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Color</Label>
          <div className="flex gap-2 mt-1">
            {DEFAULT_COLORS.map(c => (
              <button key={c} onClick={() => setForm({ ...form, color: c })}
                className="w-7 h-7 rounded-full transition-transform"
                style={{ background: c, transform: form.color === c ? "scale(1.2)" : "scale(1)", border: form.color === c ? "2px solid white" : "none" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Button onClick={handleSave} style={{ background: "#4ade80", color: "#0b0e13" }}>
          {goal ? "Update Goal" : "Create Goal"}
        </Button>
      </div>
    </div>
  );
}

export default function Goals() {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.FinancialGoal.list(),
  });

  const [editingGoal, setEditingGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = async (data) => {
    if (editingGoal) {
      await base44.entities.FinancialGoal.update(editingGoal.id, data);
    } else {
      await base44.entities.FinancialGoal.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.FinancialGoal.delete(id);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const totalSaved = goals.reduce((s, g) => s + (g.saved_amount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (g.target_amount || 0), 0);
  const totalMonthly = goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <Target size={20} style={{ color: "#4ade80" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Goals</h1>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingGoal(null); }}
          style={{ background: "#4ade80", color: "#0b0e13" }}>
          <Plus size={16} className="mr-2" /> New Goal
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs" style={{ color: "#64748b" }}>Total Saved</div>
            <div className="text-lg font-bold" style={{ color: "#4ade80" }}>{formatEUR(totalSaved)}</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs" style={{ color: "#64748b" }}>Total Target</div>
            <div className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{formatEUR(totalTarget)}</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs" style={{ color: "#64748b" }}>Monthly Commitment</div>
            <div className="text-lg font-bold" style={{ color: "#60a5fa" }}>{formatEUR(totalMonthly)}</div>
          </div>
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingGoal(null); }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(g => (
          <GoalCard key={g.id} goal={g}
            onEdit={(g) => { setEditingGoal(g); setShowForm(true); }}
            onDelete={handleDelete} />
        ))}
      </div>

      {goals.length === 0 && !showForm && (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🎯</span>
          <p className="text-sm" style={{ color: "#64748b" }}>No goals yet. Add your first financial goal!</p>
        </div>
      )}
    </div>
  );
}