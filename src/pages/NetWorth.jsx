import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEUR } from "../components/budget/constants";

function AssetRow({ item, onDelete }) {
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

function AddForm({ type, onAdd }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = async () => {
    if (!name || !value) return;
    await onAdd({ name, value: parseFloat(value), type });
    setName("");
    setValue("");
    setShow(false);
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)}
        className="flex items-center gap-1 text-xs mt-3 transition-colors"
        style={{ color: "#4ade80" }}>
        <Plus size={14} /> Add {type}
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-3">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
        className="border-0 text-sm flex-1" style={{ background: "#1a2030", color: "#f1f5f9" }} />
      <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="€"
        className="border-0 text-sm w-28" style={{ background: "#1a2030", color: "#f1f5f9" }} />
      <Button onClick={handleSubmit} size="sm" style={{ background: "#4ade80", color: "#0b0e13" }}>Add</Button>
    </div>
  );
}

export default function NetWorth() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const assets = items.filter(i => i.type === "asset");
  const liabilities = items.filter(i => i.type === "liability");
  const totalAssets = assets.reduce((s, i) => s + (i.value || 0), 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + (i.value || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

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
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Net Worth</h1>
      </div>

      {/* Big net worth number */}
      <div className="rounded-xl p-8 text-center" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-sm mb-2" style={{ color: "#64748b" }}>Total Net Worth</div>
        <div className="text-4xl md:text-5xl font-bold" style={{ color: netWorth >= 0 ? "#4ade80" : "#f87171" }}>
          {formatEUR(netWorth)}
        </div>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <span style={{ color: "#4ade80" }}>Assets: {formatEUR(totalAssets)}</span>
          <span style={{ color: "#f87171" }}>Liabilities: {formatEUR(totalLiabilities)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#4ade80" }}>Assets</h3>
            <span className="text-sm font-bold" style={{ color: "#4ade80" }}>{formatEUR(totalAssets)}</span>
          </div>
          {assets.map(a => <AssetRow key={a.id} item={a} onDelete={handleDelete} />)}
          {assets.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>No assets added yet</p>}
          <AddForm type="asset" onAdd={handleAdd} />
        </div>

        {/* Liabilities */}
        <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#f87171" }}>Liabilities</h3>
            <span className="text-sm font-bold" style={{ color: "#f87171" }}>{formatEUR(totalLiabilities)}</span>
          </div>
          {liabilities.map(l => <AssetRow key={l.id} item={l} onDelete={handleDelete} />)}
          {liabilities.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>No liabilities added</p>}
          <AddForm type="liability" onAdd={handleAdd} />
        </div>
      </div>
    </div>
  );
}