import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEUR } from "../components/budget/constants";

const SUGERENCIAS_ACTIVOS = ["Cuenta corriente", "Cuenta ahorro", "Inversiones", "Piso Madrid", "Casa Villotilla", "Coche", "Plan de pensiones"];
const SUGERENCIAS_PASIVOS = ["Hipoteca pendiente", "Préstamo personal", "Deuda tarjeta crédito"];

function FilaActivo({ item, onDelete }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-sm" style={{ color: "#f1f5f9" }}>{item.name}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: item.type === "asset" ? "#4ade80" : "#f87171" }}>
          {formatEUR(item.value)}
        </span>
        <button onClick={() => onDelete(item.id)} className="opacity-40 hover:opacity-100 transition-opacity">
          <Trash2 size={14} style={{ color: "#f87171" }} />
        </button>
      </div>
    </div>
  );
}

function FormularioAñadir({ type, sugerencias, onAdd }) {
  const [nombre, setNombre] = useState("");
  const [valor, setValor] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = async () => {
    if (!nombre || !valor) return;
    await onAdd({ name: nombre, value: parseFloat(valor), type });
    setNombre(""); setValor(""); setShow(false);
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="flex items-center gap-1 text-xs mt-3 transition-colors" style={{ color: "#4ade80" }}>
        <Plus size={14} /> Añadir {type === "asset" ? "activo" : "pasivo"}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-1 mb-2">
        {sugerencias.map(s => (
          <button key={s} onClick={() => setNombre(s)}
            className="text-xs px-2 py-1 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre"
          className="border-0 text-sm flex-1" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="€"
          className="border-0 text-sm w-28" style={{ background: "#1a2030", color: "#f1f5f9" }} />
        <Button onClick={handleSubmit} size="sm" style={{ background: "#4ade80", color: "#0b0e13" }}>Añadir</Button>
      </div>
    </div>
  );
}

export default function Patrimonio() {
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const activos = items.filter(i => i.type === "asset");
  const pasivos = items.filter(i => i.type === "liability");
  const totalActivos = activos.reduce((s, i) => s + (i.value || 0), 0);
  const totalPasivos = pasivos.reduce((s, i) => s + (i.value || 0), 0);
  const patrimonioNeto = totalActivos - totalPasivos;

  const handleAdd = async (data) => {
    await base44.entities.Asset.create(data);
    queryClient.invalidateQueries({ queryKey: ["assets"] });
  };

  const handleDelete = async (id) => {
    await base44.entities.Asset.delete(id);
    queryClient.invalidateQueries({ queryKey: ["assets"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
          <Landmark size={20} style={{ color: "#4ade80" }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>🏦 Patrimonio Neto</h1>
      </div>

      {/* Número grande */}
      <div className="rounded-xl p-8 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-sm mb-2" style={{ color: "#64748b" }}>Patrimonio Neto Total</div>
        <div className="text-4xl md:text-5xl font-bold" style={{ color: patrimonioNeto >= 0 ? "#4ade80" : "#f87171" }}>
          {formatEUR(patrimonioNeto)}
        </div>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <span style={{ color: "#4ade80" }}>Activos: {formatEUR(totalActivos)}</span>
          <span style={{ color: "#f87171" }}>Pasivos: {formatEUR(totalPasivos)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activos */}
        <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#4ade80" }}>Activos</h3>
            <span className="text-sm font-bold" style={{ color: "#4ade80" }}>{formatEUR(totalActivos)}</span>
          </div>
          {activos.map(a => <FilaActivo key={a.id} item={a} onDelete={handleDelete} />)}
          {activos.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>Sin activos todavía</p>}
          <FormularioAñadir type="asset" sugerencias={SUGERENCIAS_ACTIVOS} onAdd={handleAdd} />
        </div>

        {/* Pasivos */}
        <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#f87171" }}>Pasivos</h3>
            <span className="text-sm font-bold" style={{ color: "#f87171" }}>{formatEUR(totalPasivos)}</span>
          </div>
          {pasivos.map(l => <FilaActivo key={l.id} item={l} onDelete={handleDelete} />)}
          {pasivos.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>Sin pasivos registrados</p>}
          <FormularioAñadir type="liability" sugerencias={SUGERENCIAS_PASIVOS} onAdd={handleAdd} />
        </div>
      </div>
    </div>
  );
}