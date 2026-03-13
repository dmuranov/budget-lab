import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEUR } from "../components/budget/constants";

const COLORES = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#2dd4bf"];
const METAS_SUGERIDAS = [
  { nombre: "🛟 Fondo de emergencia", icono: "🛟" },
  { nombre: "📈 Inversión largo plazo", icono: "📈" },
  { nombre: "💳 Liquidar deuda", icono: "💳" },
  { nombre: "✈️ Vacaciones", icono: "✈️" },
  { nombre: "🏠 Reforma hogar", icono: "🏠" },
  { nombre: "🎓 Educación", icono: "🎓" },
];

function TarjetaMeta({ meta, onEdit, onDelete }) {
  const progress = meta.target_amount > 0 ? ((meta.saved_amount || 0) / meta.target_amount) * 100 : 0;
  const restante = meta.target_amount - (meta.saved_amount || 0);
  const mesesRestantes = meta.monthly_contribution > 0 ? Math.ceil(restante / meta.monthly_contribution) : null;

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon || "🎯"}</span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{meta.name}</h3>
            {mesesRestantes && <span className="text-xs" style={{ color: "#64748b" }}>~{mesesRestantes} meses</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(meta)} className="p-1.5 rounded-lg hover:bg-white/5">
            <Pencil size={14} style={{ color: "#64748b" }} />
          </button>
          <button onClick={() => onDelete(meta.id)} className="p-1.5 rounded-lg hover:bg-white/5">
            <Trash2 size={14} style={{ color: "#64748b" }} />
          </button>
        </div>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span style={{ color: "#94a3b8" }}>{formatEUR(meta.saved_amount || 0)}</span>
        <span style={{ color: "#64748b" }}>{formatEUR(meta.target_amount)}</span>
      </div>
      <div className="h-2.5 rounded-full" style={{ background: "#1a2030" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress, 100)}%`, background: meta.color || "#4ade80" }} />
      </div>
      <div className="flex justify-between mt-2 text-xs" style={{ color: "#64748b" }}>
        <span>{progress.toFixed(0)}%</span>
        {meta.monthly_contribution > 0 && <span>{formatEUR(meta.monthly_contribution)}/mes</span>}
      </div>
    </div>
  );
}

function FormularioMeta({ meta, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: meta?.name || "",
    icon: meta?.icon || "🎯",
    target_amount: meta?.target_amount || "",
    saved_amount: meta?.saved_amount || 0,
    monthly_contribution: meta?.monthly_contribution || "",
    color: meta?.color || COLORES[0],
    is_active: meta?.is_active !== false,
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
        <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{meta ? "Editar Meta" : "Nueva Meta"}</h3>
        <button onClick={onCancel}><X size={18} style={{ color: "#64748b" }} /></button>
      </div>

      {/* Sugerencias */}
      {!meta && (
        <div className="flex flex-wrap gap-1 mb-4">
          {METAS_SUGERIDAS.map(s => (
            <button key={s.nombre} onClick={() => setForm({ ...form, name: s.nombre, icon: s.icono })}
              className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Icono (emoji)</Label>
          <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Nombre de la meta</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Importe objetivo (€)</Label>
          <Input type="number" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Ya ahorrado (€)</Label>
          <Input type="number" value={form.saved_amount} onChange={e => setForm({ ...form, saved_amount: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Aportación mensual (€)</Label>
          <Input type="number" value={form.monthly_contribution} onChange={e => setForm({ ...form, monthly_contribution: e.target.value })}
            className="border-0" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        </div>
        <div>
          <Label className="text-xs mb-1 block" style={{ color: "#94a3b8" }}>Color</Label>
          <div className="flex gap-2 mt-1">
            {COLORES.map(c => (
              <button key={c} onClick={() => setForm({ ...form, color: c })}
                className="w-7 h-7 rounded-full transition-transform"
                style={{ background: c, transform: form.color === c ? "scale(1.2)" : "scale(1)", border: form.color === c ? "2px solid white" : "none" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Button onClick={handleSave} style={{ background: "#4ade80", color: "#0b0e13" }}>
          {meta ? "Actualizar Meta" : "Crear Meta"}
        </Button>
      </div>
    </div>
  );
}

export default function Metas() {
  const queryClient = useQueryClient();
  const { data: metas = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.FinancialGoal.list(),
  });

  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleSave = async (data) => {
    if (editando) await base44.entities.FinancialGoal.update(editando.id, data);
    else await base44.entities.FinancialGoal.create(data);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    setMostrarForm(false);
    setEditando(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.FinancialGoal.delete(id);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const totalAhorrado = metas.reduce((s, m) => s + (m.saved_amount || 0), 0);
  const totalObjetivo = metas.reduce((s, m) => s + (m.target_amount || 0), 0);
  const totalMensual = metas.reduce((s, m) => s + (m.monthly_contribution || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <Target size={20} style={{ color: "#4ade80" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>🎯 Metas Financieras</h1>
        </div>
        <Button onClick={() => { setMostrarForm(true); setEditando(null); }}
          style={{ background: "#4ade80", color: "#0b0e13" }}>
          <Plus size={16} className="mr-2" /> Nueva Meta
        </Button>
      </div>

      {metas.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total ahorrado", val: formatEUR(totalAhorrado), color: "#4ade80" },
            { label: "Objetivo total", val: formatEUR(totalObjetivo), color: "#f1f5f9" },
            { label: "Compromiso mensual", val: formatEUR(totalMensual), color: "#60a5fa" },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs" style={{ color: "#64748b" }}>{item.label}</div>
              <div className="text-lg font-bold" style={{ color: item.color }}>{item.val}</div>
            </div>
          ))}
        </div>
      )}

      {mostrarForm && (
        <FormularioMeta meta={editando} onSave={handleSave}
          onCancel={() => { setMostrarForm(false); setEditando(null); }} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metas.map(m => (
          <TarjetaMeta key={m.id} meta={m}
            onEdit={(m) => { setEditando(m); setMostrarForm(true); }}
            onDelete={handleDelete} />
        ))}
      </div>

      {metas.length === 0 && !mostrarForm && (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🎯</span>
          <p className="text-sm" style={{ color: "#64748b" }}>Sin metas todavía. ¡Añade tu primera meta financiera!</p>
        </div>
      )}
    </div>
  );
}