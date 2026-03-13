import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Key, Check } from "lucide-react";
import { useAppSettings } from "../budget/useAppSettings";

export default function APIKeySection() {
  const { getSetting, setSetting, isLoading } = useAppSettings();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const stored = getSetting("claude_api_key");
      if (stored) setApiKey(stored);
    }
  }, [isLoading]);

  const handleSave = async () => {
    await setSetting("claude_api_key", apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "#151a22", border: "1px solid rgba(167,139,250,0.2)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Key size={16} style={{ color: "#a78bfa" }} />
        <h2 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>🔑 API Key de Claude (Anthropic)</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: "#64748b" }}>
        Necesaria para la clasificación automática con IA y el Asesor Financiero.
        Se guarda en tu cuenta — funciona en todos tus dispositivos automáticamente.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full h-9 rounded-md px-3 pr-10 text-sm border-0 outline-none"
            style={{ background: "#1a2030", color: "#f1f5f9" }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            style={{ color: "#64748b" }}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="px-4 h-9 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all"
          style={{
            background: saved ? "rgba(74,222,128,0.15)" : "#a78bfa",
            color: saved ? "#4ade80" : "#0b0e13",
            opacity: !apiKey.trim() ? 0.5 : 1,
          }}
        >
          {saved ? <><Check size={14} /> Guardada</> : "Guardar"}
        </button>
      </div>

      {apiKey && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
          <span className="text-xs" style={{ color: "#4ade80" }}>
            API key configurada — sincronizada en todos tus dispositivos
          </span>
        </div>
      )}
    </div>
  );
}